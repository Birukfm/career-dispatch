import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AiConfigurationPanel } from "@/components/ai_configuration_panel";
import { EmailConfigurationPanel } from "@/components/email_configuration_panel";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default function SettingsPage(): ReactNode {
  return (
    <main className="app-shell">
      <Sidebar activeSection="settings" />
      <section className="workspace settings-workspace">
        <header className="page-header settings-header">
          <div><p className="dateline">Workspace controls</p><h1>Configuration</h1><p>Manage private integrations and local service settings.</p></div>
          <a className="back-link" href="/">Return to dispatch</a>
        </header>
        <EmailConfigurationPanel />
        <AiConfigurationPanel />
        <div className="privacy-callout"><ShieldCheck size={18} /><div><strong>Private by design</strong><span>Credentials remain on this device and are excluded from version control.</span></div></div>
      </section>
    </main>
  );
}
