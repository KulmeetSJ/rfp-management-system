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
  } catch (error) {
    console.error("Failed to parse comparison JSON from Ollama:", text, error);
    throw new Error("Model did not return valid JSON for comparison");
  }
}