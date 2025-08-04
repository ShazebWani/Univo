# Stripe Test Mode Setup

## Environment Variables

Add these to your `.env` file:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_API_URL=http://localhost:3001/api
```

## Getting Your Test Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Make sure you're in **Test mode** (toggle in the left sidebar)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** (starts with `pk_test_`)

## Test Cards

Use these test card numbers for testing:

- **Visa**: `4242424242424242`
- **Visa (debit)**: `4000056655665556`
- **Mastercard**: `5555555555554444`
- **American Express**: `378282246310005`
- **Declined card**: `4000000000000002`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Transaction Flow

1. **Seller** creates payment request in chat
2. **Buyer** clicks "Pay Now" → Stripe processes payment
3. **Physical products**: Buyer gets handoff code
4. **Digital products**: Buyer gets instant access
5. **Seller** enters handoff code to complete transaction

## Security Notes

- All payments are in TEST mode
- No real money is processed
- Test data is automatically cleared periodically