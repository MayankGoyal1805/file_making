# 00 — Project Overview

## What We're Building

An online marketplace for **school practical file making** in India.

**The three actors:**

| Role | Who | How they get the role |
|------|-----|-----------------------|
| **Customer** | Any student who signs up | Default role on registration |
| **Filemaker** | Vetted people who physically make files | Apply via site → admin approves |
| **Admin** | You (the developer) | Hardcoded/seeded in DB |

**The flow in one sentence:**
Student uploads experiment details + pays → Filemaker picks the order + makes the file → Courier picks up from filemaker → Student receives physical file.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│              Next.js (React + TypeScript)                │
│         App Router — Server & Client Components         │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Customer  │  │  Filemaker   │  │   Admin Dashboard │  │
│  │   Pages   │  │   Dashboard  │  │                   │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
                    API Routes
                   (Next.js API)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │ Cloud Storage│ │   NextAuth   │
│   (Prisma)   │ │  (S3/Supa/   │ │   (Auth.js)  │
│              │ │  Cloudinary) │ │              │
│  Users       │ │              │ │  Sessions    │
│  Orders      │ │  Uploaded    │ │  OAuth /     │
│  Experiments │ │  Files       │ │  Credentials │
│  Pricing     │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
        │
        │         External Services
        │    ┌──────────────────────────┐
        │    │  Razorpay — Payments     │
        │    │  Shiprocket — Shipping   │
        │    │  WhatsApp — wa.me links  │
        │    └──────────────────────────┘
