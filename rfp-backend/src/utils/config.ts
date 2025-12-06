import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Export all your env variables here
export const ENV = {
  PORT: process.env.PORT ?? "4000",
  NODE_ENV: process.env.NODE_ENV ?? "development",

  DATABASE_URL: requireEnv("DATABASE_URL"),
  OLLAMA_API_KEY: requireEnv("OLLAMA_API_KEY"),
  OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "gpt-oss:20b",
  OLLAMA_HOST: process.env.OLLAMA_HOST ?? "https://ollama.com",

  SMTP_HOST: requireEnv("SMTP_HOST"),
  SMTP_PORT: requireEnv("SMTP_PORT"),
  SMTP_USER: requireEnv("SMTP_USER"),
  SMTP_PASS: requireEnv("SMTP_PASS"),
  SMTP_FROM: requireEnv("SMTP_FROM"),
  SMTP_SECURE: requireEnv("SMTP_SECURE")
};