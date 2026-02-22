# FileMaking — Project Roadmap

A platform to connect students with filemakers for getting college/school project files made and delivered via post. Think of it as bringing the "file-making shops near campus" experience online.

**Tech Stack:** Next.js (TypeScript), React, PostgreSQL, pg (raw SQL), Cloud Storage, Razorpay

**Pricing:** Per page

---

## What We Need To Build (In Order)

### 1. Project Setup
- Initialize Next.js with TypeScript
- Folder structure, linting, basic config

### 2. Landing Page
- Homepage explaining the service
- Clear CTA to place an order

### 3. Order Form
- Upload PDFs / images (instructions, reference material)
- Text instructions (paper type, handwriting style, special notes)
- Page count input (this drives pricing)
- Delivery address (Indian postal)
- Contact info (phone/WhatsApp number)

### 4. File Storage
- Cloud storage for uploaded files (AWS S3 or Cloudflare R2)
- Secure upload from the order form

### 5. Database
- PostgreSQL + pg (raw SQL queries)
- Orders table: customer info, files, instructions, address, status, payment
- Write and manage migrations as `.sql` files

### 6. Payment Integration
- Razorpay (standard in India)
- Calculate charge = page count × per-page rate
- Handle payment confirmation

### 7. Order Confirmation
- Success page with order ID
- WhatsApp link/number for communication (until in-platform chat exists)

### 8. Admin Dashboard (For You)
- View all orders
- Download uploaded files
- Update order status (received → in progress → shipped → delivered)

### 9. Auth (Can Be Later)
- Customer accounts to track order history
- Or start with guest checkout + phone number for tracking

### 10. Deployment
- Deploy to Vercel
- Connect custom domain

---

## Status

| Step | Status |
|------|--------|
| 1. Project Setup | 🟡 Up next |
| 2. Landing Page | ⬜ Not started |
| 3. Order Form | ⬜ Not started |
| 4. File Storage | ⬜ Not started |
| 5. Database | ⬜ Not started |
| 6. Payment | ⬜ Not started |
| 7. Order Confirmation | ⬜ Not started |
| 8. Admin Dashboard | ⬜ Not started |
| 9. Auth | ⬜ Not started |
| 10. Deployment | ⬜ Not started |
