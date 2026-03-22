# FileMaker Platform — Full Project Context

> **Purpose:** Paste this into a new chat to give full context about this project. Everything discussed and decided is captured below.

---

## Project Summary

Building an online marketplace for **school practical file making** in India. Students upload experiment details and pay. Vetted filemakers physically make the practical files and ship them via courier. The platform is the middleman — handling orders, payments, shipping coordination, and communication.

This is both a **real product** and a **learning project**. The developer has basic HTML/CSS/JS knowledge, understands code when reading it, and is writing the code themselves with guided documentation.

---

## Tech Stack (Finalized)

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) + TypeScript |
| Frontend | React (within Next.js) |
| Database | PostgreSQL (Docker locally, GCP/Azure/Supabase/Neon for production — TBD) |
| ORM | Prisma (all Prisma code should have SQL equivalents alongside for learning) |
| Auth | NextAuth.js (Auth.js v5) — Credentials provider (email + password), JWT sessions |
| Payments | Razorpay (UPI, cards, net banking — standard for India) |
| Shipping | Shiprocket (shipping aggregator) |
| File Storage | Cloud (S3 / Supabase Storage / Cloudinary — TBD, decide at implementation time) |
| Deployment | Vercel |
| Local DB | Docker (`docker run --name file_making_db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=file_making -p 5432:5432 -d postgres`) |

**Project structure:** Uses `src/` directory with `@/` import alias. Project initialized with `create-next-app` (TypeScript, Tailwind, ESLint, App Router, src-dir).

---

## User Roles

Single signup flow, role differentiation via boolean flags on User table:

| Role | How they get it | Flag |
|------|----------------|------|
| **Customer** | Default on registration | (everyone) |
| **Filemaker** | Apply via site → admin approves → `isFilemaker = true` | `isFilemaker` |
| **Admin** | Developer only. Hardcoded/seeded in DB | `isAdmin` |

---

## Core Flows

