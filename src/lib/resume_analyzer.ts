import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { WorkCategory } from "@/lib/types";

const skillKeywords: readonly string[] = [
  "administrative",
  "ai evaluator",
  "ai trainer",
  "communications",
  "customer support",
  "dart",
  "digital media",
  "figma",
  "firebase",
  "flutter",
  "generative ai",
  "google workspace",
  "html",
  "ict support",
  "it support",
  "javascript",
  "kotlin",
  "mapbox",
  "network administration",
  "next.js",
  "node.js",
  "php",
  "postgresql",
  "prompt engineering",
  "python",
  "react",
  "software developer",
  "sql",
  "swift",
  "technical support",
  "typescript",
  "ui design",
  "ux design",
  "virtual assistant",
  "web developer",
  "wordpress",
] as const;

const categorySignals: Readonly<Record<WorkCategory, readonly string[]>> = {
  communications: ["communications", "digital media", "content", "social media"],
  virtual_assistance: ["administrative", "google workspace", "virtual assistant", "operations"],
  design: ["figma", "ui design", "ux design", "graphic design"],
  customer_support: ["customer support", "ict support", "it support", "technical support", "network administration"],
  prompt_engineering: ["ai evaluator", "ai trainer", "generative ai", "prompt engineering"],
  web_development: ["html", "javascript", "next.js", "node.js", "php", "react", "typescript", "web developer", "wordpress"],
  application_development: ["dart", "firebase", "flutter", "kotlin", "mapbox", "software developer", "swift"],
};

export interface ResumeAnalysis {
  fileName: string;
  keywords: string[];
  categories: WorkCategory[];
  characterCount: number;
}

export async function analyzeResume(file: File): Promise<ResumeAnalysis> {
  const text: string = await extractResumeText(file);
  const normalizedText: string = text.toLowerCase().replace(/\s+/g, " ");
  const keywords: string[] = skillKeywords.filter((keyword: string): boolean => normalizedText.includes(keyword));
  const categories: WorkCategory[] = Object.entries(categorySignals).filter(([_category, signals]: [string, readonly string[]]): boolean => signals.some((signal: string): boolean => normalizedText.includes(signal))).map(([category]: [string, readonly string[]]): WorkCategory => category as WorkCategory);
  if (keywords.length === 0) {
    throw new Error("No supported skills were detected. Use a text-based PDF, DOCX, or TXT resume.");
  }
  return { fileName: file.name, keywords, categories, characterCount: text.length };
}

async function extractResumeText(file: File): Promise<string> {
  const bytes: ArrayBuffer = await file.arrayBuffer();
  const buffer: Buffer = Buffer.from(bytes);
  const extension: string = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  if (file.type === "application/pdf" || extension === "pdf") {
    return extractPdfText(buffer);
  }
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx") {
    const result: Awaited<ReturnType<typeof mammoth.extractRawText>> = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (file.type.startsWith("text/") || extension === "txt") {
    return buffer.toString("utf8");
  }
  throw new Error("Unsupported file type. Upload a PDF, DOCX, or TXT resume.");
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser: PDFParse = new PDFParse({ data: buffer });
  try {
    const result: Awaited<ReturnType<PDFParse["getText"]>> = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
