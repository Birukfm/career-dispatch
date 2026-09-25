"use client";

import { ExternalLink, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import type { EmailProvider, PublicEmailSettings } from "@/lib/email_settings";

const defaultEmailSettings: PublicEmailSettings = {
  provider: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  isSecure: false,
  user: "",
  fromName: "",
  fromEmail: "",
  hasPassword: false,
  passwordHint: "",
  isConfigured: false,
};

interface ProviderGuidance {
  passwordLabel: string;
  description: string;
  steps: string[];
  helpUrl: string;
  helpLabel: string;
  adminUrl: string;
  adminLabel: string;
}

const providerGuidance: Readonly<Record<EmailProvider, ProviderGuidance>> = {
  gmail: {
    passwordLabel: "Google app password",
    description: "Gmail requires a dedicated app password rather than your normal account password.",
    steps: ["Enable 2-Step Verification on your Google account.", "Open Google App Passwords and create one named Career Dispatch.", "Paste the generated 16-character password below without sharing it."],
    helpUrl: "https://myaccount.google.com/apppasswords",
    helpLabel: "Open Google App Passwords",
    adminUrl: "",
    adminLabel: "",
  },
  microsoft: {
    passwordLabel: "Microsoft app password or SMTP credential",
    description: "Microsoft setup depends on whether this is a personal Outlook account or a Microsoft 365 work or school mailbox.",
    steps: ["Personal Outlook or Hotmail: open Advanced security options, enable two-step verification, then choose Create a new app password.", "Microsoft 365 work or school: ask an administrator to open Users → Active users → your account → Mail → Manage email apps and enable Authenticated SMTP.", "Paste the generated app password or administrator-approved SMTP credential below. Do not use your normal account password.", "If App passwords or Authenticated SMTP are unavailable, this mailbox requires OAuth and cannot use the current password-based mailer."],
    helpUrl: "https://account.microsoft.com/security",
    helpLabel: "Open Microsoft Security",
    adminUrl: "https://admin.microsoft.com",
    adminLabel: "Open Microsoft 365 Admin Center",
  },
  custom: {
    passwordLabel: "SMTP password",
    description: "Use the SMTP credentials supplied by your email host or organization.",
    steps: ["Find the outgoing SMTP host and port in your provider documentation.", "Confirm whether the connection uses implicit TLS.", "Enter the mailbox username and provider-issued password below."],
    helpUrl: "",
    helpLabel: "",
    adminUrl: "",
    adminLabel: "",
  },
};

export function EmailConfigurationPanel(): ReactNode {
  const [settings, setSettings] = useState<PublicEmailSettings>(defaultEmailSettings);
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const guidance: ProviderGuidance = providerGuidance[settings.provider];
  useEffect((): (() => void) => {
    const controller: AbortController = new AbortController();
    async function loadSettings(): Promise<void> {
      try {
        const response: Response = await fetch("/api/settings/email", { signal: controller.signal, cache: "no-store" });
        const result: PublicEmailSettings | { error: string } = await response.json() as PublicEmailSettings | { error: string };
        if (response.ok && !("error" in result)) {
          setSettings(result);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? error.message : "Unable to load email settings.");
        }
      }
    }
    void loadSettings();
    return (): void => controller.abort();
  }, []);
  async function saveSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSaving(true);
    setStatus("");
    try {
      const response: Response = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, password, shouldClearPassword: false }),
      });
      const result: PublicEmailSettings | { error: string } = await response.json() as PublicEmailSettings | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Unable to save email settings.");
      }
      setSettings(result);
      setPassword("");
      setStatus("Email configuration saved locally.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Unable to save email settings.");
    } finally {
      setIsSaving(false);
    }
  }
  function selectProvider(provider: EmailProvider): void {
    const connection: Pick<PublicEmailSettings, "host" | "port" | "isSecure"> = getProviderConnection(provider, settings);
    setSettings({ ...settings, provider, ...connection });
  }
  function updateUser(user: string): void {
    const fromEmail: string = !settings.fromEmail || settings.fromEmail === settings.user ? user : settings.fromEmail;
    setSettings({ ...settings, user, fromEmail });
  }
  return (
    <section className="email-configuration">
      <div className="configuration-intro">
        <div className="configuration-icon email"><Mail size={20} /></div>
        <div><p className="eyebrow">Delivery account</p><h2>Email delivery</h2><p>Add the mailbox used to send reviewed applications. Standard provider connection details are filled automatically.</p></div>
        <div className={`key-status ${settings.isConfigured ? "configured" : ""}`}><ShieldCheck size={14} />{settings.isConfigured ? "Mailer ready" : "Setup required"}</div>
      </div>
      <div className="email-setup-body">
        <form className="email-settings-form" onSubmit={saveSettings}>
          <label><span>Provider</span><select value={settings.provider} onChange={(event: ChangeEvent<HTMLSelectElement>): void => selectProvider(event.target.value as EmailProvider)}><option value="gmail">Gmail</option><option value="microsoft">Microsoft 365 / Outlook</option><option value="custom">Custom SMTP</option></select></label>
          <label><span>Email address</span><input value={settings.user} onChange={(event: ChangeEvent<HTMLInputElement>): void => updateUser(event.target.value)} placeholder="you@example.com" type="email" required /></label>
          <label><span>Sender name</span><input value={settings.fromName} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, fromName: event.target.value })} placeholder="Your professional name" required /></label>
          <label><span>From email</span><input value={settings.fromEmail} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, fromEmail: event.target.value })} placeholder="Usually the same email address" type="email" required /></label>
          <label className="email-password-field"><span>{guidance.passwordLabel}</span><div><input value={password} onChange={(event: ChangeEvent<HTMLInputElement>): void => setPassword(event.target.value)} placeholder={settings.hasPassword ? `Stored securely ${settings.passwordHint}` : "Paste the provider-issued password"} type={isPasswordVisible ? "text" : "password"} autoComplete="new-password" /><button type="button" onClick={(): void => setIsPasswordVisible(!isPasswordVisible)} aria-label={isPasswordVisible ? "Hide email password" : "Show email password"}>{isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {settings.provider === "custom" ? <><label><span>SMTP host</span><input value={settings.host} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, host: event.target.value })} placeholder="smtp.example.com" required /></label><label><span>SMTP port</span><input value={settings.port} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, port: Number(event.target.value) })} min="1" max="65535" type="number" required /></label><label className="secure-checkbox"><input checked={settings.isSecure} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, isSecure: event.target.checked })} type="checkbox" /><span>Use implicit TLS</span></label></> : null}
          <div className="email-save-row"><div><ShieldCheck size={14} /><span>Password values remain on this device and are never shown again.</span></div>{status ? <p role="status">{status}</p> : null}<button className="primary-button" type="submit" disabled={isSaving || (!password && !settings.hasPassword)}>{isSaving ? "Saving…" : "Save email settings"}</button></div>
        </form>
        <aside className="email-guidance">
          <p className="eyebrow">How to get the required data</p>
          <h3>{settings.provider === "gmail" ? "Connect Gmail safely" : settings.provider === "microsoft" ? "Connect Microsoft safely" : "Connect your SMTP provider"}</h3>
          <p>{guidance.description}</p>
          <ol>{guidance.steps.map((step: string): ReactNode => <li key={step}>{step}</li>)}</ol>
          <div className="guidance-links">{guidance.helpUrl ? <a href={guidance.helpUrl} target="_blank" rel="noreferrer">{guidance.helpLabel}<ExternalLink size={13} /></a> : null}{guidance.adminUrl ? <a href={guidance.adminUrl} target="_blank" rel="noreferrer">{guidance.adminLabel}<ExternalLink size={13} /></a> : null}</div>
          <div className="required-data"><strong>Required information</strong><span>Email address · Sender name · Provider-issued app password{settings.provider === "custom" ? " · SMTP host and port" : ""}</span></div>
        </aside>
      </div>
    </section>
  );
}

function getProviderConnection(provider: EmailProvider, settings: PublicEmailSettings): Pick<PublicEmailSettings, "host" | "port" | "isSecure"> {
  if (provider === "gmail") {
    return { host: "smtp.gmail.com", port: 587, isSecure: false };
  }
  if (provider === "microsoft") {
    return { host: "smtp.office365.com", port: 587, isSecure: false };
  }
  return { host: settings.provider === "custom" ? settings.host : "", port: settings.provider === "custom" ? settings.port : 587, isSecure: false };
}
