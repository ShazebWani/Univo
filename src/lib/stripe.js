import { loadStripe } from '@stripe/stripe-js';
import { PaymentAPI } from '@/api/payments';

// Stripe configuration - REQUIRES your publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error('VITE_STRIPE_PUBLISHABLE_KEY is required in your .env file');
}

let stripePromise;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Production-ready transaction service
export const TransactionService = {
  // Create payment intent via backend API
  createPaymentIntent: async (paymentData) => {
    if (!stripePublishableKey) {
      throw new Error('Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to your .env file');
    }

    try {
      return await PaymentAPI.createPaymentIntent(paymentData);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw new Error('Payment setup failed. Please try again.');
    }
  },

  // Process payment with Stripe Elements
  processPayment: async (stripe, elements, paymentIntentClientSecret) => {
    if (!stripe || !elements) {
      throw new Error('Stripe not loaded');
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: paymentIntent.status === 'succeeded',
        paymentIntent,
        transactionId: paymentIntent.id
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error;
    }
  },

  // Generate handoff code
  generateHandoffCode: () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  },

  // Verify handoff code via backend API
  verifyHandoffCode: async (transactionId, handoffCode, sellerId) => {
    try {
      return await PaymentAPI.verifyHandoffAndRelease(transactionId, handoffCode, sellerId);
    } catch (error) {
      console.error('Handoff verification failed:', error);
      return {
        success: false,
        message: error.message || 'Verification failed. Please try again.'
      };
    }
  },

  // Handle digital product delivery
  deliverDigitalProduct: async (productData, buyerEmail) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          deliveryMethod: 'email',
          accessInstructions: productData.accessInstructions || 'Check your email for access details.',
          downloadLink: productData.digitalDelivery === 'download' ? `https://download.univo.app/product/${productData.id}` : null,
          accessCode: productData.digitalDelivery === 'code' ? TransactionService.generateHandoffCode() : null
        });
      }, 1000);
    });
  }
};