import type { ReactNode } from "react";
import { DocumentsStudio } from "@/components/documents_studio";
import { Sidebar } from "@/components/sidebar";
import { createDocumentTemplateLibrary, type DocumentTemplateLibrary } from "@/lib/document_templates";
import { candidateProfile } from "@/lib/profile";

export default function DocumentsPage(): ReactNode {
  const library: DocumentTemplateLibrary = createDocumentTemplateLibrary(candidateProfile);
  return (
    <main className="app-shell">
      <Sidebar activeSection="documents" />
      <section className="workspace documents-workspace">
        <header className="page-header documents-header">
          <div><p className="dateline">Document studio</p><h1>Make every word yours.</h1><p>Clean, truthful templates designed to be edited before they are sent.</p></div>
          <a className="back-link" href="/">Return to dispatch</a>
        </header>
        <DocumentsStudio library={library} />
      </section>
    </main>
  );
}
