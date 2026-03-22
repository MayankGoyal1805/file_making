# 09 — Shipping (Shiprocket)

## What You'll Learn
- How Shiprocket works as a shipping aggregator
- Booking a shipment via API
- Tracking shipments
- How the shipping flow fits into our order lifecycle

---

## How Shiprocket Works

```
Your Platform               Shiprocket                 Courier (Delhivery, BlueDart, etc.)
┌──────────────┐            ┌──────────────┐           ┌──────────────┐
│ Filemaker    │  API call   │ Finds best   │  Dispatch  │ Picks up     │
│ marks order  │ ─────────→ │ courier for  │ ────────→  │ from filemaker│
│ as "ready"   │             │ the route    │            │ address      │
│              │  ←─────────│ Returns AWB  │            │              │
│ Save tracking│  tracking # │ (tracking #) │            │ Delivers to  │
│ number       │             │              │            │ student      │
└──────────────┘            └──────────────┘           └──────────────┘
```

**AWB = Air Waybill** — the tracking number that identifies a shipment.

---

## Shiprocket Setup

1. Create a [Shiprocket account](https://app.shiprocket.in/)
2. Get API credentials from Settings → API
3. Add to `.env`:

```env
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password
# Shiprocket uses email/password auth, not API keys
```

### Authentication
Shiprocket uses **token-based auth**. You login with email/password, get a token, use it for all API calls:

```ts
// lib/shiprocket.ts
let token: string | null = null
let tokenExpiry: number = 0

export async function getShiprocketToken(): Promise<string> {
  // Cache token (valid for 10 days)
  if (token && Date.now() < tokenExpiry) return token

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  const data = await response.json()
  token = data.token
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000  // Refresh before 10-day expiry
  return token!
}
```

---

## Creating a Shipment

When the filemaker marks an order as "ready", your platform books a shipment:

```ts
// app/api/shipping/create-shipment/route.ts
export async function POST(request: Request) {
  const session = await auth()
  const { orderId } = await request.json()

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      filemaker: {
        include: { filemakerProfile: true },
      },
    },
  })

  if (!order || order.status !== 'ready') {
    return NextResponse.json({ error: 'Order not ready' }, { status: 400 })
  }

  const token = await getShiprocketToken()

  // 1. Create a Shiprocket order
  const shipOrder = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      order_id: order.id,
      order_date: new Date().toISOString(),
      pickup_location: 'Primary',   // Set up in Shiprocket dashboard
      billing_customer_name: order.deliveryName,
      billing_address: order.deliveryAddress,
      billing_city: order.deliveryCity,
      billing_pincode: order.deliveryPincode,
      billing_state: order.deliveryState,
      billing_country: 'India',
      billing_phone: order.deliveryPhone,
      shipping_is_billing: true,
      order_items: [{
        name: 'Practical File',
        sku: `FILE-${order.id.slice(-8)}`,
        units: 1,
        selling_price: order.totalAmount / 100,  // Shiprocket wants rupees, not paise
        hsn: '4820',  // HSN code for paper/stationery products
      }],
      payment_method: 'Prepaid',  // Already paid on our platform
      sub_total: order.totalAmount / 100,
      length: 35,   // cm — approximate file dimensions
      breadth: 25,
      height: 3,
      weight: 0.5,  // kg
    }),
  })

  const shipData = await shipOrder.json()

  // 2. Request shipment (this generates AWB / tracking number)
  const shipmentResponse = await fetch(
    'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        shipment_id: shipData.shipment_id,
      }),
    }
  )

  const awbData = await shipmentResponse.json()

  // 3. Update our database
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'shipped',
      shipmentId: String(shipData.shipment_id),
      trackingNumber: awbData.response.data.awb_code,
      courierName: awbData.response.data.courier_name,
      shippedAt: new Date(),
    },
  })

  return NextResponse.json({
    trackingNumber: awbData.response.data.awb_code,
    courierName: awbData.response.data.courier_name,
  })
}
```

```sql
-- SQL: Updating order with tracking info
UPDATE "Order"
SET "status" = 'shipped',
    "shipmentId" = '12345678',
    "trackingNumber" = 'AWB123456789',
    "courierName" = 'Delhivery',
    "shippedAt" = now(),
    "updatedAt" = now()
WHERE "id" = 'order_abc';
```

---

## Tracking

### Customer Tracking Page
The customer sees the tracking number on their order detail page. You can either:

1. **Link to courier's tracking page** (simplest):
   ```
   https://www.delhivery.com/track/package/AWB123456789
   ```
2. **Fetch tracking via Shiprocket API** (richer):
   ```ts
   const tracking = await fetch(
     `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${trackingNumber}`,
     { headers: { Authorization: `Bearer ${token}` } }
   )
   ```

**For MVP**, option 1 (just display tracking number + courier name) is enough.

---

## Pickup Address Setup

Filemakers register their pickup address once. In Shiprocket's system, you add pickup locations via the dashboard or API:

```ts
// Add pickup location via API
await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/addpickup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    pickup_location: `maker_${filemakerId}`,
    address: filemakerProfile.pickupAddress,
    city: filemakerProfile.city,
    state: filemakerProfile.state,
    pin_code: filemakerProfile.pincode,
    phone: filemakerProfile.whatsapp,
  }),
})
```

---

## Flat Shipping Rate (MVP)

Remember — for MVP we charge a **flat shipping rate** set by the admin in `PlatformConfig`. The actual Shiprocket shipping cost may differ, and the difference is absorbed by the platform margin.

```ts
// At order creation, get flat rate:
const shippingConfig = await prisma.platformConfig.findUnique({
  where: { key: 'flat_shipping_rate' },
})
const shippingCost = parseInt(shippingConfig!.value)  // e.g., 8000 (₹80)
```

---

## 📖 Docs to Read

1. **[Shiprocket API Docs](https://apidocs.shiprocket.in/)** — Full API reference
2. **[Shiprocket — Create Order](https://apidocs.shiprocket.in/#29f22263-4d0c-4470-b4ef-8a9db tried)** — Creating shipment orders
3. **[Shiprocket — Track Shipment](https://apidocs.shiprocket.in/#42cf2851-89c3-4336-a9de-84e8c0e0a025)** — Tracking API