```

---

## Tech Stack — Why Each Piece

### Next.js (App Router) + TypeScript
- **What:** A React framework that gives you both frontend UI and backend API routes in one project
- **Why:** You don't need a separate backend server. Next.js handles pages (React), API endpoints, server-side rendering, and deployment — all in one
- **App Router:** The newer routing system in Next.js (as opposed to Pages Router). Uses file-based routing inside an `app/` directory
- **TypeScript:** JavaScript with types. Catches bugs before runtime. Every modern project uses it
- **📖 Read:** [Next.js Docs — Getting Started](https://nextjs.org/docs/getting-started/installation) | [TypeScript Handbook (basics)](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)

### React
- **What:** UI library for building components (buttons, forms, pages — everything is a component)
- **Why:** It's inside Next.js already. You write your UI in React
- **📖 Read:** [React Docs — Quick Start](https://react.dev/learn) | The Odin Project's React section

### PostgreSQL
- **What:** A relational database (tables, rows, columns — like SQL you already know)
- **Why:** Your data is highly relational (users have orders, orders have experiments, experiments have pricing). Postgres is rock-solid and free
- **📖 Read:** [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) (skim — you already know SQL basics)

### Prisma (ORM)
- **What:** An Object-Relational Mapper. You define your database schema in a `schema.prisma` file, and Prisma generates TypeScript code to query the database
- **Why:** Instead of writing raw SQL strings in your code, you write `prisma.user.findMany()` — it's type-safe and catches errors at build time. But it generates SQL under the hood (we'll show both in every doc)
- **📖 Read:** [Prisma Docs — Quickstart](https://www.prisma.io/docs/getting-started/quickstart-sqlite) | [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)

### NextAuth.js (Auth.js)
- **What:** Authentication library for Next.js. Handles login, signup, sessions, OAuth
- **Why:** Auth is hard to build securely from scratch. NextAuth handles session tokens, CSRF protection, password hashing — you configure it, not build it
- **📖 Read:** [Auth.js Docs](https://authjs.dev/getting-started) (specifically the Next.js guide)

### Razorpay
- **What:** Indian payment gateway. Supports UPI, cards, net banking, wallets
- **Why:** It's the standard for Indian startups. Good docs, easy integration, handles compliance
- **📖 Read:** [Razorpay Docs — Web Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/)

### Shiprocket
- **What:** Shipping aggregator. Connects to multiple courier services (Delhivery, BlueDart, etc.)
- **Why:** You don't need to integrate with individual couriers. Shiprocket handles pickup scheduling, tracking, and rate comparison
- **📖 Read:** [Shiprocket API Docs](https://apidocs.shiprocket.in/)

### Cloud Storage (TBD)
- **What:** Where uploaded files (PDFs, images, Word docs) are stored
- **Options:**
  - **Supabase Storage** — easy if you're already using Supabase for anything else
  - **AWS S3** — industry standard, most flexible, slightly more setup
  - **Cloudinary** — great for images specifically, has built-in transformations
- **Decision:** We'll finalize this when we reach the file upload implementation

---

## Pricing Model (Finalized)

| Line Item | How Calculated | Set By |
|-----------|---------------|--------|
| Experiments | `count × rate_per_experiment` (rate varies by subject) | Admin |
| Print pages | `count × ₹X per page` (customer uploads ready-to-print pages) | Admin |
| Materials | Fixed ₹ per subject (paper, file cover, etc.) | Admin |
| Shipping | **Flat rate** (fixed by admin for MVP) | Admin |

**Total = experiments_cost + print_pages_cost + materials_cost + shipping_flat_rate**

> All prices visible and locked before the customer pays. Single upfront payment. No second stage.

**Print pages:** Customers upload pages (PDFs/images) that need to be printed and pasted into the file. They arrange their diagrams/images onto pages themselves. A friendly UX nudge encourages combining content into fewer pages to save cost. Pasting instructions can be added via a text box or communicated via WhatsApp.

---

## MVP Scope — What We're Building First

### In Scope (v1)
- ✅ Customer registration + login
- ✅ Order creation (subject, experiments, file upload, address, pricing)
- ✅ Razorpay payment
- ✅ Filemaker application + approval
- ✅ Filemaker order browsing + assignment
- ✅ Shiprocket shipment booking + tracking
- ✅ Admin panel (pricing, approvals, order overview)
- ✅ WhatsApp contact via `wa.me` links
- ✅ School practical files only

### Out of Scope (later)
- ❌ College/university files
- ❌ Zone-based or live shipping rates
- ❌ WhatsApp Business API
- ❌ Ratings/reviews
- ❌ Filemaker earnings dashboard / payout management
- ❌ Mobile app
- ❌ Real-time notifications (email/push)

---

## Project Directory Structure (What It'll Look Like)

```
file_making/
├── src/                            # All source code lives here
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Homepage
│   │   ├── (auth)/                 # Auth pages (login, register)
│   │   ├── (customer)/             # Customer pages (orders, dashboard)
│   │   ├── (filemaker)/            # Filemaker pages (browse, dashboard)
│   │   ├── (admin)/                # Admin pages
│   │   └── api/                    # API routes
│   │       ├── auth/               # NextAuth endpoints
│   │       ├── orders/             # Order CRUD
│   │       ├── payments/           # Razorpay webhooks
│   │       └── shipping/           # Shiprocket integration
│   ├── components/                 # Reusable React components
│   ├── lib/                        # Utility functions, Prisma client, etc.
│   └── types/                      # TypeScript type definitions
├── prisma/
│   └── schema.prisma               # Database schema
├── public/                         # Static assets
├── markd/                          # Learning documentation (this!)
│   ├── overview/                   # High-level docs (you are here)
│   └── chunks/                     # Step-by-step implementation docs
├── .env                            # Environment variables (never commit!)
├── package.json
└── tsconfig.json
```

> **`src/` directory:** Keeps your code separate from config files at the root. The `@/` import alias maps to `src/`, so `import { prisma } from '@/lib/prisma'` resolves to `src/lib/prisma.ts`.

> **Route Groups:** The `(auth)`, `(customer)`, `(filemaker)`, `(admin)` folders use Next.js [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups). The parentheses mean the folder name is NOT part of the URL. It's just for organizing your code.

---

## What's Next

The overview docs continue in this folder. Work through them in order:
1. `01-nextjs-setup.md` — Setting up the project
2. `02-database-and-prisma.md` — Database fundamentals
3. ...and so on

After all overviews are read, we move to `markd/chunks/` — small, focused implementation tasks that you code yourself.
