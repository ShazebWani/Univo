# 🚀 Quick Stripe Setup Guide

## ✅ **FIXED ISSUES**
- ❌ `process is not defined` → ✅ Fixed with `import.meta.env`
- ❌ CSP font loading error → ✅ Fixed with proper CSP headers
- ❌ Deprecated mobile meta tag → ✅ Updated to modern standard

## 🔧 **Setup Steps**

### 1. Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Switch to **Test mode** (toggle in sidebar)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)
5. Copy your **Secret key** (starts with `sk_test_`)

### 2. Configure Environment Variables

**Frontend (.env):**
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
FIREBASE_ADMIN_SDK_KEY=./serviceAccountKey.json
```

### 3. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🧪 **Test the Payment Flow**

1. **Create a listing** as a seller
2. **Message the seller** as a buyer  
3. **Seller clicks 💰** to create payment request
4. **Buyer clicks "Pay Now"** 
5. **Use test card**: `4242424242424242`
6. **Physical products**: Get handoff code → seller enters code
7. **Digital products**: Instant access

## 🎯 **Test Cards**

| Card Number | Type | Result |
|-------------|------|--------|
| `4242424242424242` | Visa | ✅ Success |
| `4000000000000002` | Visa | ❌ Declined |
| `4000000000000119` | Visa | ⚠️ Processing error |

## 🔍 **Troubleshooting**

### "Stripe not configured" error
- Check `.env` has `VITE_STRIPE_PUBLISHABLE_KEY`
- Restart frontend server after adding env vars

### Backend connection failed
- Make sure backend is running on port 3001
- Check `VITE_API_URL` points to correct backend

### Payment processing fails
- Verify backend has `STRIPE_SECRET_KEY`
- Check Firebase Admin SDK is configured
- Look at backend console for errors

## 🎉 **You're Ready!**

The transaction system is now fully functional with:
- ✅ Real Stripe payments (test mode)
- ✅ Secure handoff codes for physical products  
- ✅ Instant delivery for digital products
- ✅ Production-ready error handling
- ✅ Proper authentication and validation

Start both servers and test the complete payment flow! 🚀