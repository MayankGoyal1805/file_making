# 03 — Authentication (NextAuth.js)

## What You'll Learn
- How authentication works in web apps (sessions, tokens)
- What NextAuth.js handles for you
- How to set up credential-based auth (email + password)
- Role-based access control (customer / filemaker / admin)

---

## Concepts

### Authentication vs Authorization
- **Authentication** = "Who are you?" → Login, prove your identity
- **Authorization** = "What can you do?" → Are you a customer, filemaker, or admin?

### How Sessions Work

```
1. User submits email + password
2. Server verifies credentials against the database
3. Server creates a SESSION (stores it in DB or as a JWT cookie)
4. Browser receives a session cookie
5. Every subsequent request sends the cookie automatically
6. Server reads cookie → knows who the user is
```

NextAuth handles all of this. You configure it, not build it.

### JWT vs Database Sessions
- **JWT (JSON Web Token)** — Session data stored in a signed cookie. No DB lookup on every request. Faster, but can't easily revoke sessions.
- **Database sessions** — Session stored in a DB table. Server looks it up on every request. Slower, but you can revoke sessions.

**We'll use JWT** (default in NextAuth) — simpler for MVP.

---

## NextAuth Setup for Our Project

### Configuration

```ts
// lib/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 1. Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user) return null

        // 2. Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null

        // 3. Return user object (this goes into the session)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isFilemaker: user.isFilemaker,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  callbacks: {
    // Add custom fields to the JWT token
    async jwt({ token, user }) {
      if (user) {
        token.isFilemaker = user.isFilemaker
        token.isAdmin = user.isAdmin
      }
      return token
    },
    // Make custom fields available in the session
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.isFilemaker = token.isFilemaker as boolean
      session.user.isAdmin = token.isAdmin as boolean
      return session
    },
  },
})
```

### What's Happening Here

1. **CredentialsProvider** — We use email + password login (not OAuth like Google/GitHub)
2. **`authorize` function** — This runs when a user tries to log in. It checks the DB and verifies the password
3. **`bcrypt`** — Passwords are never stored in plain text. `bcrypt.hash()` creates a hash, `bcrypt.compare()` verifies it
4. **Callbacks** — We add `isFilemaker` and `isAdmin` to the JWT so we can check the user's role on any page without a DB query

### SQL Equivalent of the Login Check

```sql
-- What authorize() does under the hood:
SELECT * FROM "User" WHERE "email" = 'student@example.com' LIMIT 1;
-- Then bcrypt.compare() in application code (can't do bcrypt in SQL)
```

---

## Protecting Routes (Authorization)

### In Server Components
```tsx
// app/(customer)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const session = await auth()

  // Not logged in → redirect to login
  if (!session) redirect('/login')

  return <h1>Welcome, {session.user.name}</h1>
}
```

### In API Routes
```ts
// app/api/orders/route.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only customers can create orders
  // (filemakers and admins technically are customers too, but you get the idea)
  const body = await request.json()
  // ... create order
}
```

### Admin-Only Routes
```tsx
// app/(admin)/admin/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user.isAdmin) redirect('/')

  return <h1>Admin Panel</h1>
}
```

---

## Registration Flow

Since NextAuth doesn't have a built-in registration, you'll create a **custom API route**:

```ts
// app/api/auth/register/route.ts
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, name, password } = await request.json()

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { email, name, password: hashedPassword },
  })

  return NextResponse.json({ user: { id: user.id, email: user.email } }, { status: 201 })
}
```

**SQL equivalent:**
```sql
-- Check existing
SELECT * FROM "User" WHERE "email" = 'student@example.com';

-- Create (password hashing done in application code)
INSERT INTO "User" ("id", "email", "name", "password", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'student@example.com', 'Rahul', '$2b$12$...hashed', now(), now())
RETURNING "id", "email";
```

---

## Role Model Recap

```
┌─────────────┐
│    User      │
│──────────────│
│ isFilemaker  │──── false (default) = Customer only
│              │──── true = Customer + Filemaker
│ isAdmin      │──── true = Developer only (hardcoded)
└─────────────┘
```

- Everyone who signs up is a **customer**
- Filemakers apply → admin sets `isFilemaker = true`
- Admin is just a user with `isAdmin = true` (seeded in DB)
- No separate tables for roles. Just boolean flags. Simple.

---

## 📖 Docs to Read

1. **[Auth.js — Getting Started (Next.js)](https://authjs.dev/getting-started/installation?framework=Next.js)** — Official setup guide
2. **[Auth.js — Credentials Provider](https://authjs.dev/getting-started/providers/credentials)** — Email + password auth
3. **[Auth.js — Session Management](https://authjs.dev/getting-started/session-management/protecting)** — Protecting pages and API routes
4. **[MDN — HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)** — How cookies work (sessions rely on this)
5. **[bcrypt explained](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)** — Why we hash passwords
