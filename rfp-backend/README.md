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

# 📊 Database Schema (Prisma)

### Rfp

- id, title, rawInput, structuredJson, budget, deliveryWithinDays, paymentTerms, warranty, createdAt

### Vendor

- id, name, email, createdAt

### Proposal

- id, rfpId, vendorId, rawEmailText, extractedJson, createdAt

---
