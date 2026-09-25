"use client";

import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { providerModelOptions, type AiModelOption } from "@/lib/ai_models";
import type { AiProvider, PublicAiSettings } from "@/lib/ai_settings";

const defaultAiSettings: PublicAiSettings = {
  provider: "openai",
  model: "gpt-5",
  baseUrl: "",
  hasApiKey: false,
  keyHint: "",
};

export function AiConfigurationPanel(): ReactNode {
  const [settings, setSettings] = useState<PublicAiSettings>(defaultAiSettings);
  const [apiKey, setApiKey] = useState<string>("");
  const [isKeyVisible, setIsKeyVisible] = useState<boolean>(false);
  const [isCustomModel, setIsCustomModel] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const modelOptions: readonly AiModelOption[] = providerModelOptions[settings.provider];
  useEffect((): (() => void) => {
    const controller: AbortController = new AbortController();
    async function loadSettings(): Promise<void> {
      try {
        const response: Response = await fetch("/api/settings/ai", { signal: controller.signal, cache: "no-store" });
        const result: PublicAiSettings | { error: string } = await response.json() as PublicAiSettings | { error: string };
        if (response.ok && !("error" in result)) {
          const model: string = result.model || providerModelOptions[result.provider][0]?.value || "";
          setSettings({ ...result, model });
          setIsCustomModel(isCustomModelIdentifier(result.provider, model));
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? error.message : "Unable to load AI settings.");
        }
      }
    }
    void loadSettings();
    return (): void => controller.abort();
  }, []);
  async function saveSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await updateSettings(false);
  }
  async function clearApiKey(): Promise<void> {
    await updateSettings(true);
  }
  async function updateSettings(shouldClearApiKey: boolean): Promise<void> {
    setIsSaving(true);
    setStatus("");
    try {
      const response: Response = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: settings.provider, model: settings.model, baseUrl: settings.provider === "custom" ? settings.baseUrl : "", apiKey, shouldClearApiKey }),
      });
      const result: PublicAiSettings | { error: string } = await response.json() as PublicAiSettings | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Unable to save AI settings.");
      }
      setSettings(result);
      setIsCustomModel(isCustomModelIdentifier(result.provider, result.model));
      setApiKey("");
      setStatus(shouldClearApiKey ? "API key removed." : "AI configuration saved locally.");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Unable to save AI settings.");
    } finally {
      setIsSaving(false);
    }
  }
  function selectProvider(provider: AiProvider): void {
    const options: readonly AiModelOption[] = providerModelOptions[provider];
    setIsCustomModel(provider === "custom");
    setSettings({ ...settings, provider, model: options[0]?.value ?? "", baseUrl: provider === "custom" ? settings.baseUrl : "" });
  }
  function selectModel(value: string): void {
    const shouldUseCustomModel: boolean = value === "__custom__";
    setIsCustomModel(shouldUseCustomModel);
    setSettings({ ...settings, model: shouldUseCustomModel ? "" : value });
  }
  return (
    <section className="ai-configuration" id="ai-configuration">
      <div className="configuration-intro">
        <div className="configuration-icon"><KeyRound size={20} /></div>
        <div><p className="eyebrow">Bring your own intelligence</p><h2>AI configuration</h2><p>Connect your preferred AI provider for future document refinement and job-fit analysis.</p></div>
        <div className={`key-status ${settings.hasApiKey ? "configured" : ""}`}><ShieldCheck size={14} />{settings.hasApiKey ? `Key configured ${settings.keyHint}` : "No key configured"}</div>
      </div>
      <form className="ai-settings-form" onSubmit={saveSettings}>
        <label><span>Provider</span><select value={settings.provider} onChange={(event: ChangeEvent<HTMLSelectElement>): void => selectProvider(event.target.value as AiProvider)}><option value="openai">OpenAI</option><option value="anthropic">Anthropic</option><option value="gemini">Google Gemini</option><option value="openrouter">OpenRouter</option><option value="custom">Custom compatible API</option></select></label>
        {settings.provider !== "custom" ? <label><span>Model</span><select value={isCustomModel ? "__custom__" : settings.model} onChange={(event: ChangeEvent<HTMLSelectElement>): void => selectModel(event.target.value)}>{modelOptions.map((option: AiModelOption): ReactNode => <option key={option.value} value={option.value}>{option.label}</option>)}<option value="__custom__">Custom model identifier…</option></select></label> : null}
        {isCustomModel ? <label><span>Model identifier</span><input value={settings.model} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, model: event.target.value })} placeholder="Enter the exact model identifier" /></label> : null}
        {settings.provider === "custom" ? <label><span>API endpoint</span><input value={settings.baseUrl} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSettings({ ...settings, baseUrl: event.target.value })} placeholder="https://api.example.com/v1" type="url" required /></label> : null}
        <label className="api-key-field"><span>API key</span><div><input value={apiKey} onChange={(event: ChangeEvent<HTMLInputElement>): void => setApiKey(event.target.value)} placeholder={settings.hasApiKey ? `Stored securely ${settings.keyHint}` : "Paste a provider API key"} type={isKeyVisible ? "text" : "password"} autoComplete="new-password" /><button type="button" onClick={(): void => setIsKeyVisible(!isKeyVisible)} aria-label={isKeyVisible ? "Hide API key" : "Show API key"}>{isKeyVisible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        <div className="settings-actions">
          <div><ShieldCheck size={14} /><span>Stored only on this device. The key is never returned to the browser.</span></div>
          {status ? <p role="status">{status}</p> : null}
          {settings.hasApiKey ? <button className="clear-key-button" type="button" onClick={(): void => void clearApiKey()} disabled={isSaving}>Remove key</button> : null}
          <button className="primary-button" type="submit" disabled={isSaving || (!apiKey && !settings.hasApiKey)}>{isSaving ? "Saving…" : "Save configuration"}</button>
        </div>
      </form>
    </section>
  );
}

function isCustomModelIdentifier(provider: AiProvider, model: string): boolean {
  return provider === "custom" || Boolean(model) && !providerModelOptions[provider].some((option: AiModelOption): boolean => option.value === model);
}
