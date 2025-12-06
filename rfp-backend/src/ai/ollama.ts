import { Ollama } from "ollama";
import { ENV } from "../utils/config";

export const ollama = new Ollama({
    host: "https://ollama.com",
    headers: {
      Authorization: "Bearer " + ENV.OLLAMA_API_KEY,
    },
});