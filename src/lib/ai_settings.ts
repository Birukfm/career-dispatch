import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export const aiProviders = ["openai", "anthropic", "gemini", "openrouter", "custom"] as const;

export type AiProvider = (typeof aiProviders)[number];

export interface AiSettings {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export interface PublicAiSettings {
  provider: AiProvider;
  model: string;
  baseUrl: string;
  hasApiKey: boolean;
  keyHint: string;
}

const dataDirectory: string = path.join(process.cwd(), "data");
const settingsPath: string = path.join(dataDirectory, "ai_settings.json");
const temporarySettingsPath: string = path.join(dataDirectory, "ai_settings.tmp.json");
mkdirSync(dataDirectory, { recursive: true });

export function getPublicAiSettings(): PublicAiSettings {
  const settings: AiSettings = readAiSettings();
  return {
    provider: settings.provider,
    model: settings.model,
    baseUrl: settings.baseUrl,
    hasApiKey: Boolean(settings.apiKey),
    keyHint: settings.apiKey ? `••••${settings.apiKey.slice(-4)}` : "",
  };
}

export function saveAiSettings(input: AiSettings): PublicAiSettings {
  writeFileSync(temporarySettingsPath, JSON.stringify(input, null, 2), { encoding: "utf8", mode: 0o600 });
  renameSync(temporarySettingsPath, settingsPath);
  chmodSync(settingsPath, 0o600);
  return getPublicAiSettings();
}

export function readAiSettings(): AiSettings {
  const defaults: AiSettings = { provider: "openai", model: "gpt-5", baseUrl: "", apiKey: "" };
  if (!existsSync(settingsPath)) {
    return defaults;
  }
  try {
    return { ...defaults, ...JSON.parse(readFileSync(settingsPath, "utf8")) as Partial<AiSettings> };
  } catch {
    throw new Error("The local AI settings file is unreadable.");
  }
}
