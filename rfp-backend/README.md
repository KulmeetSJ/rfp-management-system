# ⚙️ Backend Setup (rfp-backend)

### 1. Install dependencies

```
cd rfp-backend
npm install
```

---

### 2. Create `.env`

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/rfp_db?schema=public"

# Ollama Cloud
OLLAMA_API_KEY=your_ollama_api_key
OLLAMA_HOST=https://ollama.com
OLLAMA_MODEL=gpt-oss:20b

# Gmail SMTP (requires App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Procurement AI <yourgmail@gmail.com>"
```

---

### 3. Prisma setup

```
npx prisma migrate dev
npx prisma generate
```

---

### 4. Run backend

```
npm run dev
```

Backend runs at:

```
http://localhost:4000
```

---

# 🧪 End-to-End Workflow Testing

## Step 1 — Create RFP

- Go to `/`
- Enter a natural language requirement
- AI generates structured RFP → saved in DB

## Step 2 — Add Vendors

- Go to `/vendors`
- Add one or more vendors

## Step 3 — Send RFP

- Select RFP + vendors
- Click **Send RFP**
- Email delivered via Gmail SMTP

## Step 4 — Vendor Reply

- Vendor replies to RFP email
- Copy the email text

## Step 5 — Add Proposal

- Go to `/comparison`
- Select vendor and paste email text
- AI extracts structured proposal → saved in DB

## Step 6 — Comparison

- View AI-generated:
  - Vendor scores
  - Summaries
  - Final recommendation

---

# 📊 Database Schema (Prisma)

### Rfp

- id, title, rawInput, structuredJson, budget, deliveryWithinDays, paymentTerms, warranty, createdAt

### Vendor

- id, name, email, createdAt

### Proposal

- id, rfpId, vendorId, rawEmailText, extractedJson, createdAt

---
