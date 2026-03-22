# 10 — Admin Panel

## What You'll Learn
- What the admin (you, the developer) needs to manage
- Building a protected admin section
- CRUD operations for pricing and subjects
- Filemaker approval workflow

---

## Admin Responsibilities

| Task | Frequency | Priority |
|------|-----------|----------|
| Approve/reject filemaker applications | As they come in | High |
| Set pricing per subject (rate per experiment, material cost) | Occasionally | High |
| Set platform config (flat shipping rate, per-image cost) | Rarely | Medium |
| View all orders and their statuses | Daily | High |
| Manage subjects & experiments (add new ones) | When launching new subjects | Medium |
| Intervene in disputes | As needed | Low (for MVP) |

---

## Admin Route Protection

Every admin page and API route checks `isAdmin`:

```tsx
// app/(admin)/admin/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user.isAdmin) redirect('/')

  return (
    <div>
      <nav>
        {/* Admin sidebar/nav */}
        <a href="/admin">Dashboard</a>
        <a href="/admin/filemakers">Filemakers</a>
        <a href="/admin/pricing">Pricing</a>
        <a href="/admin/subjects">Subjects</a>
        <a href="/admin/orders">Orders</a>
      </nav>
      <main>{children}</main>
    </div>
  )
}
```

> **Layout-level protection:** By checking auth in the layout, ALL pages under `(admin)/` are automatically protected. You don't need to check in every page.

---

## Filemaker Approval

### List Applications
```ts
// Prisma
const applications = await prisma.filemakerApplication.findMany({
  where: { status: 'pending' },
  include: { user: { select: { name: true, email: true } } },
  orderBy: { createdAt: 'asc' },
})
```

```sql
-- SQL
SELECT fa.*, u."name", u."email"
FROM "FilemakerApplication" fa
JOIN "User" u ON fa."userId" = u."id"
WHERE fa."status" = 'pending'
ORDER BY fa."createdAt" ASC;
```

### Approve/Reject
```ts
// app/api/admin/filemakers/[id]/route.ts
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user.isAdmin) return unauthorized()

  const { action } = await request.json()  // "approve" or "reject"

  if (action === 'approve') {
    // Use transaction: update application + set isFilemaker flag
    await prisma.$transaction([
      prisma.filemakerApplication.update({
        where: { id: params.id },
        data: { status: 'approved' },
      }),
      prisma.user.update({
        where: { id: application.userId },
        data: { isFilemaker: true },
      }),
    ])
  } else {
    await prisma.filemakerApplication.update({
      where: { id: params.id },
      data: { status: 'rejected' },
    })
  }

  return NextResponse.json({ success: true })
}
```

```sql
-- SQL: Approve
BEGIN;
UPDATE "FilemakerApplication" SET "status" = 'approved', "updatedAt" = now() WHERE "id" = 'app_123';
UPDATE "User" SET "isFilemaker" = true, "updatedAt" = now() WHERE "id" = 'user_456';
COMMIT;

-- SQL: Reject
UPDATE "FilemakerApplication" SET "status" = 'rejected', "updatedAt" = now() WHERE "id" = 'app_123';
```

---

## Pricing Management

