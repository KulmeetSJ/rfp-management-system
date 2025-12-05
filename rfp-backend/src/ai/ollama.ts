import "dotenv/config";
import { Ollama } from "ollama";

if (!process.env.OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY is not set");
}

export const ollama = new Ollama({
    host: "https://ollama.com",
    headers: {
      Authorization: "Bearer " + process.env.OLLAMA_API_KEY,
    },
});