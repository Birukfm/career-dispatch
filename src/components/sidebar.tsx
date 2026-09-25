import { BriefcaseBusiness, FileText, Inbox, Settings } from "lucide-react";
import type { ReactNode } from "react";

type SidebarSection = "dispatch" | "documents" | "settings";

interface SidebarProps {
  activeSection: SidebarSection;
}

export function Sidebar({ activeSection }: SidebarProps): ReactNode {
  return (
    <aside className="sidebar">
      <div className="brand-mark"><span>CD</span></div>
      <div className="brand-copy"><strong>Career</strong><span>Dispatch</span></div>
      <nav aria-label="Main navigation">
        <a className={`nav-item ${activeSection === "dispatch" ? "active" : ""}`} href="/"><Inbox size={18} /> Dispatch</a>
        <a className="nav-item" href="/#opportunities"><BriefcaseBusiness size={18} /> Opportunities</a>
        <a className={`nav-item ${activeSection === "documents" ? "active" : ""}`} href="/documents"><FileText size={18} /> Documents</a>
        <a className={`nav-item ${activeSection === "settings" ? "active" : ""}`} href="/settings"><Settings size={18} /> Configuration</a>
      </nav>
      <div className="sidebar-footer">
        <div className="pulse-dot" />
        <div><strong>Local-first</strong><span>Your search stays on this device.</span></div>
      </div>
    </aside>
  );
}
