// src/email/mailer.ts
import "dotenv/config";
import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST) {
  console.warn("Warning: SMTP_HOST not set. Email sending will fail.");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendRfpEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from = process.env.SMTP_FROM || "no-reply@example.com";

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text,
  });

  return info;
}