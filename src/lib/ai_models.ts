import type { AiProvider } from "@/lib/ai_settings";

export interface AiModelOption {
  value: string;
  label: string;
}

export const providerModelOptions: Readonly<Record<AiProvider, readonly AiModelOption[]>> = {
  openai: [
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-5-mini", label: "GPT-5 mini" },
    { value: "gpt-4.1", label: "GPT-4.1" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    { value: "claude-opus-4-1", label: "Claude Opus 4.1" },
  ],
  gemini: [
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
  ],
  openrouter: [
    { value: "openai/gpt-5", label: "OpenAI GPT-5" },
    { value: "anthropic/claude-sonnet-4.5", label: "Anthropic Claude Sonnet 4.5" },
    { value: "google/gemini-2.5-pro", label: "Google Gemini 2.5 Pro" },
  ],
  custom: [],
};
