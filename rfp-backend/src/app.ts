// src/app.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./db/prisma";
import { generateStructuredRfp } from "./ai/generateRfp";
import type { Prisma } from "./generated/prisma/client";
import { parseVendorProposal } from "./ai/parseProposal";
import { sendRfpEmail } from "./email/mailer";
import { compareProposalsWithAI } from "./ai/compareProposals";


dotenv.config();

const app = express();

// Read port from env or default
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});


// List all RFPs
app.get("/rfps", async (req: Request, res: Response) => {
  try {
    const rfps = await prisma.rfp.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      rfps.map((r) => ({
        id: r.id,
        title: r.title,
        raw_input: r.rawInput,
        created_at: r.createdAt,
      }))
    );
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch RFPs" });
  }
});

// Create AI-powered RFP
app.post("/rfps", async (req: Request, res: Response) => {
  try {
    const { natural_text } = req.body as { natural_text?: string };

    if (!natural_text || typeof natural_text !== "string") {
      return res.status(400).json({ error: "natural_text is required" });
    }

    // 🔥 1. Generate RFP using OpenAI
    const structured = await generateStructuredRfp(natural_text);

    const structuredJson: Prisma.InputJsonValue = structured as unknown as Prisma.InputJsonValue;

    // 🔥 2. Save to DB using Prisma
    const created = await prisma.rfp.create({
      data: {
        title: structured.title || "Untitled RFP",
        rawInput: natural_text,
        budget: structured.budget ?? null,
        deliveryWithinDays: structured.delivery_within_days ?? null,
        paymentTerms: structured.payment_terms ?? null,
        warranty: structured.warranty ?? null,
        structuredJson,
      },
    });

    // 🔥 3. Return to frontend
    return res.status(201).json({
      id: created.id,
      raw_input: created.rawInput,
      structured_json: structured,
      created_at: created.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to generate RFP using AI",
    });
  }
});

// Create a proposal for an RFP from raw vendor text
app.post(
  "/rfps/:id/proposals",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const rfpId = Number(req.params.id);
      const { vendorId, rawText } = req.body as {
        vendorId?: number;
        rawText?: string;
      };

      if (Number.isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP id" });
      }
      if (!vendorId || Number.isNaN(Number(vendorId))) {
        return res.status(400).json({ error: "vendorId is required and must be a number" });
      }
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: "rawText is required" });
      }

      // Ensure RFP and vendor exist
      const [rfp, vendor] = await Promise.all([
        prisma.rfp.findUnique({ where: { id: rfpId } }),
        prisma.vendor.findUnique({ where: { id: Number(vendorId) } }),
      ]);

      if (!rfp) {
        return res.status(404).json({ error: "RFP not found" });
      }
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Use AI to parse vendor proposal
      const parsed = await parseVendorProposal(rawText);

      const extractedJson: Prisma.InputJsonValue =
        parsed as unknown as Prisma.InputJsonValue;

      const created = await prisma.proposal.create({
        data: {
          rfpId,
          vendorId: vendor.id,
          rawEmailText: rawText,
          extractedJson,
        },
      });

      return res.status(201).json(created);
    } catch (error: unknown) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create proposal" });
    }
  }
);

// List proposals for a given RFP (with vendor info)
app.get(
  "/rfps/:id/proposals",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const rfpId = Number(req.params.id);

      if (Number.isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP id" });
      }

      const proposals = await prisma.proposal.findMany({
        where: { rfpId },
        include: { vendor: true },
        orderBy: { createdAt: "desc" },
      });

      return res.json(
        proposals.map((p) => ({
          id: p.id,
          vendor: {
            id: p.vendor.id,
            name: p.vendor.name,
            email: p.vendor.email,
          },
          raw_email_text: p.rawEmailText,
          extracted_json: p.extractedJson,
          created_at: p.createdAt,
        }))
      );
    } catch (error: unknown) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch proposals" });
    }
  }
);

// Get all vendors
app.get("/vendors", async (req: Request, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.json(vendors);
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// Create a new vendor
app.post("/vendors", async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name || !name.trim() || !email || !email.trim()) {
      return res
        .status(400)
        .json({ error: "Both name and email are required" });
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    });

    return res.status(201).json(vendor);
  } catch (error: unknown) {
    console.error(error);

    // Handle unique email constraint
    const message =
      error instanceof Error && error.message.includes("Unique constraint")
        ? "A vendor with this email already exists"
        : "Failed to create vendor";

    return res.status(500).json({ error: message });
  }
});

