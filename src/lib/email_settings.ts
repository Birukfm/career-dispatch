import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export const emailProviders = ["gmail", "microsoft", "custom"] as const;

export type EmailProvider = (typeof emailProviders)[number];

export interface EmailSettings {
  provider: EmailProvider;
  host: string;
  port: number;
  isSecure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface PublicEmailSettings {
  provider: EmailProvider;
  host: string;
  port: number;
  isSecure: boolean;
  user: string;
  fromName: string;
  fromEmail: string;
  hasPassword: boolean;
  passwordHint: string;
  isConfigured: boolean;
}

const dataDirectory: string = path.join(process.cwd(), "data");
const settingsPath: string = path.join(dataDirectory, "email_settings.json");
const temporarySettingsPath: string = path.join(dataDirectory, "email_settings.tmp.json");
mkdirSync(dataDirectory, { recursive: true });

export function resolveEmailSettings(): EmailSettings {
  const storedSettings: Partial<EmailSettings> = readStoredEmailSettings();
  const host: string = storedSettings.host || process.env.SMTP_HOST || "";
  return {
    provider: storedSettings.provider ?? inferProvider(host),
    host,
    port: storedSettings.port ?? Number(process.env.SMTP_PORT ?? "587"),
    isSecure: storedSettings.isSecure ?? process.env.SMTP_SECURE === "true",
    user: storedSettings.user || process.env.SMTP_USER || "",
    password: storedSettings.password || process.env.SMTP_PASSWORD || "",
    fromName: storedSettings.fromName || process.env.SMTP_FROM_NAME || "",
    fromEmail: storedSettings.fromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
  };
}

export function getPublicEmailSettings(): PublicEmailSettings {
  const settings: EmailSettings = resolveEmailSettings();
  return {
    provider: settings.provider,
    host: settings.host,
    port: settings.port,
    isSecure: settings.isSecure,
    user: settings.user,
    fromName: settings.fromName,
    fromEmail: settings.fromEmail,
    hasPassword: Boolean(settings.password),
    passwordHint: settings.password ? `••••${settings.password.slice(-4)}` : "",
    isConfigured: Boolean(settings.host && settings.user && settings.password && settings.fromEmail),
  };
}

export function saveEmailSettings(input: EmailSettings): PublicEmailSettings {
  writeFileSync(temporarySettingsPath, JSON.stringify(input, null, 2), { encoding: "utf8", mode: 0o600 });
  renameSync(temporarySettingsPath, settingsPath);
  chmodSync(settingsPath, 0o600);
  return getPublicEmailSettings();
}

function readStoredEmailSettings(): Partial<EmailSettings> {
  if (!existsSync(settingsPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(settingsPath, "utf8")) as Partial<EmailSettings>;
  } catch {
    throw new Error("The local email settings file is unreadable.");
  }
}

function inferProvider(host: string): EmailProvider {
  if (host.includes("gmail")) {
    return "gmail";
  }
  if (host.includes("office365") || host.includes("outlook")) {
    return "microsoft";
  }
  return "custom";
}
