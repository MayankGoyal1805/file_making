# 08 — Filemaker Dashboard

## What You'll Learn
- Filemaker application and onboarding flow
- How filemakers browse and pick orders
- Order assignment logic (first-come-first-served)
- Filemaker's order management dashboard

---

## Filemaker Onboarding Flow

```
1. User (customer) fills       2. Admin reviews in       3. If approved, user
   application form               admin panel               sets up profile
┌─────────────────────┐      ┌─────────────────────┐    ┌─────────────────────┐
│ Name: [already known]│      │ Applicant: Ravi K   │    │ Pickup Address:     │
│ City: [Lucknow]     │      │ City: Lucknow       │    │ [42 MG Road...]     │
│ Pincode: [226001]   │ ──→  │ Pincode: 226001     │──→ │ WhatsApp: [9876...]  │
│ Experience: [...]   │      │ Experience: 2 yrs   │    │ City: [Lucknow]     │
│ Sample Work: [📎]   │      │                     │    │ Pincode: [226001]   │
│                     │      │ [Approve] [Reject]  │    │                     │
│ [Submit Application]│      │                     │    │ [Save Profile]      │
└─────────────────────┘      └─────────────────────┘    └─────────────────────┘
```

### Application API

```ts
// app/api/filemaker/apply/route.ts
export async function POST(request: Request) {
  const session = await auth()
  if (!session) return unauthorized()

  const { city, pincode, experience, sampleWork } = await request.json()

  // Check if already applied
  const existing = await prisma.filemakerApplication.findUnique({
    where: { userId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already applied' }, { status: 400 })
  }

  const application = await prisma.filemakerApplication.create({
    data: {
      userId: session.user.id,
      city,
      pincode,
      experience,
      sampleWork,
    },
  })

  return NextResponse.json({ application }, { status: 201 })
}
```

```sql
-- SQL equivalent
SELECT * FROM "FilemakerApplication" WHERE "userId" = 'user_123';

INSERT INTO "FilemakerApplication" ("id", "userId", "city", "pincode", "experience", "sampleWork", "status", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'user_123', 'Lucknow', '226001', '2 years experience making lab files', NULL, 'pending', now(), now());
```

---

## Browsing Open Orders

Filemakers see orders that are:
- ✅ `status = 'paid'` (payment confirmed)
- ✅ `filemakerId = null` (not yet assigned)

```ts
// app/api/filemaker/open-orders/route.ts
export async function GET() {
  const session = await auth()
  if (!session?.user.isFilemaker) return unauthorized()

  const openOrders = await prisma.order.findMany({
    where: {
      status: 'paid',
      filemakerId: null,
    },
    include: {
      experiments: {
        include: { experiment: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ orders: openOrders })
}
```

```sql
-- SQL equivalent
SELECT o.*, e."name" AS experiment_name
FROM "Order" o
JOIN "OrderExperiment" oe ON oe."orderId" = o."id"
JOIN "Experiment" e ON e."id" = oe."experimentId"
WHERE o."status" = 'paid' AND o."filemakerId" IS NULL
ORDER BY o."createdAt" DESC;
```

### What Filemakers See (Order Card)

```
┌──────────────────────────────────────────┐
│ Physics — CBSE Class 10                  │
│ 5 experiments                            │
│ 2 pages to print                         │
│ Deliver to: Delhi, 110001                │
│ Total: ₹300.00                           │
│                                          │
│ Created: 2 hours ago                     │
│                          [Pick This Order]│
└──────────────────────────────────────────┘
```

> **Privacy:** Filemakers do NOT see the customer's full name, address, or phone until they pick the order. They only see city/pincode and order details.

---

## Order Assignment (Picking an Order)

```ts
// app/api/filemaker/pick-order/route.ts
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user.isFilemaker) return unauthorized()

  const { orderId } = await request.json()

  // Use a transaction to prevent race conditions
  // (two filemakers picking the same order simultaneously)
  const order = await prisma.$transaction(async (tx) => {
    // Lock the row and check it's still available
    const order = await tx.order.findUnique({ where: { id: orderId } })

    if (!order || order.status !== 'paid' || order.filemakerId !== null) {
      throw new Error('Order no longer available')
    }

    // Assign to this filemaker
    return tx.order.update({
      where: { id: orderId },
      data: {
        filemakerId: session.user.id,
        status: 'assigned',
        assignedAt: new Date(),
      },
    })
  })

  return NextResponse.json({ order })
}
```

```sql
-- SQL equivalent (simplified — the transaction prevents race conditions)
BEGIN;

SELECT * FROM "Order" WHERE "id" = 'order_abc' FOR UPDATE;
-- FOR UPDATE locks the row so other transactions wait

UPDATE "Order"
SET "filemakerId" = 'user_maker_1',
    "status" = 'assigned',
    "assignedAt" = now(),
    "updatedAt" = now()
WHERE "id" = 'order_abc' AND "status" = 'paid' AND "filemakerId" IS NULL;

COMMIT;
```

> **Race condition:** If two filemakers click "Pick" at the same time, the `$transaction` with the check ensures only one succeeds. The other gets "Order no longer available."

---

## Filemaker Dashboard — My Orders

```ts
// Fetch orders assigned to this filemaker
const myOrders = await prisma.order.findMany({
  where: { filemakerId: session.user.id },
  include: {
    customer: { select: { name: true, phone: true } },
    experiments: { include: { experiment: true } },
    files: true,
  },
  orderBy: { assignedAt: 'desc' },
})
```

```sql
SELECT o.*, u."name" AS customer_name, u."phone" AS customer_phone
FROM "Order" o
JOIN "User" u ON o."customerId" = u."id"
WHERE o."filemakerId" = 'user_maker_1'
ORDER BY o."assignedAt" DESC;
```

### Status Updates by Filemaker

```ts
// app/api/filemaker/update-status/route.ts
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user.isFilemaker) return unauthorized()

  const { orderId, status } = await request.json()

  // Only allow valid transitions
  const validTransitions: Record<string, string> = {
    'assigned': 'in_progress',
    'in_progress': 'ready',
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order?.filemakerId !== session.user.id) return unauthorized()
  if (validTransitions[order.status] !== status) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  return NextResponse.json({ order: updated })
}
```

---

## 📖 Docs to Read

1. **[Prisma — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)** — For race-condition-safe order picking
2. **[React — Conditional Rendering](https://react.dev/learn/conditional-rendering)** — Showing different UI based on order status
3. **[Next.js — Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)** — For `/fm-orders/[id]` pages
