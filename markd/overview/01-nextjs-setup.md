# 01 — Next.js Setup

## What You'll Learn
- What Next.js actually does for you
- App Router vs Pages Router (and why we use App Router)
- How file-based routing works
- Server Components vs Client Components
- How to create and run a Next.js project

---

## Concepts

### Next.js in One Paragraph
Next.js is a **framework built on top of React**. Plain React gives you a way to build UI components — but it doesn't give you routing (URLs → pages), a server, API endpoints, or server-side rendering. Next.js adds all of that. You get a full-stack app in one project: your React pages AND your backend API routes live in the same codebase.

### App Router (What We Use)
Next.js has two routing systems:
- **Pages Router** (old) — files in `pages/` directory
- **App Router** (new, v13+) — files in `app/` directory

We use **App Router**. It's the future of Next.js and has better features (layouts, loading states, server components).

### File-Based Routing
In Next.js, **the file system IS your router**. No need for a router library.

```
src/app/
├── page.tsx              →   /
├── about/
│   └── page.tsx          →   /about
├── orders/
│   ├── page.tsx          →   /orders
│   └── [id]/
│       └── page.tsx      →   /orders/123  (dynamic route)
├── (auth)/
│   ├── login/
│   │   └── page.tsx      →   /login  (route group — parentheses excluded from URL)
│   └── register/
│       └── page.tsx      →   /register
└── api/
    └── orders/
        └── route.ts      →   API: POST/GET /api/orders
```

**Key files:**
| File | Purpose |
|------|---------|
| `page.tsx` | The UI for that route. Every route needs one |
| `layout.tsx` | Wraps pages. Shared UI (navbar, sidebar). Persists across navigation |
| `loading.tsx` | Shown while the page is loading (auto streaming) |
| `error.tsx` | Error boundary for that route |
| `route.ts` | API endpoint (no UI, just handles HTTP requests) |
| `not-found.tsx` | 404 page for that route |

### Server Components vs Client Components

This is the **most important concept** in modern Next.js.

| | Server Component (default) | Client Component |
|---|---|---|
| **Runs on** | Server only | Server first, then browser |
| **Can do** | Database queries, file system, secrets | Event handlers, useState, useEffect, browser APIs |
| **Directive** | None needed (default) | `'use client'` at top of file |
| **Use when** | Fetching data, rendering static content | Forms, buttons, interactive UI |

**Rule of thumb:** Start with Server Components. Only add `'use client'` when you need interactivity (click handlers, form state, etc.).

```tsx
// This is a Server Component (default — no directive)
// It can directly query the database!
import { prisma } from '@/lib/prisma'

export default async function OrdersPage() {
  const orders = await prisma.order.findMany()  // runs on server
  return <div>{orders.map(o => <p key={o.id}>{o.id}</p>)}</div>
}
```

```tsx
// This is a Client Component — note the directive
'use client'
import { useState } from 'react'

export default function OrderForm() {
  const [subject, setSubject] = useState('')
  return (
    <select onChange={(e) => setSubject(e.target.value)}>
      <option value="physics">Physics</option>
      <option value="chemistry">Chemistry</option>
    </select>
  )
}
```

### API Routes
Backend endpoints live in `app/api/`. They handle HTTP requests (GET, POST, PUT, DELETE).

```ts
// app/api/orders/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  // fetch orders from DB
  return NextResponse.json({ orders: [] })
}

export async function POST(request: Request) {
  const body = await request.json()
  // create order in DB
  return NextResponse.json({ created: true }, { status: 201 })
}
```

---

## For Our Project

```
src/app/
├── layout.tsx                    # Root layout (HTML shell, global styles, navbar)
├── page.tsx                      # Landing page / homepage
│
├── (auth)/                       # Route group — no /auth in URL
│   ├── login/page.tsx            # → /login
│   └── register/page.tsx         # → /register
│
├── (customer)/
│   ├── dashboard/page.tsx        # → /dashboard
│   ├── orders/
│   │   ├── page.tsx              # → /orders (list)
│   │   ├── new/page.tsx          # → /orders/new (create order)
│   │   └── [id]/page.tsx         # → /orders/abc123 (order detail)
│
├── (filemaker)/
│   ├── fm-dashboard/page.tsx     # → /fm-dashboard
│   ├── fm-orders/page.tsx        # → /fm-orders (browse open orders)
│   └── fm-apply/page.tsx         # → /fm-apply (application form)
│
├── (admin)/
│   ├── admin/page.tsx            # → /admin
│   ├── admin/pricing/page.tsx    # → /admin/pricing
│   └── admin/filemakers/page.tsx # → /admin/filemakers (approve/reject)
│
└── api/
    ├── auth/[...nextauth]/route.ts  # NextAuth catch-all
    ├── orders/route.ts              # CRUD orders
    ├── payments/webhook/route.ts    # Razorpay webhook
    └── shipping/route.ts            # Shiprocket integration
```

---

## Setup Commands (When We Get There)

```bash
# Create the project (you'll run this when we start implementing)
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Start dev server
npm run dev
```

> **Note on Tailwind:** The create-next-app command includes Tailwind by default now. We can use it or switch to plain CSS — your call when we start building.

---

## 📖 Docs to Read

Read these before (or alongside) implementing. You don't need to memorize — just get familiar:

1. **[Next.js — Getting Started](https://nextjs.org/docs/getting-started/installation)** — The official "create and run" guide
2. **[Next.js — App Router](https://nextjs.org/docs/app/building-your-application/routing)** — How routing works
3. **[Next.js — Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)** — The most important concept
4. **[Next.js — Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** — API routes
5. **[TypeScript for JS Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)** — 5-minute intro if you haven't used TS before
