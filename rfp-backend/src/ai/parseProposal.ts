// src/ai/parseProposal.ts
import { ollama } from "./ollama";
import { ENV } from "../utils/config";

export interface ParsedProposal {
  total_price?: number | null;
  currency?: string | null;
  delivery_days?: number | null;
  warranty?: string | null;
  payment_terms?: string | null;
  items?: { name: string; unit_price?: number | null; quantity?: number | null }[];
  notes?: string | null;
}

export async function parseVendorProposal(
  emailText: string
): Promise<ParsedProposal> {
  const prompt = `
You are helping parse a vendor proposal email responding to an RFP.

Extract the following fields and return ONLY valid JSON:

{
  "total_price": number | null,
  "currency": string | null,
  "delivery_days": number | null,
  "warranty": string | null,
  "payment_terms": string | null,
  "items": [
    {
      "name": string,
      "unit_price": number | null,
      "quantity": number | null
    }
  ],
  "notes": string | null
}

If any value is unknown or not mentioned, use null.

Vendor email:
${emailText}
`;

  const response = await ollama.chat({
    model: ENV.OLLAMA_MODEL,
    messages: [{ role: "user", content: prompt }],
    stream: false,
  });

  const text = response.message.content.trim();

  try {
    return JSON.parse(text) as ParsedProposal;
  } catch (err) {
    console.error("Failed to parse proposal JSON from Ollama:", text, err);
    throw new Error("Model did not return valid JSON for proposal");
  }
}