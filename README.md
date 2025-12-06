# AI-Powered RFP Management System

A full-stack platform that automates the Request for Proposal (RFP) workflow using AI.  
This project was built as part of the **SDE Assignment – AI-Powered RFP Management System**.
It includes AI-based RFP generation, vendor management, proposal parsing, comparison, and automated recommendation.

---

## 🚀 Features

### 1. AI-Based RFP Creation

- Users enter requirements in natural language
- The system uses LLM (Ollama Cloud: `gpt-oss:20b`) to convert text into structured JSON
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
- **AI Model:** Ollama Cloud (`gpt-oss:20b`)
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

# 1. Project Setup

## 1.a Prerequisites

### **Backend**

- Node.js ≥ 18
- PostgreSQL
- Ollama Cloud API Key
  - Model used: **gpt-oss:20b**
- SMTP credentials (Gmail or others)

### **Frontend**

- Node.js ≥ 18
- Next.js 14+
- TailwindCSS

---

## 1.b Installation Steps

### Clone Repository

```bash
git clone <repo_url>
cd rfp-management-system
```

---

## Backend Setup

```bash
cd rfp-backend
npm install
```

Create `.env`:

```
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/rfp_db

OLLAMA_API_KEY=your_api_key
OLLAMA_MODEL=gpt-oss:20b
OLLAMA_HOST=https://api.ollama.ai

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Initialize database:

```bash
npx prisma migrate dev
```

Run backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd rfp-frontend
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

Run frontend:

```bash
npm run dev
```

Browser:

```
http://localhost:3000
```

---

## 1.c Email Sending Configuration

The system uses Nodemailer.  
For Gmail:

1. Enable **2FA**
2. Create an **App Password**
3. Use it as `SMTP_PASS`

RFP emails are sent from the **Vendors page**, where you select vendors and click _Send RFP_.

---

## 1.d Running Everything Locally

Backend:

```bash
npm run dev
```

Frontend:

```bash
npm run dev
```

---

## 1.e Seed Data

Vendors can be added directly from the UI — no seed script required.

---

# 2. Tech Stack

## Frontend

- Next.js 14
- React
- TailwindCSS

## Backend

- Node.js + Express
- Prisma ORM
- PostgreSQL
- Nodemailer
- Ollama Cloud API

## AI

- Ollama Cloud model: **gpt-oss:20b**

## Key Libraries

- express
- prisma
- nodemailer
- dotenv

---

# 3. API Documentation

## RFP Endpoints

### **POST /rfps**

Create AI-generated RFP from natural text.

**Request**

```json
{ "natural_text": "I need 20 laptops..." }
```

**Response**

```json
{
  "id": 1,
  "title": "...",
  "structured_json": { ... }
}
```

---

### **GET /rfps**

List RFPs.

---

### **POST /rfps/:id/send**

Send RFP invitation emails.

**Request**

```json
{
  "vendorIds": [1, 2]
}
```

---

### **POST /rfps/:id/proposals**

Submit vendor reply text for automatic parsing.

**Request**

```json
{
  "vendor_id": 1,
  "proposal_text": "We offer..."
}
```

---

### **GET /rfps/:id/analysis**

AI proposal comparison + recommendation.

**Response**

```json
{
  "recommendation": "...",
  "scores": [{ "vendor": "A", "score": 90 }]
}
```

---

# 4. Decisions & Assumptions

## Design Decisions

### AI-Based RFP Creation

LLM extracts:

- title
- budget
- delivery time
- payment terms
- warranty
- item list

### Vendor Responses

Instead of building full IMAP ingestion, users **paste replies manually**, which fulfills assignment requirements while simplifying implementation.

### Proposal Comparison

AI generates:

- scores
- reasoning
- final recommendation

Allows flexible evaluation without fixed scoring rules.

### Model Choice

`gpt-oss:20b` used due to:

- faster response time
- lower cost
- strong accuracy

### Safety & Formatting

A generic `formatValue()` ensures email fields never show `[object Object]`.

---

## Assumptions

1. Vendor replies are pasted as raw free‑form text.
2. Email ingestion is simulated (acceptable per assignment).
3. AI output may vary → backend sanitizes JSON.
4. Vendor deletion is blocked if proposals exist.
5. Plain-text email templates for reliability.

---

# 5. AI Tools Usage

## Tools Used

- ChatGPT
- GitHub Copilot
- Ollama Cloud API

## Contributions

AI tools assisted with:

- Designing Prisma schema
- Writing Express routers
- Parsing JSON from LLM
- Debugging
- React component scaffolding
- Proposing comparison scoring logic

## Example Prompts

- “Convert natural procurement text into structured JSON.”
- “Extract pricing and warranty from messy vendor email.”
- “Compare these proposals and recommend a vendor.”

## Learnings

- LLMs extract business data from unstructured text reliably.
- Smaller models (20b) perform better for fast iteration.
- Must sanitize JSON before DB insertion.
- Having centralized config improves maintainability.

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

# 🎉 Conclusion

This system supports the entire RFP lifecycle:

- RFP creation
- Vendor communication
- Proposal parsing
- AI evaluation

A clean, modern full-stack AI-powered application.
