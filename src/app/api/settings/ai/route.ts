import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { aiProviders, getPublicAiSettings, readAiSettings, saveAiSettings, type AiSettings, type PublicAiSettings } from "@/lib/ai_settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  provider: z.enum(aiProviders),
  model: z.string().trim().max(120),
  baseUrl: z.union([z.url(), z.literal("")]),
  apiKey: z.string().trim().max(500),
  shouldClearApiKey: z.boolean().default(false),
});

export function GET(): NextResponse<PublicAiSettings | { error: string }> {
  try {
    return NextResponse.json(getPublicAiSettings());
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to load AI settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<PublicAiSettings | { error: string }>> {
  try {
    const parsed: ReturnType<typeof settingsSchema.safeParse> = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Check the provider, model, endpoint, and API key fields." }, { status: 400 });
    }
    const existingSettings: AiSettings = readAiSettings();
    const apiKey: string = parsed.data.shouldClearApiKey ? "" : parsed.data.apiKey || existingSettings.apiKey;
    return NextResponse.json(saveAiSettings({
      provider: parsed.data.provider,
      model: parsed.data.model,
      baseUrl: parsed.data.baseUrl,
      apiKey,
    }));
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to save AI settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
