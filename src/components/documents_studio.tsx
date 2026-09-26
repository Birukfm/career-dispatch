"use client";

import { BookMarked, Check, Copy, Download, Eraser, FileCheck, FileText, Mail, PencilLine, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type ChangeEvent, type ReactNode } from "react";
import type { DocumentKind, DocumentTemplate, DocumentTemplateLibrary } from "@/lib/document_templates";

interface DocumentsStudioProps {
  library: DocumentTemplateLibrary;
}

export function DocumentsStudio({ library }: DocumentsStudioProps): ReactNode {
  return (
    <>
      <TailoringPolicy />
      <TemplateMaker kind="resume" title="Resume template maker" description="Choose a structure, edit every line, and download a version that reflects your own experience." templates={library.resumes} />
      <TemplateMaker kind="cover_letter" title="Cover-letter template maker" description="Start with a truthful framework, then replace the bracketed fields with details from the specific role." templates={library.coverLetters} />
      <TemplateMaker kind="readme" title="README template maker" description="Start from a product, library, or portfolio README structure, then edit every section before you publish." templates={library.readmes} />
    </>
  );
}

function TailoringPolicy(): ReactNode {
  return (
    <section className="tailoring-policy">
      <div className="policy-heading">
        <div className="policy-icon"><Eraser size={22} /></div>
        <div><p className="eyebrow">Tailored document cleanup</p><h2>Your information, presented more clearly.</h2><p>Tailoring is an editable cleanup process. It improves organization, wording, emphasis, and ATS readability without adding, removing, or changing the facts you supplied.</p></div>
      </div>
      <div className="policy-principles">
        <article><FileCheck size={18} /><div><strong>Facts stay unchanged</strong><span>Employment, education, skills, dates, and achievements remain based on your information.</span></div></article>
        <article><PencilLine size={18} /><div><strong>Always open to edit</strong><span>Every generated resume, letter, and README is a starting point you can review and rewrite.</span></div></article>
        <article><ShieldCheck size={18} /><div><strong>No invented claims</strong><span>The cleanup process must not manufacture metrics, credentials, responsibilities, or experience.</span></div></article>
      </div>
    </section>
  );
}

interface TemplateMakerProps {
  kind: DocumentKind;
  title: string;
  description: string;
  templates: DocumentTemplate[];
}

function TemplateMaker({ kind, title, description, templates }: TemplateMakerProps): ReactNode {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id ?? "");
  const [content, setContent] = useState<string>(templates[0]?.content ?? "");
  const [copied, setCopied] = useState<boolean>(false);
  const selectedTemplate: DocumentTemplate = templates.find((template: DocumentTemplate): boolean => template.id === selectedTemplateId) ?? templates[0];
  const meta: TemplateKindMeta = createTemplateKindMeta(kind);
  function selectTemplate(template: DocumentTemplate): void {
    setSelectedTemplateId(template.id);
    setContent(template.content);
    setCopied(false);
  }
  async function copyDocument(): Promise<void> {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout((): void => setCopied(false), 1800);
  }
  function downloadDocument(): void {
    const blob: Blob = new Blob([content], { type: meta.mimeType });
    const url: string = URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.href = url;
    link.download = `${meta.filePrefix}_${selectedTemplate.id}.${meta.extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="template-maker" id={meta.sectionId}>
      <div className="template-section-heading">
        <div className={`template-type-icon ${kind}`}>{meta.icon}</div>
        <div><p className="eyebrow">{meta.eyebrow}</p><h2>{title}</h2><p>{description}</p></div>
      </div>
      <div className="template-options">
        {templates.map((template: DocumentTemplate): ReactNode => (
          <button className={template.id === selectedTemplateId ? "active" : ""} key={template.id} type="button" onClick={(): void => selectTemplate(template)}>
            <span className="template-check">{template.id === selectedTemplateId ? <Check size={13} /> : <Sparkles size={13} />}</span>
            <strong>{template.name}</strong>
            <small>{template.description}</small>
            <em>{template.bestFor}</em>
          </button>
        ))}
      </div>
      <div className="document-editor">
        <div className="editor-pane">
          <div className="pane-heading"><div><strong>Edit your copy</strong><span>Changes remain in this browser session.</span></div><div className="editor-actions"><button type="button" onClick={(): void => void copyDocument()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button><button type="button" onClick={downloadDocument}><Download size={14} />Download</button></div></div>
          <textarea value={content} onChange={(event: ChangeEvent<HTMLTextAreaElement>): void => setContent(event.target.value)} aria-label={`Edit ${selectedTemplate.name}`} spellCheck />
        </div>
        <div className="preview-pane">
          <div className="pane-heading"><div><strong>Clean preview</strong><span>{selectedTemplate.name}</span></div></div>
          <pre>{content}</pre>
        </div>
      </div>
    </section>
  );
}

interface TemplateKindMeta {
  eyebrow: string;
  sectionId: string;
  filePrefix: string;
  extension: string;
  mimeType: string;
  icon: ReactNode;
}

function createTemplateKindMeta(kind: DocumentKind): TemplateKindMeta {
  if (kind === "resume") {
    return {
      eyebrow: "Resume templates",
      sectionId: "resume-templates",
      filePrefix: "resume",
      extension: "txt",
      mimeType: "text/plain;charset=utf-8",
      icon: <FileText size={20} />,
    };
  }
  if (kind === "cover_letter") {
    return {
      eyebrow: "Cover-letter templates",
      sectionId: "cover-letter-templates",
      filePrefix: "cover_letter",
      extension: "txt",
      mimeType: "text/plain;charset=utf-8",
      icon: <Mail size={20} />,
    };
  }
  return {
    eyebrow: "README templates",
    sectionId: "readme-templates",
    filePrefix: "README",
    extension: "md",
    mimeType: "text/markdown;charset=utf-8",
    icon: <BookMarked size={20} />,
  };
}
