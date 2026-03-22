# 05 — Customer Order Flow

## What You'll Learn
- How the order creation process works end-to-end
- Building a multi-step form in React
- How pricing is calculated in real-time
- The API endpoint that creates an order

---

## The Order Creation Journey

```
Step 1: Select Subject        Step 2: Select Experiments     Step 3: Upload Files
┌─────────────────────┐      ┌──────────────────────┐      ┌──────────────────────────┐
│ Board: [CBSE ▼]     │      │ ☑ Ohm's Law          │      │ Instruction files:       │
│ Class: [10 ▼]       │      │ ☑ Focal Length        │      │ [📎 practical.pdf]       │
│ Subject: [Physics ▼]│ ──→  │ ☐ Resistors in Series│ ──→  │                          │
│                     │      │ ☑ Refraction          │      │ Pages to print & paste:  │
│                     │      │ Selected: 3           │      │ [📎 diagrams_p1.pdf]     │
└─────────────────────┘      └──────────────────────┘      │ [📎 diagrams_p2.pdf]     │
                                                            │                          │
                                                            │ 💡 Combine your diagrams │
                                                            │ into fewer pages to save │
                                                            │ on printing costs!       │
                                                            └──────────────────────────┘
          │
          ▼
Step 4: Delivery Address       Step 5: Review & Pay
┌──────────────────────┐      ┌──────────────────────────────┐
│ Name: [Rahul Kumar]  │      │ Physics — CBSE Class 10      │
│ Phone: [9876543210]  │      │                              │
│ Address: [...]       │      │ Experiments (3) .... ₹150.00 │
│ City: [Delhi]        │      │ Print Pages (2) .... ₹10.00  │
│ State: [Delhi]       │ ──→  │ Materials .......... ₹50.00  │
│ Pincode: [110001]    │      │ Shipping ........... ₹80.00  │
│                      │      │ ─────────────────────────── │
│ Instructions:        │      │ Total               ₹290.00  │
│ [Paste page 1 after  │      │                              │
│  experiment 3...]    │      │   [Pay with Razorpay]        │
└──────────────────────┘      └──────────────────────────────┘
```

---

## Multi-Step Form Pattern

In React, a multi-step form typically uses **state to track the current step** and **conditionally renders** the appropriate step component.

```tsx
'use client'
import { useState } from 'react'

export default function OrderForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    subjectId: '',
    experimentIds: [] as string[],
    instructionFiles: [] as File[],
    printPages: [] as File[],
    instructions: '',   // Pasting instructions (optional)
    deliveryName: '',
    deliveryPhone: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPincode: '',
  })

  return (
    <div>
      {step === 1 && <SubjectStep formData={formData} setFormData={setFormData} />}
      {step === 2 && <ExperimentStep formData={formData} setFormData={setFormData} />}
      {step === 3 && <UploadStep formData={formData} setFormData={setFormData} />}
      {step === 4 && <AddressStep formData={formData} setFormData={setFormData} />}
      {step === 5 && <ReviewStep formData={formData} />}

      <div>
        {step > 1 && <button onClick={() => setStep(s => s - 1)}>Back</button>}
        {step < 5 && <button onClick={() => setStep(s => s + 1)}>Next</button>}
      </div>
    </div>
  )
}
```

> **Key concept:** All form data lives in one `formData` state object. Each step reads and updates the parts it needs. This way, going back doesn't lose data.

---

## Pricing Calculation

### On the Frontend (for live preview)
```ts
function calculatePrice(
  experimentCount: number,
  ratePerExperiment: number,   // in paise
  printPageCount: number,
  perPageCost: number,          // in paise
  materialCost: number,         // in paise
  flatShippingRate: number      // in paise
) {
  const experimentsCost = experimentCount * ratePerExperiment
  const printPagesCost = printPageCount * perPageCost
  const total = experimentsCost + printPagesCost + materialCost + flatShippingRate

  return {
    experimentsCost,
    printPagesCost,
    materialsCost: materialCost,
    shippingCost: flatShippingRate,
    totalAmount: total,
  }
}

// Display: (amount / 100).toFixed(2) → "290.00"
```

### On the Backend (source of truth — never trust frontend math)
The API recalculates everything server-side using the same logic but with prices fetched fresh from the database:

```ts
// app/api/orders/route.ts (simplified)
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return unauthorized()

  const body = await request.json()
  const { subjectId, experimentIds, printPageCount, instructions, delivery } = body

  // Fetch prices from DB (source of truth)
  const pricing = await prisma.subjectPricing.findUnique({
    where: { subjectId },
  })
  const shippingConfig = await prisma.platformConfig.findUnique({
    where: { key: 'flat_shipping_rate' },
  })
  const pageConfig = await prisma.platformConfig.findUnique({
    where: { key: 'per_page_cost' },
  })

  // Calculate server-side
  const experimentsCost = experimentIds.length * pricing.ratePerExperiment
  const printPagesCost = printPageCount * parseInt(pageConfig.value)
  const shippingCost = parseInt(shippingConfig.value)
  const totalAmount = experimentsCost + printPagesCost + pricing.materialCost + shippingCost

  // Create order
  const order = await prisma.order.create({
    data: {
      customerId: session.user.id,
      subjectId,
      experimentsCost,
      printPagesCost,
      materialsCost: pricing.materialCost,
      shippingCost,
      totalAmount,
      printPageCount,
      instructions,
      ...delivery,
      experiments: {
        create: experimentIds.map(id => ({ experimentId: id })),
      },
    },
  })

  return NextResponse.json({ order })
}
```

**SQL equivalent of the price fetch:**
```sql
-- Get subject pricing
SELECT "ratePerExperiment", "materialCost"
FROM "SubjectPricing"
WHERE "subjectId" = 'subj_physics_cbse_10';

-- Get platform config
SELECT "value" FROM "PlatformConfig" WHERE "key" = 'flat_shipping_rate';
SELECT "value" FROM "PlatformConfig" WHERE "key" = 'per_page_cost';
```

---

## Subject & Experiment Selection

The subject/experiment lists come from the database (seeded by admin). The frontend fetches them:

```ts
// API: GET /api/subjects?board=CBSE&classLevel=10
const subjects = await prisma.subject.findMany({
  where: { board: 'CBSE', classLevel: '10' },
  include: { experiments: { orderBy: { sortOrder: 'asc' } } },
})
```

```sql
-- SQL equivalent
SELECT s.*, e.*
FROM "Subject" s
JOIN "Experiment" e ON e."subjectId" = s."id"
WHERE s."board" = 'CBSE' AND s."classLevel" = '10'
ORDER BY e."sortOrder" ASC;
```

---

## After Order Creation

```
Order created (status: pending_payment)
           │
           ▼
    Create Razorpay order (see 07-payments-razorpay.md)
           │
           ▼
    Customer pays via Razorpay checkout modal
           │
           ▼
    Razorpay webhook confirms payment
           │
           ▼
    Order status → "paid" (now visible to filemakers)
```

---

## 📖 Docs to Read

1. **[React — Forms](https://react.dev/reference/react-dom/components/input)** — Controlled inputs, form handling
2. **[Next.js — Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)** — Alternative to API routes for form submissions
3. **[MDN — FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)** — For file uploads
4. **[MDN — File Input](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)** — `<input type="file">` basics
