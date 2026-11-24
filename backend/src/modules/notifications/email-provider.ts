import { env } from "../../config/env.js";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<string>;
}

export class ResendEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<string> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) throw new Error(`Email provider returned HTTP ${response.status}.`);
    const result: unknown = await response.json();
    if (typeof result !== "object" || result === null || !("id" in result) || typeof result.id !== "string") {
      throw new Error("Email provider response did not contain a message ID.");
    }
    return result.id;
  }
}

export function createEmailProvider(): EmailProvider | null {
  if (env.EMAIL_PROVIDER === "disabled") return null;
  return new ResendEmailProvider();
}