### Customer Flow
1. Registers/logs in
2. Creates an order: selects subject + board + class → selects experiments from predefined list → uploads instruction files (PDF, Word, images) → uploads pages to print & paste (charged per page) → enters delivery address → writes optional pasting instructions → sees live itemized price breakdown
3. Pays via Razorpay (single upfront payment)
4. Order goes live and is visible to filemakers after payment confirmed via webhook
5. Gets notified when filemaker is assigned (filemaker's WhatsApp number shown via wa.me link)
6. Receives physical file by post, can track shipment via tracking number on dashboard

### Filemaker Flow
1. Applies via site form → developer approves manually
2. Registers pickup address (for Shiprocket courier pickup)
3. Browses open (paid, unassigned) orders
4. Picks an order → assigned to them (race-condition safe via DB transaction)
5. Downloads customer's files from dashboard
6. Makes the file physically
7. Marks order as ready → Shiprocket courier picks up from filemaker's address
8. Updates order status on dashboard

### Admin Flow (Developer)
1. Approves/rejects filemaker applications
2. Oversees all orders
3. Manages pricing — per-experiment rates per subject, material costs per subject, per-page print cost, flat shipping rate
4. Can intervene in disputes

---

## Pricing Model (Finalized)

| Line Item | How Calculated | Set By |
|-----------|---------------|--------|
| Experiments | `count × rate_per_experiment` (rate varies by subject) | Admin |
| Print pages | `count × ₹X per page` (customer uploads ready-to-print pages, arranges content themselves) | Admin |
| Materials | Fixed ₹ per subject (paper, file cover, etc.) | Admin |
| Shipping | **Flat rate** (fixed by admin for MVP; may evolve to zone-based later) | Admin |

**Total = experiments_cost + print_pages_cost + materials_cost + shipping_flat_rate**

All prices in **paise** (integers) in the database. ₹50.00 = 5000 paise. Convert to rupees only when displaying: `(amount / 100).toFixed(2)`. Prices are **snapshotted** into the Order at creation time (so future price changes don't affect existing orders).

**Print pages UX:** Friendly nudge encourages customers to combine diagrams into fewer pages to save cost. Pasting instructions are optional — can be entered in a text box or communicated via WhatsApp.

---

## Order Status Flow

```
pending_payment → paid → assigned → in_progress → ready → shipped → delivered
```

| Status | Set By |
|--------|--------|
| `pending_payment` | System (on order creation) |
| `paid` | System (Razorpay webhook) |
| `assigned` | System (when filemaker picks order) |
| `in_progress` | Filemaker |
| `ready` | Filemaker |
| `shipped` | System (Shiprocket booking) |
| `delivered` | System (Shiprocket tracking/webhook) |

---

## Shipping (Decisions Made)

- **MVP: Flat rate shipping.** Admin sets a fixed ₹ amount in PlatformConfig. Displayed to customer at checkout.
- Actual shipping cost via Shiprocket may differ; difference is platform margin/cost.
- **Later: Zone-based pricing** (same city, same state, different state) as scale grows.
- Shiprocket handles courier selection, pickup scheduling, AWB/tracking.
- Filemaker registers pickup address once on the platform.

---

## Communication (WhatsApp)

- Simple `wa.me` link approach (no WhatsApp Business API for MVP)
- Before filemaker assignment: developer's support WhatsApp number shown
- After assignment: filemaker's WhatsApp number shown to customer
- Can upgrade to WhatsApp Business API intermediary model later

---

## Database Schema (Prisma)

Full schema is in `markd/overview/04-database-schema.md`. Key tables:

- **User** — email, name, password, phone, isFilemaker, isAdmin
- **FilemakerProfile** — userId (unique), city, pincode, pickupAddress, whatsapp
- **FilemakerApplication** — userId (unique), city, pincode, experience, sampleWork, status (pending/approved/rejected)
- **Subject** — name (unique), board, classLevel
- **Experiment** — subjectId (FK), name, sortOrder
- **SubjectPricing** — subjectId (unique FK), ratePerExperiment (paise), materialCost (paise)
- **Order** — customerId, filemakerId (nullable), subjectId, delivery fields, experimentsCost, printPagesCost, materialsCost, shippingCost, totalAmount, printPageCount, instructions (optional), status, shipping tracking fields, timestamps
- **OrderExperiment** — junction table (orderId + experimentId, unique together)
- **OrderFile** — orderId, fileName, fileUrl, fileType ("instruction" or "print_page"), fileSize
- **Payment** — orderId (unique), razorpayOrderId (unique), razorpayPaymentId, amount, status
- **PlatformConfig** — key (unique), value (string), description. Keys: `flat_shipping_rate`, `per_page_cost`

---

## Project Directory Structure

```
file_making/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/                 # Login, register
│   │   ├── (customer)/             # Customer dashboard, orders
│   │   ├── (filemaker)/            # Filemaker dashboard, browsing
│   │   ├── (admin)/                # Admin panel
│   │   └── api/                    # API routes
│   ├── components/
│   ├── lib/                        # Prisma client, auth config, utils
│   └── types/
├── prisma/
│   └── schema.prisma
├── public/
├── markd/
│   ├── overview/                   # 12 high-level overview docs (00-11)
│   └── chunks/                     # Step-by-step implementation docs (created as we go)
├── .env
├── package.json
└── tsconfig.json
```

---

## Documentation Structure

All learning docs live in `markd/`. Two levels:

1. **`markd/overview/`** — 12 high-level topic overviews (already created, 00-11). Cover concepts, patterns, and code examples with SQL alongside Prisma. Each has a "Docs to Read" section with links.

2. **`markd/chunks/`** — Small, focused implementation docs (created one at a time before implementation). The developer reads the chunk, writes the code themselves, then we move to the next chunk.

---

## Current State

- ✅ Next.js project initialized (TypeScript, Tailwind, ESLint, App Router, src/ dir)
- ✅ All 12 overview docs created in `markd/overview/`
- ⬜ Next step: Database setup (Docker Postgres + Prisma schema + migration + seed)
- ⬜ Then: Auth → Customer flow → Payments → Filemaker → Shipping → Admin → Deploy

---

## Key Conventions

1. **Prisma + SQL:** Every Prisma code block in docs should have its SQL equivalent alongside for learning
2. **Prices in paise:** All monetary values stored as integers in paise
3. **`@/` imports:** `@/` maps to `src/`, so `import { prisma } from '@/lib/prisma'`
4. **Server Components by default:** Only use `'use client'` when interactivity is needed
5. **Webhook over frontend:** Never trust frontend for payment confirmation — only Razorpay webhook
6. **Transactions for race conditions:** Order picking uses DB transactions to prevent double-assignment
7. **MVP first:** School practical files only. No college files, no ratings, no real-time notifications, no mobile app for v1

---

## MVP Scope

### In Scope (v1)
- Customer registration + login
- Order creation (subject, experiments, file upload, address, pricing)
- Razorpay payment
- Filemaker application + approval
- Filemaker order browsing + assignment
- Shiprocket shipment booking + tracking
- Admin panel (pricing, approvals, order overview)
- WhatsApp contact via wa.me links
- School practical files only

### Out of Scope (later)
- College/university files
- Zone-based or live shipping rates
- WhatsApp Business API
- Ratings/reviews
- Filemaker earnings dashboard / payout management
- Mobile app
- Real-time notifications (email/push)
