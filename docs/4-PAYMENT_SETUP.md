# Scholax Payment Setup

## Overview
Scholax supports three payment methods:
1. **Stripe** - Cards (international)
2. **PayPal** - Wallet + cards
3. **M-Pesa** - Mobile money (Kenya)

## 1. Stripe Setup

### Step 1: Create Account
1. Go to https://stripe.com
2. Sign up with email
3. Verify email and set up account
4. Complete business information

### Step 2: Get API Keys
1. Go to Dashboard → Developers → API Keys
2. Copy:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)

⚠️ **Never commit secret keys to git!**

### Step 3: Configure Environment
Add to `.env.local`:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...
```

### Step 4: Install Stripe Libraries
```bash
npm install @stripe/react-stripe-js @stripe/stripe-js stripe
```

### Step 5: Create Payment Component

Create `src/services/stripeService.ts`:

```typescript
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const createPaymentIntent = async (amount: number, currency: string) => {
  try {
    const response = await axios.post('/api/stripe/create-intent', {
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (
  clientSecret: string,
  elements: any,
  cardElement: any
) => {
  if (!stripe) {
    throw new Error('Stripe not loaded');
  }

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Scholax User',
      },
    },
  });

  return result;
};
```

### Step 6: Backend Endpoint (Node.js/Express)

```typescript
// backend/routes/stripe.ts
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/create-intent', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        userId: req.user?.id,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const event = stripe.webhooks.constructEvent(
    req.body,
    req.headers['stripe-signature']!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update database with successful payment
      break;
    case 'payment_intent.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({received: true});
});

export default router;
```

## 2. PayPal Setup

### Step 1: Create PayPal Account
1. Go to https://developer.paypal.com
2. Sign up and verify email
3. Go to Dashboard → Apps & Credentials
4. Create Application (name: "Scholax")

### Step 2: Get Client ID
1. Copy Client ID (appears under app name)
2. Add to `.env.local`:

```env
VITE_PAYPAL_CLIENT_ID=your_client_id_here
```

### Step 3: Install PayPal SDK
```bash
npm install @paypal/checkout-server-sdk
```

### Step 4: Create Payment Service

```typescript
// src/services/paypalService.ts
export const createPayPalOrder = async (amount: number) => {
  try {
    const response = await axios.post('/api/paypal/create-order', {
      amount,
    });
    return response.data;
  } catch (error) {
    console.error('Failed to create PayPal order:', error);
    throw error;
  }
};

