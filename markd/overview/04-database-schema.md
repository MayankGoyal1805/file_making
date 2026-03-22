# 04 — Database Schema

## The Full Schema

This is the complete database design for the MVP. Every table, every relationship, every field — explained.

---

## Entity Relationship Overview

```
User ──────┬──── Order (as customer)
           │        │
           │        ├──── OrderExperiment (junction: which experiments in this order)
           │        │        │
           │        │        └──── Experiment (predefined list)
           │        │
           │        ├──── OrderFile (uploaded files)
           │        │
           │        └──── Payment
           │
           ├──── FilemakerProfile (if isFilemaker = true)
           │
           └──── FilemakerApplication (application to become filemaker)

Subject ──── Experiment
         └── SubjectPricing (per-subject rates set by admin)

PlatformConfig (global settings like flat shipping rate, per-image cost)
```

---

## Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  phone       String?
  isFilemaker Boolean  @default(false)
  isAdmin     Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  customerOrders  Order[]                @relation("CustomerOrders")
  filemakerOrders Order[]                @relation("FilemakerOrders")
  filemakerProfile FilemakerProfile?
  filemakerApplication FilemakerApplication?
}

model FilemakerProfile {
  id            String  @id @default(cuid())
  userId        String  @unique
  user          User    @relation(fields: [userId], references: [id])
  city          String
  pincode       String
  pickupAddress String   // Full address for Shiprocket pickup
  whatsapp      String   // WhatsApp number for customer communication
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model FilemakerApplication {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  city       String
  pincode    String
  experience String?  // Optional text describing experience
  sampleWork String?  // URL to sample work (if uploaded)
  status     String   @default("pending")  // pending | approved | rejected
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─────────────────────────────────────────
// SUBJECTS & EXPERIMENTS
// ─────────────────────────────────────────

model Subject {
  id          String   @id @default(cuid())
  name        String   @unique  // "Physics", "Chemistry", "Biology"
  board       String   // "CBSE", "ICSE", etc.
  classLevel  String   // "9", "10", "11", "12"
  createdAt   DateTime @default(now())

  experiments Experiment[]
  pricing     SubjectPricing?
}

model Experiment {
  id        String   @id @default(cuid())
  subjectId String
  subject   Subject  @relation(fields: [subjectId], references: [id])
  name      String   // "To verify Ohm's law"
  sortOrder Int      @default(0)  // For display ordering

  orderExperiments OrderExperiment[]
}

model SubjectPricing {
  id                  String  @id @default(cuid())
  subjectId           String  @unique
  subject             Subject @relation(fields: [subjectId], references: [id])
  ratePerExperiment   Int     // in paise (₹50 = 5000)
  materialCost        Int     // Fixed material cost for this subject, in paise
}

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────

model Order {
  id              String   @id @default(cuid())
  // Customer
  customerId      String
  customer        User     @relation("CustomerOrders", fields: [customerId], references: [id])
  // Filemaker (null until assigned)
  filemakerId     String?
  filemaker       User?    @relation("FilemakerOrders", fields: [filemakerId], references: [id])
  // Subject info
  subjectId       String
  // Delivery
  deliveryName    String
  deliveryPhone   String
  deliveryAddress String
  deliveryCity    String
  deliveryState   String
  deliveryPincode String
  // Pricing (snapshot at time of order — prices may change later)
  experimentsCost  Int      // Total experiments cost in paise
  printPagesCost   Int      // Total print pages cost in paise
  materialsCost    Int      // Materials cost in paise
  shippingCost     Int      // Flat shipping rate in paise
  totalAmount      Int      // Grand total in paise
  printPageCount   Int      // Number of pages to print
  // Instructions (optional — customer can also communicate via WhatsApp)
  instructions     String?  // General notes like "paste page 3 after experiment 5"
  // Status
  status          String   @default("pending_payment")
  // pending_payment → paid → assigned → in_progress → ready → shipped → delivered
  // Shipping
  shipmentId      String?  // Shiprocket shipment ID
  trackingNumber  String?  // Courier tracking number
  courierName     String?  // e.g., "Delhivery", "BlueDart"
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  paidAt          DateTime?
  assignedAt      DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?

  // Relations
  experiments OrderExperiment[]
  files       OrderFile[]
  payment     Payment?
}

model OrderExperiment {
  id           String     @id @default(cuid())
  orderId      String
  order        Order      @relation(fields: [orderId], references: [id])
  experimentId String
  experiment   Experiment @relation(fields: [experimentId], references: [id])

  @@unique([orderId, experimentId])  // Can't add same experiment twice
}

model OrderFile {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  fileName  String   // Original file name
  fileUrl   String   // Cloud storage URL
  fileType  String   // "instruction" or "print_page"
  fileSize  Int      // Size in bytes
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────

model Payment {
  id                String   @id @default(cuid())
  orderId           String   @unique
  order             Order    @relation(fields: [orderId], references: [id])
  razorpayOrderId   String   @unique  // Razorpay's order ID (order_XXX)
  razorpayPaymentId String?  // Razorpay's payment ID (pay_XXX) — set after payment
  amount            Int      // Amount in paise
  status            String   @default("created")  // created | captured | failed
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ─────────────────────────────────────────
// PLATFORM CONFIG
// ─────────────────────────────────────────

model PlatformConfig {
  id              String @id @default(cuid())
  key             String @unique  // "flat_shipping_rate", "per_image_cost"
  value           String          // Stored as string, parsed in code
  description     String?
}
```

---

## SQL Equivalent (Full)

```sql
-- USERS
CREATE TABLE "User" (
  "id"          TEXT PRIMARY KEY,
  "email"       TEXT UNIQUE NOT NULL,
  "name"        TEXT NOT NULL,
  "password"    TEXT NOT NULL,
  "phone"       TEXT,
  "isFilemaker" BOOLEAN NOT NULL DEFAULT false,
  "isAdmin"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL
);

CREATE TABLE "FilemakerProfile" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT UNIQUE NOT NULL REFERENCES "User"("id"),
  "city"          TEXT NOT NULL,
  "pincode"       TEXT NOT NULL,
  "pickupAddress" TEXT NOT NULL,
  "whatsapp"      TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL
);

CREATE TABLE "FilemakerApplication" (
  "id"         TEXT PRIMARY KEY,
  "userId"     TEXT UNIQUE NOT NULL REFERENCES "User"("id"),
  "city"       TEXT NOT NULL,
  "pincode"    TEXT NOT NULL,
  "experience" TEXT,
  "sampleWork" TEXT,
  "status"     TEXT NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMPTZ NOT NULL
);

-- SUBJECTS & EXPERIMENTS
CREATE TABLE "Subject" (
  "id"         TEXT PRIMARY KEY,
  "name"       TEXT UNIQUE NOT NULL,
  "board"      TEXT NOT NULL,
  "classLevel" TEXT NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Experiment" (
  "id"        TEXT PRIMARY KEY,
  "subjectId" TEXT NOT NULL REFERENCES "Subject"("id"),
  "name"      TEXT NOT NULL,
  "sortOrder" INT NOT NULL DEFAULT 0
);

CREATE TABLE "SubjectPricing" (
  "id"                TEXT PRIMARY KEY,
  "subjectId"         TEXT UNIQUE NOT NULL REFERENCES "Subject"("id"),
  "ratePerExperiment" INT NOT NULL,
  "materialCost"      INT NOT NULL
);

-- ORDERS
CREATE TABLE "Order" (
  "id"              TEXT PRIMARY KEY,
  "customerId"      TEXT NOT NULL REFERENCES "User"("id"),
  "filemakerId"     TEXT REFERENCES "User"("id"),
  "subjectId"       TEXT NOT NULL,
  "deliveryName"    TEXT NOT NULL,
  "deliveryPhone"   TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL,
  "deliveryCity"    TEXT NOT NULL,
  "deliveryState"   TEXT NOT NULL,
  "deliveryPincode" TEXT NOT NULL,
  "experimentsCost"  INT NOT NULL,
  "printPagesCost"   INT NOT NULL,
  "materialsCost"    INT NOT NULL,
  "shippingCost"     INT NOT NULL,
  "totalAmount"      INT NOT NULL,
  "printPageCount"   INT NOT NULL,
  "instructions"     TEXT,
  "status"           TEXT NOT NULL DEFAULT 'pending_payment',
  "shipmentId"      TEXT,
  "trackingNumber"  TEXT,
  "courierName"     TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL,
  "paidAt"          TIMESTAMPTZ,
  "assignedAt"      TIMESTAMPTZ,
  "shippedAt"       TIMESTAMPTZ,
  "deliveredAt"     TIMESTAMPTZ
);

CREATE TABLE "OrderExperiment" (
  "id"           TEXT PRIMARY KEY,
  "orderId"      TEXT NOT NULL REFERENCES "Order"("id"),
  "experimentId" TEXT NOT NULL REFERENCES "Experiment"("id"),
  UNIQUE("orderId", "experimentId")
);

CREATE TABLE "OrderFile" (
  "id"        TEXT PRIMARY KEY,
  "orderId"   TEXT NOT NULL REFERENCES "Order"("id"),
  "fileName"  TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "fileType"  TEXT NOT NULL,
  "fileSize"  INT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PAYMENTS
CREATE TABLE "Payment" (
  "id"                TEXT PRIMARY KEY,
  "orderId"           TEXT UNIQUE NOT NULL REFERENCES "Order"("id"),
  "razorpayOrderId"   TEXT UNIQUE NOT NULL,
  "razorpayPaymentId" TEXT,
  "amount"            INT NOT NULL,
  "status"            TEXT NOT NULL DEFAULT 'created',
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL
);

-- PLATFORM CONFIG
CREATE TABLE "PlatformConfig" (
  "id"          TEXT PRIMARY KEY,
  "key"         TEXT UNIQUE NOT NULL,
  "value"       TEXT NOT NULL,
  "description" TEXT
);

-- Seed platform config
INSERT INTO "PlatformConfig" ("id", "key", "value", "description") VALUES
  ('cfg_1', 'flat_shipping_rate', '8000', 'Flat shipping rate in paise (₹80)'),
  ('cfg_2', 'per_page_cost', '500', 'Cost per printed page in paise (₹5)');
```

---

## Design Decisions Explained

### Why store prices in paise (not rupees)?
Floating-point math is broken for money. `0.1 + 0.2 = 0.30000000000000004` in JavaScript. By storing in paise (integers), ₹50.00 = 5000 paise. No decimals, no rounding errors. Convert to rupees only when displaying: `(amount / 100).toFixed(2)`.

### Why snapshot prices in Order?
Prices can change. If admin changes the rate per experiment tomorrow, orders placed today should keep today's price. So we copy the calculated costs into the Order at creation time.

### Why PlatformConfig as key-value?
Settings like flat shipping rate and per-image cost need to be editable by admin without code changes. A simple key-value table is the easiest pattern. Alternative would be a single-row settings table, but key-value is more flexible.

### Why separate OrderExperiment junction table?
An order can have many experiments, and an experiment can be in many orders. This is a classic **many-to-many** relationship. The junction table (`OrderExperiment`) connects them.

```
Order ←──── OrderExperiment ────→ Experiment
  1    :         many         :       1
```

### Why FilemakerProfile is separate from User?
Not all users are filemakers. Putting filemaker-specific fields (pickup address, WhatsApp, city) in the User table would mean those columns are `null` for 95% of users. A separate table keeps things clean.

### Order Status Flow

```
pending_payment → paid → assigned → in_progress → ready → shipped → delivered
      │                                                        │
      └── (if payment fails, stays here)                       └── (Shiprocket tracking)
```

| Status | Meaning | Set By |
|--------|---------|--------|
| `pending_payment` | Order created, waiting for payment | System (on creation) |
| `paid` | Payment confirmed via Razorpay webhook | System (webhook) |
| `assigned` | Filemaker picked this order | System (on assignment) |
| `in_progress` | Filemaker is making the file | Filemaker |
| `ready` | File is made, ready for pickup | Filemaker |
| `shipped` | Courier picked up, tracking available | System (Shiprocket) |
| `delivered` | Delivered to student | System (Shiprocket webhook) |

---

## 📖 Docs to Read

1. **[Prisma — Data Modeling](https://www.prisma.io/docs/orm/prisma-schema/data-model/models)** — Models, fields, attributes
2. **[Prisma — Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)** — One-to-one, one-to-many, many-to-many
3. **[Prisma — Enums](https://www.prisma.io/docs/orm/prisma-schema/data-model/models#defining-enums)** — Alternative to string status fields (we're using strings for simplicity now, but enums are better long-term)
