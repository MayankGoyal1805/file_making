# Chunk 01 — Database Setup

## What You'll Do
1. Start a PostgreSQL database using Docker
2. Install Prisma
3. Write the `schema.prisma` file
4. Run your first migration (creates the tables)
5. Write and run the seed script (populates initial data)

**By the end:** You'll have a running database with all tables created and seeded with an admin user, a few subjects, experiments, and platform config.

---

## Step 1 — Start PostgreSQL with Docker

Run this command in your terminal:

```bash
docker run \
  --name file_making_db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=file_making \
  -p 5432:5432 \
  -d postgres
```

**What this does:**
- `--name file_making_db` — names the container so you can refer to it later
- `-e POSTGRES_PASSWORD=password` — sets the password for the `postgres` user
- `-e POSTGRES_DB=file_making` — creates a database called `file_making` on startup
- `-p 5432:5432` — maps port 5432 on your machine to the container (so your app can connect)
- `-d` — runs in background (detached mode)

**Verify it's running:**
```bash
docker ps
```
You should see `file_making_db` in the list with status `Up`.

**Useful Docker commands to know:**
```bash
docker stop file_making_db     # Stop the container
docker start file_making_db    # Start it again later
docker logs file_making_db     # See what Postgres is logging
```

> **Note:** Every time you restart your machine, you'll need to run `docker start file_making_db` to start the DB again. The data persists even when the container is stopped.

---

## Step 2 — Install Prisma

Run in your project root (`/home/mayank/repos/file_making`):

```bash
npm install prisma --save-dev
npm install @prisma/client
```

Then initialize Prisma:
```bash
npx prisma init
```

**What `prisma init` creates:**
- `prisma/schema.prisma` — your schema file (you'll write models here)
- `.env` — a file for environment variables (already has a placeholder `DATABASE_URL`)

---

## Step 3 — Configure `.env`

Open `.env` and set your database URL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/file_making?schema=public"
```

**What each part means:**
- `postgres` — the username (default for PostgreSQL)
- `password` — the password you set in Docker
- `localhost:5432` — your machine, port 5432
- `file_making` — the database name
- `?schema=public` — use the default `public` schema

> **IMPORTANT:** Make sure `.env` is in your `.gitignore`. It should already be there from `create-next-app`, but double check.

---

## Step 4 — Write the Schema

Open `prisma/schema.prisma`. Replace everything in it with the schema below.

Read through it carefully — every model maps to a database table. Cross-reference with `markd/overview/04-database-schema.md` if you want the SQL equivalents and explanations.

```prisma
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

  customerOrders       Order[]               @relation("CustomerOrders")
  filemakerOrders      Order[]               @relation("FilemakerOrders")
  filemakerProfile     FilemakerProfile?
  filemakerApplication FilemakerApplication?
}

model FilemakerProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  city          String
  pincode       String
  pickupAddress String
  whatsapp      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model FilemakerApplication {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  city       String
  pincode    String
  experience String?
  sampleWork String?
  status     String   @default("pending")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─────────────────────────────────────────
// SUBJECTS & EXPERIMENTS
// ─────────────────────────────────────────

model Subject {
  id          String   @id @default(cuid())
  name        String   @unique
  board       String
  classLevel  String
  createdAt   DateTime @default(now())

  experiments Experiment[]
  pricing     SubjectPricing?
}

model Experiment {
  id        String   @id @default(cuid())
  subjectId String
  subject   Subject  @relation(fields: [subjectId], references: [id])
  name      String
  sortOrder Int      @default(0)

  orderExperiments OrderExperiment[]
}

model SubjectPricing {
  id                String  @id @default(cuid())
  subjectId         String  @unique
  subject           Subject @relation(fields: [subjectId], references: [id])
  ratePerExperiment Int
  materialCost      Int
}

// ─────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────

model Order {
  id              String    @id @default(cuid())
  customerId      String
  customer        User      @relation("CustomerOrders", fields: [customerId], references: [id])
  filemakerId     String?
  filemaker       User?     @relation("FilemakerOrders", fields: [filemakerId], references: [id])
  subjectId       String
  deliveryName    String
  deliveryPhone   String
  deliveryAddress String
  deliveryCity    String
  deliveryState   String
  deliveryPincode String
  experimentsCost Int
  printPagesCost  Int
  materialsCost   Int
  shippingCost    Int
  totalAmount     Int
  printPageCount  Int
  instructions    String?
  status          String    @default("pending_payment")
  shipmentId      String?
  trackingNumber  String?
  courierName     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  paidAt          DateTime?
  assignedAt      DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?

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

  @@unique([orderId, experimentId])
}

model OrderFile {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  fileName  String
  fileUrl   String
  fileType  String
  fileSize  Int
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────

model Payment {
  id                String   @id @default(cuid())
  orderId           String   @unique
  order             Order    @relation(fields: [orderId], references: [id])
  razorpayOrderId   String   @unique
  razorpayPaymentId String?
  amount            Int
  status            String   @default("created")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ─────────────────────────────────────────
// PLATFORM CONFIG
// ─────────────────────────────────────────

model PlatformConfig {
  id          String  @id @default(cuid())
  key         String  @unique
  value       String
  description String?
}
```

---

## Step 5 — Run the Migration

This converts your schema into actual SQL tables in the database:

```bash
npx prisma migrate dev --name init
```

**What happens:**
1. Prisma reads your schema
2. Generates a SQL migration file in `prisma/migrations/`
3. Runs the SQL against your Docker database
4. Regenerates the Prisma Client (TypeScript types)

**You should see output like:**
```
✔ Generated Prisma Client
✔ Applied migration `20240315_init`
```

> **If you see a connection error:** Make sure Docker is running (`docker ps`) and your `DATABASE_URL` in `.env` is correct.

**To see the SQL it generated**, open `prisma/migrations/[timestamp]_init/migration.sql`. It's the raw CREATE TABLE statements — good to read through once.

---

## Step 6 — Create the Prisma Client Helper

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],  // Logs every SQL query in development — remove in production
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why this pattern?** In development, Next.js hot-reloads files constantly. Without this, every reload would create a new database connection until you run out. The `globalThis` trick reuses the same client across reloads.

---

## Step 7 — Write the Seed Script

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding...')

  // ── Admin User ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12)
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
  console.log('✓ Admin user seeded')

  // ── Platform Config ─────────────────────────────────────────
  await prisma.platformConfig.upsert({
    where: { key: 'flat_shipping_rate' },
    update: {},
    create: {
      key: 'flat_shipping_rate',
      value: '8000',
      description: 'Flat shipping rate in paise (₹80)',
    },
  })
  await prisma.platformConfig.upsert({
    where: { key: 'per_page_cost' },
    update: {},
    create: {
      key: 'per_page_cost',
      value: '500',
      description: 'Cost per printed page in paise (₹5)',
    },
  })
  console.log('✓ Platform config seeded')

  // ── Subjects & Experiments ──────────────────────────────────

  // PHYSICS — CBSE Class 10
  const physics10 = await prisma.subject.upsert({
    where: { name: 'Physics-CBSE-10' },
    update: {},
    create: {
      name: 'Physics-CBSE-10',
      board: 'CBSE',
      classLevel: '10',
    },
  })
  await prisma.subjectPricing.upsert({
    where: { subjectId: physics10.id },
    update: {},
    create: {
      subjectId: physics10.id,
      ratePerExperiment: 5000,  // ₹50 per experiment
      materialCost: 10000,       // ₹100 materials
    },
  })
  const physicsExperiments = [
    'To find the image distance for varying object distances in a convex lens',
    'To find the focal length of a concave mirror',
    'To trace the path of a ray of light through a rectangular glass slab',
    'To trace the path of a ray of light through a glass prism',
    'To study the dependence of current (I) on the potential difference (V) — Ohm\'s Law',
    'To determine the equivalent resistance of two resistors when connected in series',
    'To determine the equivalent resistance of two resistors when connected in parallel',
    'To determine the refractive index of a glass slab',
  ]
  for (let i = 0; i < physicsExperiments.length; i++) {
    await prisma.experiment.upsert({
      where: { id: `phy10_${i}` },
      update: {},
      create: {
        id: `phy10_${i}`,
        subjectId: physics10.id,
        name: physicsExperiments[i],
        sortOrder: i,
      },
    })
  }
  console.log('✓ Physics CBSE 10 seeded')

  // CHEMISTRY — CBSE Class 10
  const chemistry10 = await prisma.subject.upsert({
    where: { name: 'Chemistry-CBSE-10' },
    update: {},
    create: {
      name: 'Chemistry-CBSE-10',
      board: 'CBSE',
      classLevel: '10',
    },
  })
  await prisma.subjectPricing.upsert({
    where: { subjectId: chemistry10.id },
    update: {},
    create: {
      subjectId: chemistry10.id,
      ratePerExperiment: 5000,
      materialCost: 15000,  // ₹150 materials (chemicals cost more)
    },
  })
  const chemistryExperiments = [
    'To study the action of dilute sulphuric acid on metals',
    'To study the action of dilute sulphuric acid on metal carbonates',
    'To study the action of dilute sulphuric acid on metal bicarbonates',
    'To perform and observe the following reactions: combination, decomposition, displacement, double displacement',
    'To observe the action of water on quicklime',
    'To determine the pH of given samples using pH paper',
    'To study the comparative cleaning capacity of a sample of soap in soft and hard water',
  ]
  for (let i = 0; i < chemistryExperiments.length; i++) {
    await prisma.experiment.upsert({
      where: { id: `chem10_${i}` },
      update: {},
      create: {
        id: `chem10_${i}`,
        subjectId: chemistry10.id,
        name: chemistryExperiments[i],
        sortOrder: i,
      },
    })
  }
  console.log('✓ Chemistry CBSE 10 seeded')

  // BIOLOGY — CBSE Class 10
  const biology10 = await prisma.subject.upsert({
    where: { name: 'Biology-CBSE-10' },
    update: {},
    create: {
      name: 'Biology-CBSE-10',
      board: 'CBSE',
      classLevel: '10',
    },
  })
  await prisma.subjectPricing.upsert({
    where: { subjectId: biology10.id },
    update: {},
    create: {
      subjectId: biology10.id,
      ratePerExperiment: 5000,
      materialCost: 10000,
    },
  })
  const biologyExperiments = [
    'To prepare a temporary mount of a leaf peel to show stomata',
    'To show experimentally that light is necessary for photosynthesis',
    'To show experimentally that CO2 is given out during respiration',
    'To study (a) binary fission in Amoeba, (b) budding in yeast with the help of prepared slides',
    'To identify the different parts of an embryo of a dicot seed',
    'To study homology and analogy with the help of models or photographs',
  ]
  for (let i = 0; i < biologyExperiments.length; i++) {
    await prisma.experiment.upsert({
      where: { id: `bio10_${i}` },
      update: {},
      create: {
        id: `bio10_${i}`,
        subjectId: biology10.id,
        name: biologyExperiments[i],
        sortOrder: i,
      },
    })
  }
  console.log('✓ Biology CBSE 10 seeded')

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

---

## Step 8 — Configure the Seed Script

First, install `bcryptjs` (needed for hashing the admin password):
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

Then add the seed config to `package.json`. Open it and add this inside the top-level object:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Then install `ts-node`:
```bash
npm install --save-dev ts-node
```

---

## Step 9 — Run the Seed

```bash
npx prisma db seed
```

You should see:
```
Seeding...
✓ Admin user seeded
✓ Platform config seeded
✓ Physics CBSE 10 seeded
✓ Chemistry CBSE 10 seeded
✓ Biology CBSE 10 seeded

✅ Seeding complete!
```

---

## Step 10 — Verify with Prisma Studio

Prisma Studio is a visual browser for your database:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`. Check:
- **User** table — should have 1 admin user
- **Subject** table — should have 3 subjects
- **Experiment** table — should have 21 experiments total
- **SubjectPricing** table — should have 3 rows
- **PlatformConfig** table — should have 2 rows (`flat_shipping_rate`, `per_page_cost`)

---

## What You've Built

```
Docker (PostgreSQL running)
    │
    ▼
prisma/schema.prisma (all models defined)
    │
    ▼
prisma/migrations/[timestamp]_init/ (SQL that created the tables)
    │
    ▼
Database (tables exist, seeded with initial data)
    │
    ▼
src/lib/prisma.ts (Prisma Client — ready to use in your app)
```

---

## Checklist

- [ ] Docker container running (`docker ps` shows `file_making_db`)
- [ ] `.env` has correct `DATABASE_URL`
- [ ] `prisma/schema.prisma` written
- [ ] `npx prisma migrate dev --name init` ran successfully
- [ ] `src/lib/prisma.ts` created
- [ ] `prisma/seed.ts` written
- [ ] `npx prisma db seed` ran successfully
- [ ] Prisma Studio confirms data is there

---

## Troubleshooting

**Connection refused error:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```
→ Your Docker container isn't running. Run `docker start file_making_db`.

**Authentication error:**
```
Error: P1000: Authentication failed
```
→ Check your `DATABASE_URL` password matches what you set in Docker (`password`).

**Module not found (ts-node):**
```
Cannot find module 'ts-node'
```
→ Run `npm install --save-dev ts-node` again.

---

## Next Chunk

**Chunk 02 — Authentication Setup:** NextAuth.js configuration, login/register API routes, session type extensions.
