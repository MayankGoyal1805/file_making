# 07 — Payments (Razorpay)

## What You'll Learn
- How online payments work (the flow between your site, Razorpay, and the bank)
- Razorpay integration step-by-step
- Webhooks — how Razorpay tells your server that payment succeeded
- Why you never trust the frontend for payment confirmation

---

## How Online Payments Work

```
Your Server              Razorpay               Customer's Bank
┌──────────┐            ┌──────────┐            ┌──────────────┐
│ 1. Create │  ────→    │ Creates   │            │              │
│ Razorpay  │  order_id │ order     │            │              │
│ order     │  ←────    │          │            │              │
└──────────┘            └──────────┘            └──────────────┘
     │
     │  Send order_id to frontend
     ▼
┌──────────┐            ┌──────────┐            ┌──────────────┐
│ 2. Open   │  ────→    │ Checkout  │  ────→    │ Customer     │
│ Razorpay  │           │ modal     │           │ enters UPI/  │
│ checkout  │           │ appears   │  ←────    │ card details │
│ on browser│  ←────    │ payment   │  success  │ Bank approves│
└──────────┘  pay_id    │ captured  │            └──────────────┘
                        └──────────┘
                             │
                        3. Webhook
                             │
                             ▼
                        ┌──────────┐
                        │ Your     │
                        │ webhook  │
                        │ endpoint │
                        │ verifies │
                        │ & updates│
                        │ DB       │
                        └──────────┘
```

**Why 3 steps?**
1. You **create an order** on your server (tells Razorpay how much to charge)
2. Customer pays via Razorpay's **checkout UI** (you don't handle card details — Razorpay does)
3. Razorpay sends a **webhook** to your server confirming payment (this is the only reliable confirmation)

---

## Step 1: Create Razorpay Order (Server-Side)

```ts
// app/api/payments/create-order/route.ts
import Razorpay from 'razorpay'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await request.json()

  // Get our order from DB
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.customerId !== session.user.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // Create Razorpay order
  const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount,      // Already in paise!
    currency: 'INR',
    receipt: orderId,               // Your internal reference
  })

  // Save Razorpay order ID in database
  await prisma.payment.create({
    data: {
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: order.totalAmount,
    },
  })

  return NextResponse.json({
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount,
    currency: 'INR',
  })
}
```

**SQL equivalent:**
```sql
-- Fetch order
SELECT * FROM "Order" WHERE "id" = 'order_abc' AND "customerId" = 'user_123';

-- Save payment record
INSERT INTO "Payment" ("id", "orderId", "razorpayOrderId", "amount", "status", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'order_abc', 'order_RzpXXXXXX', 30000, 'created', now(), now());
```

---

## Step 2: Open Razorpay Checkout (Frontend)

```tsx
'use client'

export default function PayButton({ orderId }: { orderId: string }) {

  async function handlePay() {
    // 1. Create Razorpay order on your server
    const res = await fetch('/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    const { razorpayOrderId, amount } = await res.json()

    // 2. Open Razorpay checkout modal
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,  // Public key (safe for frontend)
      amount,
      currency: 'INR',
      name: 'FileMaker',
      description: 'Practical File Order',
      order_id: razorpayOrderId,
      handler: function (response: any) {
        // 3. Payment successful on frontend
        // BUT — don't trust this! Wait for webhook.
        // Just show "Payment processing..." to the user
        console.log('Payment ID:', response.razorpay_payment_id)
        // Redirect to order page
        window.location.href = `/orders/${orderId}?payment=processing`
      },
      prefill: {
        name: 'Student Name',
        email: 'student@example.com',
      },
      theme: {
        color: '#6366f1',  // Your brand color
      },
    }

    const rzp = new (window as any).Razorpay(options)
    rzp.open()
  }

  return <button onClick={handlePay}>Pay Now</button>
}
```

> **IMPORTANT:** The Razorpay script needs to be loaded. Add this to your layout:
> ```html
> <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
> ```

---

## Step 3: Webhook (Server Confirms Payment)

```ts
// app/api/payments/webhook/route.ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-razorpay-signature')!

  // Verify webhook signature (CRITICAL — prevents fake webhooks)
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)

  if (event.event === 'payment.captured') {
    const paymentEntity = event.payload.payment.entity
    const razorpayOrderId = paymentEntity.order_id
    const razorpayPaymentId = paymentEntity.id

    // Update payment record
    const payment = await prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        razorpayPaymentId,
        status: 'captured',
      },
    })

    // Update order status to "paid"
    await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    })
  }

  return NextResponse.json({ received: true })
}
```

**SQL equivalent:**
```sql
-- Update payment
UPDATE "Payment"
SET "razorpayPaymentId" = 'pay_XXXXXXXX', "status" = 'captured', "updatedAt" = now()
WHERE "razorpayOrderId" = 'order_RzpXXXXXX';

-- Update order status
UPDATE "Order"
SET "status" = 'paid', "paidAt" = now(), "updatedAt" = now()
WHERE "id" = 'order_abc';
```

---

## Why Never Trust the Frontend

The `handler` callback in Razorpay checkout fires in the **browser**. A malicious user could:
- Modify the JavaScript to fake a success
- Call your API directly without paying

That's why the **webhook** is the only reliable confirmation. Your server receives it directly from Razorpay's servers, verified with a cryptographic signature.

```
Frontend says "paid" → Nice to know, show loading state
Webhook says "paid"  → Actually update the database ✅
```

---

## Environment Variables

```env
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx        # From Razorpay Dashboard
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx        # From Razorpay Dashboard (NEVER expose)
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxx    # Set in Razorpay Dashboard → Webhooks
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx  # Same as KEY_ID, but NEXT_PUBLIC_ prefix makes it available in browser
```

> **`NEXT_PUBLIC_` prefix:** In Next.js, environment variables are server-only by default. If you need one in the browser, prefix it with `NEXT_PUBLIC_`. Only the key ID should be public — the secret stays server-only.

---

## 📖 Docs to Read

1. **[Razorpay — Web Integration (Standard)](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)** — The official guide
2. **[Razorpay — Webhooks](https://razorpay.com/docs/webhooks/)** — How to set up and verify webhooks
3. **[Razorpay — Test Mode](https://razorpay.com/docs/payments/payments/test-mode/)** — Test cards, test UPI IDs
4. **[MDN — Crypto.createHmac](https://nodejs.org/api/crypto.html#cryptocreatehmacalgorithm-key-options)** — How HMAC signature verification works
