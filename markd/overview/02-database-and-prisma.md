# 02 — Database & Prisma

## What You'll Learn
- How PostgreSQL fits into our project
- What Prisma does and why we use it
- How Prisma schema maps to SQL tables
- Basic Prisma queries with their SQL equivalents

---

## Concepts

### PostgreSQL — Your Database
You already know SQL. PostgreSQL is just a specific database engine that runs SQL. It's free, open-source, and handles everything from hobby projects to Instagram-scale.

**For local development**, you'll run Postgres on your machine. Two options:
- **Docker** (recommended) — `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`
- **Native install** — [Download PostgreSQL](https://www.postgresql.org/download/)

### Prisma — The Bridge Between Your Code and Database

Without Prisma, you'd write raw SQL in your TypeScript code:
```ts
// Without Prisma — raw SQL (error-prone, no type safety)
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])
const user = result.rows[0]  // What type is this? ¯\_(ツ)_/¯
```

With Prisma:
```ts
// With Prisma — type-safe, autocomplete in your editor
const user = await prisma.user.findUnique({ where: { id: userId } })
// TypeScript KNOWS that user.email is a string, user.isFilemaker is a boolean, etc.
```

### The Three Parts of Prisma

| Part | What It Does |
|------|-------------|
| **Prisma Schema** (`schema.prisma`) | You define your models (tables) here. Single source of truth |
| **Prisma Client** | Auto-generated TypeScript code to query the DB. Updates when you change schema |
| **Prisma Migrate** | Converts schema changes into SQL migrations. Tracks version history |

### The Workflow

```
1. Edit schema.prisma  (add/change models)
       │
       ▼
2. npx prisma migrate dev --name "description"  (generates SQL migration + updates client)
       │
       ▼
3. Use prisma client in your code  (queries are now type-safe)
```

---

## Schema ↔ SQL Mapping

### Defining a Model

**Prisma:**
```prisma
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

  orders      Order[]  // one-to-many relation
}
```

**Equivalent SQL:**
```sql
CREATE TABLE "User" (
  "id"          TEXT         PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"       TEXT         UNIQUE NOT NULL,
  "name"        TEXT         NOT NULL,
  "password"    TEXT         NOT NULL,
  "phone"       TEXT,                              -- nullable (the ? in Prisma)
  "isFilemaker" BOOLEAN      NOT NULL DEFAULT false,
  "isAdmin"     BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL
);
```

> **Note:** `String?` in Prisma = nullable column. Without `?` = `NOT NULL`.
> `@default(cuid())` generates a unique string ID. In SQL, we approximate with `gen_random_uuid()`.

### Relationships

**Prisma:**
```prisma
model Order {
  id         String   @id @default(cuid())
  customerId String
  customer   User     @relation("CustomerOrders", fields: [customerId], references: [id])
  status     String   @default("pending")
}

model User {
  id     String  @id @default(cuid())
  orders Order[] @relation("CustomerOrders")
}
```

**Equivalent SQL:**
```sql
CREATE TABLE "Order" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" TEXT NOT NULL REFERENCES "User"("id"),
  "status"     TEXT NOT NULL DEFAULT 'pending'
);

-- The "orders Order[]" in Prisma doesn't create a column.
-- It just tells Prisma about the reverse side of the relationship.
-- In SQL, the foreign key on Order.customerId IS the relationship.
```

---

## Common Queries — Prisma vs SQL

### Create
```ts
// Prisma
const user = await prisma.user.create({
  data: {
    email: 'student@example.com',
    name: 'Rahul',
    password: hashedPassword,
  },
})
```
```sql
-- SQL
INSERT INTO "User" ("id", "email", "name", "password", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'student@example.com', 'Rahul', '$2b$...hashed', now(), now())
RETURNING *;
```

### Find One
```ts
// Prisma
const user = await prisma.user.findUnique({
  where: { email: 'student@example.com' },
})
```
```sql
-- SQL
SELECT * FROM "User" WHERE "email" = 'student@example.com' LIMIT 1;
```

### Find Many with Filter
```ts
// Prisma
const openOrders = await prisma.order.findMany({
  where: { status: 'paid', filemakerId: null },
  include: { customer: true },   // JOIN with User table
  orderBy: { createdAt: 'desc' },
})
```
```sql
-- SQL
SELECT o.*, u.*
FROM "Order" o
JOIN "User" u ON o."customerId" = u."id"
WHERE o."status" = 'paid' AND o."filemakerId" IS NULL
ORDER BY o."createdAt" DESC;
```

### Update
```ts
// Prisma
await prisma.order.update({
  where: { id: orderId },
  data: { status: 'assigned', filemakerId: makerId },
})
```
```sql
-- SQL
UPDATE "Order"
SET "status" = 'assigned', "filemakerId" = 'maker_123', "updatedAt" = now()
WHERE "id" = 'order_abc';
```

### Delete
```ts
// Prisma
await prisma.user.delete({ where: { id: userId } })
```
```sql
-- SQL
DELETE FROM "User" WHERE "id" = 'user_xyz';
```

---

## Setting Up Prisma (When We Get There)

```bash
# Install Prisma
npm install prisma --save-dev
npm install @prisma/client

# Initialize (creates prisma/schema.prisma and .env)
npx prisma init

# After editing schema.prisma, run migration:
npx prisma migrate dev --name "init"

# Open Prisma Studio (visual DB browser — very handy)
npx prisma studio
```

Your `.env` file will have:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/file_making?schema=public"
```

---

## 📖 Docs to Read

1. **[Prisma — Quickstart](https://www.prisma.io/docs/getting-started/quickstart-sqlite)** — Follow along (they use SQLite but concepts are same)
2. **[Prisma — Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference)** — Types, attributes, relations
3. **[Prisma — CRUD Operations](https://www.prisma.io/docs/orm/prisma-client/queries/crud)** — All the query methods
4. **[Prisma — Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations)** — How to model relationships
5. **[PostgreSQL Tutorial](https://www.postgresqltutorial.com/)** — Skim sections you're less familiar with
