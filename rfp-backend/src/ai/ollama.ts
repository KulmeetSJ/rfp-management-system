import { Ollama } from "ollama";
import { ENV } from "../utils/config";

export const ollama = new Ollama({
    host: ENV.OLLAMA_HOST,
    headers: {
      Authorization: "Bearer " + ENV.OLLAMA_API_KEY,
    },
});