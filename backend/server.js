require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const app = express();

// Firebase Admin Initialization
const serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

// 🚀 Create Payment Intent
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const {
      amount, currency, product_id, seller_id, buyer_id,
      product_title, is_digital, metadata
    } = req.body;

    console.log('💰 Payment intent request:', { seller_id, buyer_id, amount, product_title });

    const token = req.headers.authorization?.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('🔐 Authenticated user:', decodedToken.uid);
    
    // Allow seller to create payment intents for buyers
    if (decodedToken.uid !== seller_id && decodedToken.uid !== buyer_id) {
      console.log('❌ Authorization failed: user not seller or buyer');
      return res.status(403).json({ error: 'Unauthorized: Must be seller or buyer' });
    }

    // 🏫 Validate same-school transaction
    try {
      const [sellerDoc, buyerDoc] = await Promise.all([
        admin.firestore().collection('users').doc(seller_id).get(),
        admin.firestore().collection('users').doc(buyer_id).get()
      ]);

      if (!sellerDoc.exists || !buyerDoc.exists) {
        console.log('❌ User data not found');
        return res.status(404).json({ error: 'User data not found' });
      }

      const sellerData = sellerDoc.data();
      const buyerData = buyerDoc.data();
      
      const sellerSchoolDomain = sellerData.schoolDomain || sellerData.email?.split('@')[1]?.toLowerCase();
      const buyerSchoolDomain = buyerData.schoolDomain || buyerData.email?.split('@')[1]?.toLowerCase();

      if (!sellerSchoolDomain || !buyerSchoolDomain || sellerSchoolDomain !== buyerSchoolDomain) {
        console.log('❌ School domain mismatch:', { sellerSchoolDomain, buyerSchoolDomain });
        return res.status(403).json({ error: 'Transactions are only allowed between users from the same school' });
      }

      console.log('✅ Same-school validation passed:', sellerSchoolDomain);
    } catch (schoolValidationError) {
      console.error('❌ School validation error:', schoolValidationError);
      return res.status(500).json({ error: 'Failed to validate school domains' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        product_id,
        seller_id,
        buyer_id,
        product_title,
        is_digital: is_digital.toString(),
        conversation_id: metadata.conversation_id,
        handoff_code: metadata.handoff_code
      },
      capture_method: is_digital ? 'automatic' : 'manual'
    });

    await admin.firestore().collection('transactions').doc(paymentIntent.id).set({
      payment_intent_id: paymentIntent.id,
      amount,
      product_id,
      seller_id,
      buyer_id,
      status: 'pending',
      is_digital,
      handoff_code: metadata.handoff_code,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);
    
    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Confirm Payment
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { payment_intent_id, payment_method_id } = req.body;

    const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: payment_method_id
    });

    const transactionRef = admin.firestore().collection('transactions').doc(payment_intent_id);
    const transactionDoc = await transactionRef.get();
    const transaction = transactionDoc.data();

    await transactionRef.update({
      status: paymentIntent.status === 'succeeded' ? 'paid' : 'failed',
      payment_method_id,
      confirmed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // For digital products, update sales count and mark product as sold immediately
    if (paymentIntent.status === 'succeeded' && transaction?.is_digital) {
      try {
        // Update seller's sales count
        const sellerRef = admin.firestore().collection('users').doc(transaction.seller_id);
        await sellerRef.update({
          total_sales: admin.firestore.FieldValue.increment(1)
        });
        console.log('✅ Digital product seller sales count updated:', transaction.seller_id);

        // Mark the product as sold
        if (transaction.product_id) {
          const productRef = admin.firestore().collection('products').doc(transaction.product_id);
          await productRef.update({
            status: 'sold',
            sold_at: admin.firestore.FieldValue.serverTimestamp(),
            sold_to: transaction.buyer_id
          });
          console.log('✅ Digital product marked as sold:', transaction.product_id);
        }
      } catch (error) {
        console.error('❌ Error updating digital product completion:', error);
      }
    }

    res.json({
      success: paymentIntent.status === 'succeeded',
      payment_intent: paymentIntent
    });
  } catch (err) {
    console.error('Error confirming payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Verify Handoff Code
app.post('/api/payments/verify-handoff', async (req, res) => {
  try {
    const { transaction_id, handoff_code, seller_id } = req.body;

    console.log('🔐 Handoff verification request:', { transaction_id, handoff_code, seller_id });

    const token = req.headers.authorization?.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('🔐 Authenticated user:', decodedToken.uid);
    
    if (decodedToken.uid !== seller_id) {
      console.log('❌ Authorization failed: user not seller');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const docRef = admin.firestore().collection('transactions').doc(transaction_id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = doc.data();
    if (transaction.handoff_code !== handoff_code.toUpperCase()) {
      return res.status(400).json({ error: 'Invalid handoff code' });
    }

    // For test mode with simulated payments, skip Stripe capture
    // In production, you would capture the payment intent here
    console.log('💰 Skipping Stripe capture for test mode - handoff code verified successfully');
    
    // Uncomment this for production with real payments:
    // if (!transaction.is_digital) {
    //   await stripe.paymentIntents.capture(transaction_id);
    // }

    await docRef.update({
      status: 'completed',
      handoff_verified_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mark the product as sold
    if (transaction.product_id) {
      try {
        const productRef = admin.firestore().collection('products').doc(transaction.product_id);
        await productRef.update({
          status: 'sold',
          sold_at: admin.firestore.FieldValue.serverTimestamp(),
          sold_to: transaction.buyer_id
        });
        console.log('✅ Product marked as sold:', transaction.product_id);
      } catch (error) {
        console.error('❌ Error marking product as sold:', error);
      }
    }

    // Update seller's sales count
    try {
      const sellerRef = admin.firestore().collection('users').doc(seller_id);
      await sellerRef.update({
        total_sales: admin.firestore.FieldValue.increment(1)
      });
      console.log('✅ Seller sales count updated:', seller_id);
    } catch (error) {
      console.error('❌ Error updating seller sales count:', error);
    }

    console.log('✅ Handoff verification successful:', transaction_id);
    res.json({ success: true, message: 'Transaction completed successfully' });
  } catch (err) {
    console.error('Error verifying handoff:', err);
    res.status(500).json({ error: err.message });
  }
});

// 📦 Get Transaction Status
app.get('/api/payments/transaction/:id', async (req, res) => {
  try {
    const doc = await admin.firestore().collection('transactions').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(doc.data());
  } catch (err) {
    console.error('Error getting transaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
