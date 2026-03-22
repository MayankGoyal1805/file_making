# 06 — File Storage

## What You'll Learn
- How file uploads work in web apps
- Cloud storage options and tradeoffs
- Uploading files from browser → server → cloud
- Signed URLs for secure downloads

---

## How File Uploads Work

```
Browser                    Next.js Server               Cloud Storage
┌──────────┐              ┌──────────────┐              ┌──────────────┐
│ <input    │   FormData   │  API Route   │   SDK/API    │  S3 / Supa   │
│  type=    │ ──────────→  │  receives    │ ──────────→  │  stores file │
│  "file">  │   (POST)     │  file buffer │   upload     │  returns URL │
│           │              │              │              │              │
└──────────┘              └──────────────┘              └──────────────┘
```

1. User selects a file in the browser (`<input type="file">`)
2. JavaScript creates a `FormData` object with the file
3. `fetch()` POSTs the FormData to your API route
4. API route reads the file, uploads it to cloud storage
5. Cloud returns a URL — you save this URL in your database

---

## Cloud Storage Options

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **Supabase Storage** | Easy setup, generous free tier, works with Supabase ecosystem | Less flexible than S3 | If you want simplicity |
| **AWS S3** | Industry standard, extremely flexible, cheap | More setup, AWS console is overwhelming | If you want to learn the industry standard |
| **Cloudinary** | Amazing for images (auto-resize, optimize), easy API | Pricing can get expensive, not ideal for PDFs | If most uploads are images |

**Recommendation for this project:** Start with **Supabase Storage** (simplest) or **AWS S3** (most to learn). We'll finalize when we implement.

---

## Upload Pattern (Supabase Storage Example)

### Frontend — The Upload Form
```tsx
'use client'
import { useState } from 'react'

export default function FileUploadStep({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<File[]>([])

  async function handleUpload() {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    formData.append('orderId', orderId)
    formData.append('fileType', 'instruction')  // or 'print_page'

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      // NOTE: Do NOT set Content-Type header — browser sets it with boundary
    })
    const data = await response.json()
    // data.files → array of { fileName, fileUrl }
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
      />
      <button onClick={handleUpload}>Upload Files</button>
    </div>
  )
}
```

### Backend — API Route
```ts
// app/api/upload/route.ts
import { auth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const orderId = formData.get('orderId') as string
  const fileType = formData.get('fileType') as string

  const uploadedFiles = []

  for (const file of files) {
    // Create a unique path: orders/{orderId}/{timestamp}_{filename}
    const path = `orders/${orderId}/${Date.now()}_${file.name}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('order-files')   // bucket name
      .upload(path, file)

    if (error) throw error

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('order-files')
      .getPublicUrl(path)

    // Save to database
    const orderFile = await prisma.orderFile.create({
      data: {
        orderId,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        fileType,
        fileSize: file.size,
      },
    })

    uploadedFiles.push(orderFile)
  }

  return NextResponse.json({ files: uploadedFiles })
}
```

**SQL equivalent of the DB insert:**
```sql
INSERT INTO "OrderFile" ("id", "orderId", "fileName", "fileUrl", "fileType", "fileSize", "createdAt")
VALUES (gen_random_uuid(), 'order_123', 'practical.pdf', 'https://...url', 'instruction', 245000, now())
RETURNING *;
```

---

## Signed URLs (For Private Files)

If you don't want files to be publicly accessible (which you probably don't — these are student's files), use **signed URLs**: temporary links that expire.

```ts
// Generate a signed URL (valid for 1 hour)
const { data } = await supabase.storage
  .from('order-files')
  .createSignedUrl('orders/order_123/practical.pdf', 3600)  // 3600 seconds = 1 hour

// data.signedUrl → "https://...?token=xxx&expires=..."
```

The filemaker's dashboard would generate signed URLs on-demand when they want to download files.

---

## File Validation

Always validate on the server:

```ts
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

for (const file of files) {
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `File ${file.name} is too large (max 10MB)` }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: `File type ${file.type} not allowed` }, { status: 400 })
  }
}
```

---

## 📖 Docs to Read

1. **[MDN — Using FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects)** — How FormData works
2. **[MDN — File API](https://developer.mozilla.org/en-US/docs/Web/API/File)** — The File object in JavaScript
3. **[Supabase Storage Docs](https://supabase.com/docs/guides/storage)** — If we go with Supabase
4. **[AWS S3 — JavaScript SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html)** — If we go with S3
