// src/ai/generateRfp.ts

// import { openai } from "./openai";
// If using openAI API Key , uncomment above line

// import { openRouter } from "./openRouter"

import {ollama} from "./ollama"
import { ENV } from "../utils/config";
import { extractJson } from "../utils/helper";

export interface StructuredRfp {
  title: string;
  budget?: number | null;
  delivery_within_days?: number | null;
  payment_terms?: string | null;
  warranty?: string | null;
  items?: { name: string; quantity: number; specs?: string | null }[];
  notes?: string | null;
}

export async function generateStructuredRfp(naturalText: string): Promise<StructuredRfp> {
  const prompt = `
Convert the following procurement requirement text into a structured RFP JSON.

Requirements:
- Extract title
- Extract budget (number if possible)
- Extract delivery timeline in days
- Extract payment terms
- Extract warranty details
- Extract list of items with (name, quantity, specs) whenever possible

CRITICAL:
- Return ONLY valid JSON.
- Do NOT wrap the JSON in backticks.
- Do NOT prefix with \`\`\`json or any code fences.
- Do NOT add any explanation or text outside the JSON.

User input:
${naturalText}
`;

//   const completion = await openai.responses.create({
//     model: "gpt-4.1",
//     input: prompt,
//   });

  // If using openAI API Key , uncomment above code

  // If using openRouter API , uncomment below code

  // const completion = await openRouter.chat.send({
  //   model: 'openai/gpt-4o',
  //   messages: [
  //     {
  //       role: 'user',
  //       content: prompt,
  //     },
  //   ],
  //   stream: false,
  // });

  // return completion?.choices[0]?.message?.content as unknown as StructuredRfp;

  // ----------------- We are using Ollama Model which is free of cost ---------------------- 

  const response = await ollama.chat({
    model: ENV.OLLAMA_MODEL,
    messages: [{ role: "user", content: prompt }],
    stream: false,
  });

  const text = response.message.content.trim();

  try {
    const parsed = extractJson(text) as StructuredRfp;
    return parsed;
  } catch (err) {
    console.error("Failed to parse JSON from Ollama:", text, err);
    // You can throw or return a fallback structure here
    throw new Error("Ollama did not return valid JSON");
  }


}