# 11 — Deployment (Vercel)

## What You'll Learn
- How Vercel deployment works for Next.js
- Environment variables in production
- Database hosting options
- Production checklist

---

## Why Vercel

Next.js is built by Vercel. Deploying Next.js to Vercel is the smoothest possible experience:

- **Zero config** — push to GitHub, Vercel builds and deploys automatically
- **Serverless** — API routes become serverless functions (scales to zero, scales to millions)
- **Edge network** — Static pages served from CDN worldwide
- **Preview deployments** — every git branch gets its own URL

---

## Deployment Steps

```
1. Push code to GitHub
2. Connect GitHub repo to Vercel (vercel.com → New Project → Import)
3. Set environment variables in Vercel dashboard
4. Vercel builds and deploys automatically
5. Every push to main → auto-deploys to production
6. Every PR → gets a preview deployment URL
```

### First-Time Setup
```bash
# Install Vercel CLI (optional — you can also use the web dashboard)
npm install -g vercel

# Link your project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

---

## Environment Variables

In development, you use `.env`. In production, you set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Where It Goes | Notes |
|----------|--------------|-------|
| `DATABASE_URL` | Vercel env vars | Production Postgres URL |
| `NEXTAUTH_SECRET` | Vercel env vars | `openssl rand -base64 32` to generate |
| `NEXTAUTH_URL` | Vercel env vars | Your production URL (e.g., `https://filemaker.vercel.app`) |
| `RAZORPAY_KEY_ID` | Vercel env vars | **Live** key (not test key) |
| `RAZORPAY_KEY_SECRET` | Vercel env vars | **Live** secret |
| `RAZORPAY_WEBHOOK_SECRET` | Vercel env vars | From Razorpay dashboard |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Vercel env vars | Same as KEY_ID (public) |
| `SHIPROCKET_EMAIL` | Vercel env vars | Shiprocket credentials |
| `SHIPROCKET_PASSWORD` | Vercel env vars | Shiprocket credentials |
| `SUPABASE_URL` | Vercel env vars | If using Supabase storage |
| `SUPABASE_SERVICE_KEY` | Vercel env vars | If using Supabase storage |

> **CRITICAL:** Never commit `.env` to git. Add it to `.gitignore`.

---

## Database Hosting

Your local PostgreSQL won't work in production. Options:

| Provider | Free Tier | Pros | Cons |
|----------|-----------|------|------|
| **Supabase** | 500 MB, 2 projects | Free, Postgres, easy | Pauses after inactivity on free tier |
| **Neon** | 512 MB | Serverless Postgres, scales to zero | May have cold start latency |
| **Railway** | $5 credit/month | Easy, no cold starts | No true free tier |
| **Vercel Postgres** | Limited | Integrated with Vercel | Based on Neon, small free tier |

**Recommendation:** Start with **Supabase** or **Neon** — both offer free Postgres and work great with Prisma.

```env
# Production DATABASE_URL example (Supabase):
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

---

## Production Checklist

### Before Going Live
- [ ] All environment variables set in Vercel
- [ ] Database migrated in production: `npx prisma migrate deploy`
- [ ] Database seeded: admin user, subjects, experiments, pricing
- [ ] Razorpay switched from **test mode to live mode**
- [ ] Razorpay webhook URL points to production (e.g., `https://yourapp.vercel.app/api/payments/webhook`)
- [ ] Shiprocket credentials are for the live account
- [ ] File storage bucket permissions are configured
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` generated and set

### Security
- [ ] `.env` is in `.gitignore`
- [ ] API routes validate session/auth
- [ ] Admin routes check `isAdmin`
- [ ] File uploads validated (type, size)
- [ ] Razorpay webhook signature verified
- [ ] CORS configured if needed
- [ ] Rate limiting on API routes (can add later)

### Performance
- [ ] Images optimized (use Next.js `<Image>` component)
- [ ] Database queries have appropriate indexes
- [ ] Large lists use pagination

---

## Custom Domain (Optional)

```
Vercel Dashboard → Your Project → Settings → Domains → Add Domain
```

You'll need to:
1. Buy a domain (Namecheap, GoDaddy, Google Domains)
2. Point DNS to Vercel (they give you the records)
3. SSL is automatic

---

## 📖 Docs to Read

1. **[Vercel — Deploying Next.js](https://vercel.com/docs/frameworks/nextjs)** — Official deployment guide
2. **[Vercel — Environment Variables](https://vercel.com/docs/projects/environment-variables)** — Setting secrets
3. **[Prisma — Deploy to Vercel](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/vercel-caching-issue)** — Common Prisma + Vercel issues
4. **[Neon — Getting Started](https://neon.tech/docs/get-started-with-neon/signing-up)** — If using Neon for Postgres
5. **[Supabase — Database](https://supabase.com/docs/guides/database/overview)** — If using Supabase for Postgres
