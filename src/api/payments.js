// Production-ready payment API service
// This handles all Stripe payment processing securely

import { auth } from '@/lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get the current user's ID token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

export const PaymentAPI = {
  // Create payment intent (requires backend)
  createPaymentIntent: async (paymentData) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Math.round(paymentData.amount * 100), // Convert to cents
          currency: 'usd',
          product_id: paymentData.productId,
          seller_id: paymentData.sellerId,
          buyer_id: paymentData.buyerId,
          product_title: paymentData.productTitle,
          is_digital: paymentData.isDigital,
          metadata: {
            conversation_id: paymentData.conversationId,
            handoff_code: paymentData.handoffCode
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  },

  // Confirm payment (requires backend)
  confirmPayment: async (paymentIntentId, paymentMethodId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment confirmation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  },

  // Verify handoff code and release payment (requires backend)
  verifyHandoffAndRelease: async (transactionId, handoffCode, sellerId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/payments/verify-handoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          handoff_code: handoffCode,
          seller_id: sellerId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Handoff verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Handoff verification failed:', error);
      throw error;
    }
  },

  // Get transaction status
  getTransactionStatus: async (transactionId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/payments/transaction/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get transaction status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw error;
    }
  }
};