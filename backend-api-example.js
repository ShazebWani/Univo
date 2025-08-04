// BACKEND API EXAMPLE - You need to implement this server-side
// This is Node.js/Express example using Stripe's server SDK

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Your secret key
const admin = require('firebase-admin'); // For Firebase Admin SDK
const app = express();

app.use(express.json());

// Create Payment Intent
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency, product_id, seller_id, buyer_id, product_title, is_digital, metadata } = req.body;
    
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.uid !== buyer_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create payment intent with Stripe
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
      // Hold the payment until handoff verification (for physical products)
      capture_method: is_digital ? 'automatic' : 'manual'
    });

    // Store transaction in your database
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

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm Payment
app.post('/api/payments/confirm', async (req, res) => {
  try {
    const { payment_intent_id, payment_method_id } = req.body;
    
    // Confirm payment with Stripe
    const paymentIntent = await stripe.paymentIntents.confirm(payment_intent_id, {
      payment_method: payment_method_id
    });

    // Update transaction status
    await admin.firestore().collection('transactions').doc(payment_intent_id).update({
      status: paymentIntent.status === 'succeeded' ? 'paid' : 'failed',
      payment_method_id,
      confirmed_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: paymentIntent.status === 'succeeded',
      payment_intent: paymentIntent
    });
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Handoff Code and Release Payment
app.post('/api/payments/verify-handoff', async (req, res) => {
  try {
    const { transaction_id, handoff_code, seller_id } = req.body;
    
    // Verify user is the seller
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (decodedToken.uid !== seller_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get transaction from database
    const transactionDoc = await admin.firestore().collection('transactions').doc(transaction_id).get();
    const transaction = transactionDoc.data();

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify handoff code
    if (transaction.handoff_code !== handoff_code.toUpperCase()) {
      return res.status(400).json({ error: 'Invalid handoff code' });
    }

    // Capture the payment (release funds to seller)
    if (!transaction.is_digital) {
      await stripe.paymentIntents.capture(transaction_id);
    }

    // Update transaction status
    await admin.firestore().collection('transactions').doc(transaction_id).update({
      status: 'completed',
      handoff_verified_at: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Transaction completed successfully'
    });
  } catch (error) {
    console.error('Handoff verification failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Transaction Status
app.get('/api/payments/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const transactionDoc = await admin.firestore().collection('transactions').doc(id).get();
    const transaction = transactionDoc.data();

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Failed to get transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Environment variables you need:
// STRIPE_SECRET_KEY=sk_test_your_secret_key_here
// FIREBASE_ADMIN_SDK_KEY=path_to_your_service_account_key.json

module.exports = app;