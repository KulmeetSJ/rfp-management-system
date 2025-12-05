import "dotenv/config";
import { OpenRouter } from '@openrouter/sdk';

if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not set");
}

export const openRouter = new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY
  });

  