export const capturePayPalOrder = async (orderId: string) => {
  try {
    const response = await axios.post(`/api/paypal/capture/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to capture PayPal order:', error);
    throw error;
  }
};
```

### Step 5: Backend Endpoint

```typescript
// backend/routes/paypal.ts
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  try {
    const order = await axios.post(
      'https://api-m.sandbox.paypal.com/v2/checkout/orders',
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amount.toFixed(2),
          },
        }],
        return_url: `${process.env.APP_URL}/deposit?status=success`,
        cancel_url: `${process.env.APP_URL}/deposit?status=cancel`,
      },
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID!,
          password: process.env.PAYPAL_SECRET!,
        },
      }
    );

    res.json({ orderId: order.data.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/capture/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    const response = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID!,
          password: process.env.PAYPAL_SECRET!,
        },
      }
    );

    // Update database with successful payment
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

## 3. M-Pesa Setup (Kenya)

### Prerequisites
- Business account with Safaricom M-Pesa
- API credentials from Safaricom

### Step 1: Get M-Pesa Credentials

Contact Safaricom for:
- **Consumer Key**
- **Consumer Secret**
- **Shortcode** (Business code)
- **Passkey** (for STK Push)

### Step 2: Configure Environment

```env
VITE_MPESA_SHORTCODE=your_shortcode
VITE_MPESA_CONSUMER_KEY=your_key
VITE_MPESA_CONSUMER_SECRET=your_secret
VITE_MPESA_PASSKEY=your_passkey
```

### Step 3: Install M-Pesa Library
```bash
npm install mpesa-api-nodejs
```

### Step 4: Create M-Pesa Service

```typescript
// src/services/mpesaService.ts
import axios from 'axios';

const MPESA_AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const MPESA_STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

let token: string;

async function getAccessToken() {
  const auth = Buffer.from(
    `${import.meta.env.VITE_MPESA_CONSUMER_KEY}:${import.meta.env.VITE_MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(MPESA_AUTH_URL, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  return response.data.access_token;
}

export const initiateSTKPush = async (
  phoneNumber: string,
  amount: number,
  accountReference: string
) => {
  try {
    token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${import.meta.env.VITE_MPESA_SHORTCODE}${import.meta.env.VITE_MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      MPESA_STK_URL,
      {
        BusinessShortCode: import.meta.env.VITE_MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber.replace('+', ''),
        PartyB: import.meta.env.VITE_MPESA_SHORTCODE,
        PhoneNumber: phoneNumber.replace('+', ''),
        CallBackURL: `${import.meta.env.VITE_API_URL}/api/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: 'Scholax Deposit',
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('STK Push failed:', error);
    throw error;
  }
};

export const checkTransactionStatus = async (checkoutRequestId: string) => {
  try {
    token = await getAccessToken();

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(
      `${import.meta.env.VITE_MPESA_SHORTCODE}${import.meta.env.VITE_MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: import.meta.env.VITE_MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Status check failed:', error);
    throw error;
  }
};
```

## Payment Flow Integration

### Frontend Form

```typescript
// src/components/PaymentForm.tsx
import { useState } from 'react';

export default function PaymentForm({ amount, currency }) {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'stripe') {
        // Call Stripe
      } else if (paymentMethod === 'paypal') {
        // Call PayPal
      } else if (paymentMethod === 'mpesa') {
        // Call M-Pesa
        const result = await initiateSTKPush(phoneNumber, amount, `scholax-${Date.now()}`);
        console.log('STK Prompt sent:', result);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePayment}>
      {/* Form fields */}
    </form>
  );
}
```

## Webhook Configuration

### Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### PayPal Webhook
1. Go to PayPal Developer → Apps & Credentials
2. Configure IPN (Instant Payment Notification)
3. Set URL: `https://yourdomain.com/api/paypal/webhook`

### M-Pesa Callback
1. Set in M-Pesa credentials configuration
2. URL: `https://yourdomain.com/api/mpesa/callback`

## Production Checklist

### Stripe
- [ ] Switch from test to live keys
- [ ] Configure production webhook
- [ ] Enable 3D Secure
- [ ] Set up fraud detection
- [ ] Configure payment retry logic

### PayPal
- [ ] Switch to production credentials
- [ ] Update return URLs
- [ ] Configure IPN for production
- [ ] Test with live accounts

### M-Pesa
- [ ] Get production credentials from Safaricom
- [ ] Update shortcode and passkey
- [ ] Configure production callback URL
- [ ] Test with real M-Pesa numbers

## Security Best Practices

1. **Never log full card numbers**
2. **Use HTTPS only**
3. **Store tokens securely** - don't store raw card data
4. **Validate amounts** on backend
5. **Rate limit** payment endpoints
6. **Monitor failed** transactions
7. **Keep credentials** in environment variables

## Testing

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

### Test M-Pesa Numbers
- Use sandbox phone numbers provided by Safaricom

## Cost Estimation

| Provider | Fee | Minimum |
|----------|-----|---------|
| Stripe | 2.9% + $0.30 | $0.50 |
| PayPal | 2.99% + $0.30 | $0.01 |
| M-Pesa | ~2% | 10 KES |

## References
- Stripe: https://stripe.com/docs
- PayPal: https://developer.paypal.com/docs
- M-Pesa API: https://developer.safaricom.co.ke/
