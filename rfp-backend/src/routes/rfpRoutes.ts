// src/routes/rfpRoutes.ts
import { Router, Request, Response } from "express";
import prisma from "../db/prisma";
import type { Prisma } from "../generated/prisma/client";
import { generateStructuredRfp } from "../ai/generateRfp";
import { parseVendorProposal } from "../ai/parseProposal";
import { compareProposalsWithAI } from "../ai/compareProposals";
import { sendRfpEmail } from "../email/mailer";
import {formatValue} from "../utils/helper";

const router = Router();

// POST /rfps  (AI-powered RFP creation)
router.post("/", async (req: Request, res: Response): Promise<Response> => {
  try {
    const { natural_text } = req.body as { natural_text?: string };

    if (!natural_text || typeof natural_text !== "string") {
      return res.status(400).json({ error: "natural_text is required" });
    }

    const structured = await generateStructuredRfp(natural_text);

    const structuredJson: Prisma.InputJsonValue =
      structured as unknown as Prisma.InputJsonValue;

    const safeBudget =
      typeof (structured as any).budget === "number"
        ? (structured as any).budget
        : null;
    
    const safeDeliveryWithinDays =
      typeof (structured as any).delivery_within_days === "number"
        ? (structured as any).delivery_within_days
        : null;

    const safeWarranty =
      typeof (structured as any).warranty === "string"
        ? (structured as any).warranty
        : null;
  
    const created = await prisma.rfp.create({
      data: {
        title: structured.title || "Untitled RFP",
        rawInput: natural_text,
        budget: safeBudget,
        deliveryWithinDays: safeDeliveryWithinDays,
        paymentTerms: structured.payment_terms ?? null,
        warranty: safeWarranty,
        structuredJson,
      },
    });

    return res.status(201).json({
      id: created.id,
      raw_input: created.rawInput,
      structured_json: structured,
      created_at: created.createdAt,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to generate RFP using AI" });
  }
});

// GET /rfps  (list RFPs)
router.get("/", async (_req: Request, res: Response): Promise<Response> => {
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch RFPs" });
  }
});

// POST /rfps/:id/proposals  (create proposal from vendor email text)
router.post(
  "/:id/proposals",
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
        return res
          .status(400)
          .json({ error: "vendorId is required and must be a number" });
      }
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ error: "rawText is required" });
      }

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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create proposal" });
    }
  }
);

// GET /rfps/:id/proposals  (list proposals for an RFP)
router.get(
  "/:id/proposals",
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch proposals" });
    }
  }
);

// GET /rfps/:id/analysis  (AI comparison)
router.get(
  "/:id/analysis",
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
        return res
          .status(400)
          .json({ error: "No proposals for this RFP yet" });
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

// POST /rfps/:id/send  (email RFP to vendors)
router.post(
  "/:id/send",
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

      if (typeof structured === "object" && structured && "title" in structured) {
        summaryLines.push(`Title: ${formatValue((structured as any).title)}`);
      } else {
        summaryLines.push(`Title: ${formatValue(rfp.title)}`);
      }

      if (typeof structured === "object" && structured) {
        const s = structured as any;

        if (s.budget !== undefined) {
          summaryLines.push(`Budget: ${formatValue(s.budget)}`);
        }

        if (s.delivery_within_days !== undefined) {
          summaryLines.push(
            `Delivery within: ${formatValue(s.delivery_within_days)}`
          );
        }

        if (s.payment_terms !== undefined) {
          summaryLines.push(
            `Payment terms: ${formatValue(s.payment_terms)}`
          );
        }

        if (s.warranty !== undefined) {
          summaryLines.push(`Warranty: ${formatValue(s.warranty)}`);
        }
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

export default router;