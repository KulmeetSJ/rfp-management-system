// src/ai/compareProposals.ts
import { ollama } from "./ollama";
import type { Prisma } from "../generated/prisma/client";

export interface VendorScore {
  vendorId: number;
  vendorName: string;
  score: number; // 0–100
  summary: string;
}

export interface Recommendation {
  vendorId: number;
  vendorName: string;
  reason: string;
}

export interface ComparisonResult {
  vendor_scores: VendorScore[];
  recommendation: Recommendation;
}

interface CompareInput {
  rfp: {
    title: string;
    structuredJson: Prisma.JsonValue;
  };
  proposals: {
    vendorId: number;
    vendorName: string;
    extractedJson: Prisma.JsonValue;
  }[];
}


// Simple heuristic fallback if AI call fails
function heuristicCompare(input: CompareInput): ComparisonResult {
  const scores: VendorScore[] = input.proposals.map((p) => {
    const data = (p.extractedJson || {}) as any;

    const totalPrice = typeof data.total_price === "number" ? data.total_price : null;
    const deliveryDays =
      typeof data.delivery_days === "number" ? data.delivery_days : null;

    // Very naive scoring:
    // - base 60
    // - cheaper is better
    // - faster delivery is better
    let score = 60;

    if (totalPrice !== null) {
      // Just normalize roughly: lower price gets more points
      const pricePenalty = Math.min(totalPrice / 1000, 30); // crude scaling
      score += 30 - pricePenalty;
    }

    if (deliveryDays !== null) {
      const deliveryBonus = Math.max(0, 20 - Math.min(deliveryDays, 20)); // 0–20 points
      score += deliveryBonus / 2;
    }

    // Clamp to 0–100
    score = Math.max(0, Math.min(100, score));

    const summaryParts: string[] = [];
    if (totalPrice !== null) summaryParts.push(`Total price: ${totalPrice}`);
    if (deliveryDays !== null)
      summaryParts.push(`Delivery in ~${deliveryDays} days`);
    if (data.warranty) summaryParts.push(`Warranty: ${data.warranty}`);
    if (data.payment_terms)
      summaryParts.push(`Payment terms: ${data.payment_terms}`);

    return {
      vendorId: p.vendorId,
      vendorName: p.vendorName,
      score,
      summary:
        summaryParts.join("; ") || "Proposal parsed but limited data available.",
    };
  });

  // Pick best score
  const best = scores.reduce((prev, curr) =>
    curr.score > prev.score ? curr : prev
  );

  return {
    vendor_scores: scores,
    recommendation: {
      vendorId: best.vendorId,
      vendorName: best.vendorName,
      reason:
        "Heuristic recommendation based on lower price and faster delivery (fallback because AI comparison failed).",
    },
  };
}

export async function compareProposalsWithAI(
  input: CompareInput
): Promise<ComparisonResult> {
  const prompt = `
You are an expert procurement analyst.

You will receive:
- An RFP in structured JSON
- A list of vendor proposals, each in structured JSON

Your tasks:
1. Evaluate each vendor on:
   - total price
   - delivery time
   - warranty
   - payment terms
   - overall fit with the RFP
2. Assign each vendor a score from 0 to 100 (higher is better).
3. Write a short summary for each vendor (2–3 sentences).
4. Choose the best vendor and explain why.

Return ONLY valid JSON with this exact structure:

{
  "vendor_scores": [
    {
      "vendorId": number,
      "vendorName": string,
      "score": number,
      "summary": string
    }
  ],
  "recommendation": {
    "vendorId": number,
    "vendorName": string,
    "reason": string
  }
}

RFP JSON:
${JSON.stringify(input.rfp.structuredJson, null, 2)}

Vendor proposals JSON:
${JSON.stringify(
  input.proposals.map((p) => ({
    vendorId: p.vendorId,
    vendorName: p.vendorName,
    proposal: p.extractedJson,
  })),
  null,
  2
)}
`;

  const response = await ollama.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: prompt }],
    stream: false,
  });

  const text = response.message.content.trim();

  try {
    return JSON.parse(text) as ComparisonResult;
  } catch (err) {
      console.error("Ollama comparison failed, falling back to heuristic:", err);
    // Fallback: heuristic scoring so the app still works
      return heuristicCompare(input);
  }
}