### Subject Pricing CRUD
```tsx
// Admin pricing page — Server Component
export default async function PricingPage() {
  const subjects = await prisma.subject.findMany({
    include: { pricing: true },
    orderBy: { name: 'asc' },
  })

  return (
    <table>
      <thead>
        <tr>
          <th>Subject</th>
          <th>Board</th>
          <th>Class</th>
          <th>Rate/Experiment</th>
          <th>Material Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {subjects.map(subject => (
          <tr key={subject.id}>
            <td>{subject.name}</td>
            <td>{subject.board}</td>
            <td>{subject.classLevel}</td>
            <td>₹{(subject.pricing?.ratePerExperiment ?? 0) / 100}</td>
            <td>₹{(subject.pricing?.materialCost ?? 0) / 100}</td>
            <td><a href={`/admin/pricing/${subject.id}`}>Edit</a></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### Update Pricing API
```ts
// app/api/admin/pricing/[subjectId]/route.ts
export async function PUT(request: Request, { params }: { params: { subjectId: string } }) {
  const session = await auth()
  if (!session?.user.isAdmin) return unauthorized()

  const { ratePerExperiment, materialCost } = await request.json()

  const pricing = await prisma.subjectPricing.upsert({
    where: { subjectId: params.subjectId },
    update: { ratePerExperiment, materialCost },
    create: { subjectId: params.subjectId, ratePerExperiment, materialCost },
  })

  return NextResponse.json({ pricing })
}
```

```sql
-- SQL: Upsert pricing
INSERT INTO "SubjectPricing" ("id", "subjectId", "ratePerExperiment", "materialCost")
VALUES (gen_random_uuid(), 'subj_physics', 5000, 10000)
ON CONFLICT ("subjectId")
DO UPDATE SET "ratePerExperiment" = 5000, "materialCost" = 10000;
```

> **Upsert** = "Update if exists, insert if not." Very useful for settings-type data.

---

## Platform Config Management

```ts
// Update flat shipping rate, per-image cost, etc.
await prisma.platformConfig.upsert({
  where: { key: 'flat_shipping_rate' },
  update: { value: '8000' },     // ₹80 in paise
  create: { key: 'flat_shipping_rate', value: '8000', description: 'Flat shipping rate in paise' },
})
```

---

## Admin Dashboard Overview

```
┌──────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                                     │
│                                                      │
│  📊 Quick Stats                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Total  │ │ Pending│ │ Active │ │ Total  │        │
│  │ Orders │ │Approvals│ │Filemakers│ │Revenue│        │
│  │  47    │ │   3    │ │   8    │ │₹14,200│        │
│  └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                      │
│  📋 Recent Orders                                    │
│  ┌──────────────────────────────────────────────┐   │
│  │ #order_abc  Physics  CBSE 10  ₹300   paid    │   │
│  │ #order_def  Chemistry CBSE 12 ₹450   shipped │   │
│  │ #order_ghi  Biology  CBSE 10  ₹200   assigned│   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  🔔 Pending Filemaker Applications (3)               │
│  [View All →]                                        │
└──────────────────────────────────────────────────────┘
```

---

## Seeding the Admin User

You'll seed the admin user and initial data using Prisma's seed script:

```ts
// prisma/seed.ts
import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  // Seed admin user
  const adminPassword = await bcrypt.hash('your-secure-password', 12)
  await prisma.user.upsert({
    where: { email: 'admin@filemaker.com' },
    update: {},
    create: {
      email: 'admin@filemaker.com',
      name: 'Admin',
      password: adminPassword,
      isAdmin: true,
    },
  })

  // Seed subjects and experiments
  const physics = await prisma.subject.upsert({
    where: { name: 'Physics' },
    update: {},
    create: {
      name: 'Physics',
      board: 'CBSE',
      classLevel: '10',
    },
  })

  // Seed experiments for Physics
  const experiments = [
    'To find the resultant of two vectors',
    'To verify Ohm\'s law',
    'To find focal length of a concave mirror',
    'To verify laws of refraction',
    // ... more experiments
  ]

  for (let i = 0; i < experiments.length; i++) {
    await prisma.experiment.upsert({
      where: { id: `exp_physics_${i}` },  // Use deterministic IDs for seeding
      update: {},
      create: {
        id: `exp_physics_${i}`,
        subjectId: physics.id,
        name: experiments[i],
        sortOrder: i,
      },
    })
  }

  // Seed pricing
  await prisma.subjectPricing.upsert({
    where: { subjectId: physics.id },
    update: {},
    create: {
      subjectId: physics.id,
      ratePerExperiment: 5000,  // ₹50
      materialCost: 10000,      // ₹100
    },
  })

  // Seed platform config
  await prisma.platformConfig.upsert({
    where: { key: 'flat_shipping_rate' },
    update: {},
    create: { key: 'flat_shipping_rate', value: '8000', description: 'Flat rate in paise (₹80)' },
  })
  await prisma.platformConfig.upsert({
    where: { key: 'per_page_cost' },
    update: {},
    create: { key: 'per_page_cost', value: '500', description: 'Per printed page in paise (₹5)' },
  })

  console.log('Seeded successfully!')
}

main()
```

---

## 📖 Docs to Read

1. **[Prisma — Seeding](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)** — How to set up and run seed scripts
2. **[Prisma — Upsert](https://www.prisma.io/docs/orm/reference/prisma-client-reference#upsert)** — Create-or-update pattern
3. **[Next.js — Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)** — How `(admin)` grouping works
