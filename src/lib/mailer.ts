import nodemailer from "nodemailer";
import type { SentMessageInfo, Transporter } from "nodemailer";
import { getSendSafetyState, type SendSafetyState } from "@/lib/database";
import { resolveEmailSettings, type EmailSettings } from "@/lib/email_settings";
import { candidateProfile } from "@/lib/profile";
import type { ApplicationPackage } from "@/lib/templates";

const millisecondsPerSecond: number = 1000;

export interface SendResult {
  messageId: string;
  sentAt: string;
}

export async function sendApplication(recipientEmail: string, application: ApplicationPackage): Promise<SendResult> {
  const settings: EmailSettings = resolveEmailSettings();
  validateConfiguration(settings);
  validateRecipient(recipientEmail);
  validateSendLimits(getSendSafetyState());
  const transporter: Transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.isSecure,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });
  const fromEmail: string = settings.fromEmail || candidateProfile.email;
  const shouldRequestReceipt: boolean = process.env.REQUEST_READ_RECEIPTS === "true";
  const information: SentMessageInfo = await transporter.sendMail({
    from: { name: settings.fromName || candidateProfile.fullName, address: fromEmail },
    to: recipientEmail,
    replyTo: fromEmail,
    subject: application.subject,
    text: application.emailText,
    html: application.emailHtml,
    headers: shouldRequestReceipt ? {
      "Disposition-Notification-To": fromEmail,
      "Return-Receipt-To": fromEmail,
    } : undefined,
    attachments: [
      {
        filename: `${createFileName(candidateProfile.fullName)}_Resume.doc`,
        content: Buffer.from(application.resumeHtml, "utf8"),
        contentType: "application/msword",
      },
      {
        filename: `${createFileName(candidateProfile.fullName)}_Cover_Letter.txt`,
        content: application.coverLetterText,
        contentType: "text/plain",
      },
    ],
  });
  return { messageId: String(information.messageId), sentAt: new Date().toISOString() };
}

function validateConfiguration(settings: EmailSettings): void {
  const missingFields: string[] = Object.entries({ host: settings.host, user: settings.user, password: settings.password, fromEmail: settings.fromEmail }).filter(([_field, value]: [string, string]): boolean => !value).map(([field]: [string, string]): string => field);
  if (missingFields.length > 0) {
    throw new Error(`Missing email configuration: ${missingFields.join(", ")}`);
  }
}

function validateRecipient(recipientEmail: string): void {
  const emailPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(recipientEmail)) {
    throw new Error("A valid, publicly listed recruiting email is required.");
  }
}

function validateSendLimits(state: SendSafetyState): void {
  const dailyLimit: number = Number(process.env.DAILY_SEND_LIMIT ?? "20");
  const weeklyLimit: number = Number(process.env.WEEKLY_SEND_LIMIT ?? "100");
  const minimumDelay: number = Number(process.env.MINIMUM_SEND_DELAY_SECONDS ?? "90");
  if (state.sentToday >= dailyLimit) {
    throw new Error(`Daily safety limit of ${dailyLimit} messages reached.`);
  }
  if (state.sentThisWeek >= weeklyLimit) {
    throw new Error(`Weekly safety limit of ${weeklyLimit} messages reached.`);
  }
  if (state.lastSentAt && Date.now() - new Date(state.lastSentAt).getTime() < minimumDelay * millisecondsPerSecond) {
    throw new Error(`Wait at least ${minimumDelay} seconds between messages.`);
  }
}

function createFileName(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}