// Delete a vendor
app.delete("/vendors/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid vendor id" });
    }

    // Optional: check existence first
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    await prisma.vendor.delete({ where: { id } });

    return res.status(204).send();
  } catch (error: unknown) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete vendor" });
  }
});


// Get AI comparison & recommendation for an RFP's proposals
app.get(
  "/rfps/:id/analysis",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const rfpId = Number(req.params.id);

      if (Number.isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP id" });
      }

      const rfp = await prisma.rfp.findUnique({ where: { id: rfpId } });
      if (!rfp) {
        return res.status(404).json({ error: "RFP not found" });
      }

      const proposals = await prisma.proposal.findMany({
        where: { rfpId },
        include: { vendor: true },
        orderBy: { createdAt: "asc" },
      });

      if (proposals.length === 0) {
        return res.status(400).json({ error: "No proposals for this RFP yet" });
      }

      const input = {
        rfp: {
          title: rfp.title,
          structuredJson: rfp.structuredJson as Prisma.JsonValue,
        },
        proposals: proposals.map((p) => ({
          vendorId: p.vendor.id,
          vendorName: p.vendor.name,
          extractedJson: p.extractedJson as Prisma.JsonValue,
        })),
      };

      const analysis = await compareProposalsWithAI(input);

      // Shape response for frontend
      return res.json({
        rfp: {
          id: rfp.id,
          title: rfp.title,
        },
        proposals: proposals.map((p) => ({
          id: p.id,
          vendor: {
            id: p.vendor.id,
            name: p.vendor.name,
            email: p.vendor.email,
          },
          raw_email_text: p.rawEmailText,
          extracted_json: p.extractedJson,
          created_at: p.createdAt,
        })),
        analysis,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Failed to analyze proposals for this RFP" });
    }
  }
);

// Send RFP to selected vendors via email
app.post(
  "/rfps/:id/send",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const rfpId = Number(req.params.id);
      const { vendorIds } = req.body as { vendorIds?: number[] };

      if (Number.isNaN(rfpId)) {
        return res.status(400).json({ error: "Invalid RFP id" });
      }
      if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
        return res
          .status(400)
          .json({ error: "vendorIds array is required and cannot be empty" });
      }

      const rfp = await prisma.rfp.findUnique({ where: { id: rfpId } });
      if (!rfp) {
        return res.status(404).json({ error: "RFP not found" });
      }

      const vendors = await prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
      });

      if (vendors.length === 0) {
        return res.status(404).json({ error: "No matching vendors found" });
      }

      const structured = rfp.structuredJson as Prisma.JsonValue;
      const summaryLines: string[] = [];

      // Best-effort summary from structuredJson
      if (typeof structured === "object" && structured && "title" in structured) {
        summaryLines.push(`Title: ${(structured as any).title}`);
      } else {
        summaryLines.push(`Title: ${rfp.title}`);
      }

      if (typeof structured === "object" && structured) {
        const s = structured as any;
        if (s.budget) summaryLines.push(`Budget: ${s.budget}`);
        if (s.delivery_within_days)
          summaryLines.push(`Delivery within: ${s.delivery_within_days} days`);
        if (s.payment_terms)
          summaryLines.push(`Payment terms: ${s.payment_terms}`);
        if (s.warranty) summaryLines.push(`Warranty: ${s.warranty}`);
      }

      const subject = `RFP: ${rfp.title}`;
      const baseText = [
        "Dear Vendor,",
        "",
        "You are invited to submit a proposal for the following RFP:",
        "",
        ...summaryLines,
        "",
        "Please respond with your best offer including:",
        "- Pricing",
        "- Delivery timeline",
        "- Warranty and support details",
        "- Payment terms",
        "",
        "Best regards,",
        "Procurement Team",
      ].join("\n");

      const results: { vendorId: number; email: string; success: boolean }[] = [];

      for (const v of vendors) {
        try {
          await sendRfpEmail({
            to: v.email,
            subject,
            text: baseText,
          });
          results.push({ vendorId: v.id, email: v.email, success: true });
        } catch (err) {
          console.error(`Failed to send email to ${v.email}`, err);
          results.push({ vendorId: v.id, email: v.email, success: false });
        }
      }

      const successCount = results.filter((r) => r.success).length;

      return res.json({
        rfpId,
        attempted: results.length,
        sent: successCount,
        results,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to send RFP emails" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});