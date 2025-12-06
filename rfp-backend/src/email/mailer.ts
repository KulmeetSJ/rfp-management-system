// src/email/mailer.ts
import "dotenv/config";
import nodemailer from "nodemailer";
import { ENV } from "../utils/config";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: Number(ENV.SMTP_PORT) || 587,
  secure: ENV.SMTP_SECURE === "true",
  auth: ENV.SMTP_USER
    ? {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      }
    : undefined,
});

export async function sendRfpEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const from = ENV.SMTP_FROM || "no-reply@example.com";

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html ?? options.text,
  });

  return info;
}