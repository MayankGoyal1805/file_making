# Step 1: Project Setup

## What We're Doing

Initializing a Next.js project with TypeScript inside the `file_making` repo. By the end, you'll have a running dev server at `localhost:3000`.

---

## Prerequisites

- **Node.js v18+** — check with `node -v`
- **npm** — comes with Node. Check with `npm -v`

If you don't have Node installed:
```bash
# Using nvm (recommended) — https://github.com/nvm-sh/nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

---

## Steps

### 1. Initialize Next.js

Run this inside the `file_making/` directory:

```bash
npx -y create-next-app@latest ./ --typescript --eslint --app --src-dir --tailwind --import-alias "@/*"
```

**What each flag does:**
| Flag | Meaning |
|------|---------|
| `./` | Initialize in current directory (not a subfolder) |
| `--typescript` | Use TypeScript instead of plain JavaScript |
| `--eslint` | Add ESLint for catching code issues |
| `--app` | Use the App Router (newer, recommended approach) |
| `--src-dir` | Put code inside a `src/` folder for cleaner structure |
| `--tailwind` | Include Tailwind CSS v4 for utility-first styling |
| `--import-alias "@/*"` | Lets you import like `@/components/Button` instead of `../../../components/Button` |

### 2. Run the Dev Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. You should see the Next.js welcome page.

### 3. Clean Up Boilerplate

Next.js generates demo content we don't need. We'll strip it down to a blank starting point:

- **`src/app/page.tsx`** — Replace with a simple "FileMaking" heading
- **`src/app/globals.css`** — Remove demo styles, keep the Tailwind import (`@import "tailwindcss"`)
- **`src/app/layout.tsx`** — Keep as-is, this is our root layout

### 4. Understand the File Structure

After setup, your project looks like this:

```
file_making/
├── src/
│   └── app/
│       ├── layout.tsx      ← Root layout, wraps every page
│       ├── page.tsx         ← Homepage (localhost:3000)
│       ├── globals.css      ← Global styles
│       └── page.module.css  ← Scoped styles for the homepage
├── public/                  ← Static assets (images, icons)
├── markd/                   ← Our project docs
├── package.json             ← Dependencies & scripts
├── tsconfig.json            ← TypeScript configuration
├── next.config.ts           ← Next.js configuration
└── .eslintrc.json           ← Linting rules
```

---

## Key Concepts to Understand

### App Router
Next.js uses **file-based routing**. Every folder inside `src/app/` becomes a URL path, and a `page.tsx` inside it is the actual page.

```
src/app/page.tsx           →  /
src/app/order/page.tsx     →  /order
src/app/admin/page.tsx     →  /admin
```

📖 [Next.js Routing Docs](https://nextjs.org/docs/app/building-your-application/routing)

### layout.tsx
The layout wraps all pages. HTML `<head>` metadata, fonts, navbars — anything shared across pages goes here.

📖 [Next.js Layouts Docs](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)

### TypeScript Basics
If you see a `.tsx` file, it's TypeScript + JSX. The key additions over regular JS:

```typescript
// Type annotations
let name: string = "Mayank";
let pages: number = 25;

// Function parameter types
function calculatePrice(pages: number): number {
  return pages * 5;
}

// Interfaces — define the shape of objects
interface Order {
  customerName: string;
  pageCount: number;
  status: string;
}
```

📖 [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### Tailwind CSS Basics
Instead of writing CSS in separate files, you add utility classes directly in your HTML/JSX:

```html
<!-- Vanilla CSS way -->
<div class="card">...</div>  <!-- then define .card in a CSS file -->

<!-- Tailwind way -->
<div class="bg-white rounded-lg p-4 shadow-sm">...</div>  <!-- styles right here -->
```

Common classes you'll use:
| Class | What it does |
|-------|-------------|
| `p-4` | Padding on all sides (1rem) |
| `mt-2` | Margin-top (0.5rem) |
| `flex` | Display: flex |
| `text-lg` | Larger font size |
| `bg-blue-500` | Blue background |
| `rounded-lg` | Rounded corners |
| `hover:bg-blue-600` | Blue bg on hover |
| `md:flex` | Flex only on medium+ screens |

📖 [Tailwind CSS Docs](https://tailwindcss.com/docs)
📖 [Tailwind v4 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)

---

## What's Next

Once the project is running and cleaned up, we move to **Step 2: Landing Page** — building the homepage that explains the service and has a CTA to place an order.
