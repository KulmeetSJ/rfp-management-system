# AI-Powered RFP Management System

A full-stack platform that automates the Request for Proposal (RFP) workflow using AI.  
This project was built as part of the **SDE Assignment – AI-Powered RFP Management System**.

---

## 🚀 Features

### 1. AI-Based RFP Creation

- Users enter requirements in natural language
- The system uses LLM (Ollama Cloud: `gpt-oss:120b`) to convert text into structured JSON
- Extracted fields include: budget, delivery timeline, payment terms, warranty, items list
- RFP is saved in PostgreSQL via Prisma ORM

---

### 2. Vendor Management

- Add, list & delete vendors
- Stored in Postgres database
- Multi-select vendors for sending RFP

---

### 3. Email Sending (SMTP / Gmail)

- Sends structured RFP details to selected vendors
- Implemented using Nodemailer
- Fully configurable using `.env` variables

---

### 4. Vendor Proposal Ingestion

- Vendor replies (email content) are pasted into the UI
- AI parses proposal and extracts structured information:
  - total price
  - delivery days
  - warranty
  - payment terms
  - line items
- Proposal gets stored in DB

---

### 5. Proposal Comparison & Recommendation

- AI compares all vendor proposals for an RFP
- Vendor scoring (0–100)
- AI-generated summary for each vendor
- Final recommendation with explanation

---

### 6. Tech Stack

- **Frontend:** Next.js, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **AI Model:** Ollama Cloud (`gpt-oss:120b`)
- **Email:** Nodemailer + Gmail App Password

---

# 🏗️ Project Structure

```
root/
 ├── rfp-frontend/     # Next.js + Tailwind frontend
 ├── rfp-backend/      # Express + Prisma backend
 └── README.md
```

---

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
OLLAMA_HOST=https://api.ollama.ai

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

# 🎨 Frontend Setup (rfp-frontend)

### 1. Install dependencies

```
cd rfp-frontend
npm install
```

### 2. Create `.env.local`

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

### 3. Run frontend

```
npm run dev
```

Frontend runs at:

```
http://localhost:3000
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

# ✔ Assignment Requirements Coverage

| Requirement                  | Status                |
| ---------------------------- | --------------------- |
| Natural-language RFP parsing | ✔ Done                |
| Vendor database              | ✔ Done                |
| Send RFP to vendors          | ✔ Done                |
| Ingest vendor replies        | ✔ Simulated via paste |
| AI proposal parsing          | ✔ Done                |
| Proposal comparison          | ✔ Done                |
| Recommendation               | ✔ Done                |
| React + Node stack           | ✔ Done                |
| Database persistence         | ✔ Done                |

---

# 📄 .env.example

## Backend

```
DATABASE_URL=
OLLAMA_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Frontend

```
NEXT_PUBLIC_BACKEND_URL=
```

---

# 🎉 Conclusion

This system supports the entire RFP lifecycle:

- RFP creation
- Vendor communication
- Proposal parsing
- AI evaluation

A clean, modern full-stack AI-powered application.
