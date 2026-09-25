import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { emailProviders, getPublicEmailSettings, resolveEmailSettings, saveEmailSettings, type EmailProvider, type EmailSettings, type PublicEmailSettings } from "@/lib/email_settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  provider: z.enum(emailProviders),
  host: z.string().trim().max(200),
  port: z.number().int().min(1).max(65535),
  isSecure: z.boolean(),
  user: z.email(),
  password: z.string().max(500),
  fromName: z.string().trim().min(1).max(120),
  fromEmail: z.email(),
  shouldClearPassword: z.boolean().default(false),
});

export function GET(): NextResponse<PublicEmailSettings | { error: string }> {
  try {
    return NextResponse.json(getPublicEmailSettings());
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to load email settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<PublicEmailSettings | { error: string }>> {
  try {
    const parsed: ReturnType<typeof settingsSchema.safeParse> = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address, sender name, SMTP host, and port." }, { status: 400 });
    }
    const existingSettings: EmailSettings = resolveEmailSettings();
    const provider: EmailProvider = parsed.data.provider;
    const connection: Pick<EmailSettings, "host" | "port" | "isSecure"> = getConnectionSettings(provider, parsed.data);
    const password: string = parsed.data.shouldClearPassword ? "" : parsed.data.password || existingSettings.password;
    return NextResponse.json(saveEmailSettings({
      provider,
      ...connection,
      user: parsed.data.user,
      password,
      fromName: parsed.data.fromName,
      fromEmail: parsed.data.fromEmail,
    }));
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to save email settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function getConnectionSettings(provider: EmailProvider, input: z.infer<typeof settingsSchema>): Pick<EmailSettings, "host" | "port" | "isSecure"> {
  if (provider === "gmail") {
    return { host: "smtp.gmail.com", port: 587, isSecure: false };
  }
  if (provider === "microsoft") {
    return { host: "smtp.office365.com", port: 587, isSecure: false };
  }
  return { host: input.host, port: input.port, isSecure: input.isSecure };
}
