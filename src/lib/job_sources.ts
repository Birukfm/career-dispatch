import { createHash } from "node:crypto";
import type { Job, WorkCategory } from "@/lib/types";

const categoryKeywords: Readonly<Record<WorkCategory, readonly string[]>> = {
  communications: ["digital communications", "communications coordinator", "communications intern", "web content", "web content intern", "digital media coordinator", "digital media intern"],
  virtual_assistance: ["technical operations assistant", "digital operations assistant", "ict assistant", "operations intern"],
  design: ["ui designer", "web designer", "product designer", "ui intern", "ux intern", "product design intern"],
  customer_support: ["technical support", "technical support intern", "it support", "it support intern", "ict support", "ict intern", "ict officer", "it technician", "help desk", "desktop support", "network support", "system support", "support engineer", "network administrator", "systems administrator"],
  prompt_engineering: ["prompt engineer", "generative ai", "generative ai intern", "ai intern", "ai operations", "ai trainer", "ai evaluator"],
  web_development: ["web developer", "web development intern", "frontend developer", "frontend intern", "front-end developer", "react developer", "next.js developer", "wordpress developer", "website administrator", "full stack developer", "full-stack intern"],
  application_development: ["application developer", "application development intern", "mobile developer", "mobile development intern", "flutter developer", "flutter intern", "dart developer", "software developer", "software developer intern", "software engineer", "software engineering intern", "graduate software engineer"],
};

const excludedTitleKeywords: readonly string[] = [
  "account executive",
  "backend",
  "biology",
  "business development",
  "director",
  "firefox",
  "gecko",
  "golang",
  "head of",
  "lead ",
  "linguist",
  "manager",
  "principal",
  "ruby",
  "sales",
  "security analytics",
  "senior",
  "solutions architect",
  "staff ",
  "vice president",
  "voice talent",
];

const emailPattern: RegExp = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

interface RemoteOkItem {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  date?: string;
  tags?: string[];
}

interface ArbeitnowItem {
  slug: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  url: string;
  created_at: number;
  tags: string[];
}

interface ArbeitnowResponse {
  data: ArbeitnowItem[];
}

interface RemotiveItem {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveItem[];
}

interface JobicyItem {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobDescription: string;
  pubDate: string;
}

interface JobicyResponse {
  jobs: JobicyItem[];
}

export async function discoverJobs(resumeKeywords: string[] = []): Promise<Job[]> {
  const results: PromiseSettledResult<Job[]>[] = await Promise.allSettled([
    fetchRemoteOkJobs(resumeKeywords),
    fetchArbeitnowJobs(resumeKeywords),
    fetchRemotiveJobs(resumeKeywords),
    fetchJobicyJobs(resumeKeywords),
  ]);
  return results.flatMap((result: PromiseSettledResult<Job[]>): Job[] => result.status === "fulfilled" ? result.value : []);
}

async function fetchRemoteOkJobs(resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch("https://remoteok.com/api", {
    headers: { "User-Agent": "CareerDispatch/1.0 (personal job search)" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Remote OK returned ${response.status}`);
  }
  const items: RemoteOkItem[] = await response.json() as RemoteOkItem[];
  return items.slice(1).filter((item: RemoteOkItem): boolean => isRelevantRemoteOkItem(item, resumeKeywords)).map((item: RemoteOkItem): Job => createJob({
    source: "Remote OK",
    sourceId: String(item.id),
    sourceUrl: item.url ?? "https://remoteok.com",
    title: item.position ?? "Untitled role",
    company: item.company ?? "Unknown company",
    location: item.location || "Remote",
    description: stripHtml(item.description ?? ""),
    publishedAt: item.date ?? new Date().toISOString(),
    tags: item.tags ?? [],
    resumeKeywords,
  }));
}

async function fetchArbeitnowJobs(resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    headers: { "User-Agent": "CareerDispatch/1.0 (personal job search)" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Arbeitnow returned ${response.status}`);
  }
  const payload: ArbeitnowResponse = await response.json() as ArbeitnowResponse;
  return payload.data.filter((item: ArbeitnowItem): boolean => isRelevantRole(item.title, item.tags, resumeKeywords)).map((item: ArbeitnowItem): Job => createJob({
    source: "Arbeitnow",
    sourceId: item.slug,
    sourceUrl: item.url,
    title: item.title,
    company: item.company_name,
    location: item.location || "Remote",
    description: stripHtml(item.description),
    publishedAt: new Date(item.created_at * 1000).toISOString(),
    tags: item.tags,
    resumeKeywords,
  }));
}

async function fetchRemotiveJobs(resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch("https://remotive.com/api/remote-jobs?limit=100", {
    headers: { "User-Agent": "CareerDispatch/1.0 (personal job search)" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Remotive returned ${response.status}`);
  }
  const payload: RemotiveResponse = await response.json() as RemotiveResponse;
  return payload.jobs.filter((item: RemotiveItem): boolean => isRelevantRole(item.title, item.tags, resumeKeywords)).map((item: RemotiveItem): Job => createJob({
    source: "Remotive",
    sourceId: String(item.id),
    sourceUrl: item.url,
    title: item.title,
    company: item.company_name,
    location: item.candidate_required_location || "Remote",
    description: stripHtml(item.description),
    publishedAt: item.publication_date,
    tags: [item.category, item.job_type, ...item.tags],
    resumeKeywords,
  }));
}

async function fetchJobicyJobs(resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch("https://jobicy.com/api/v2/remote-jobs?count=50", {
    headers: { "User-Agent": "CareerDispatch/1.0 (personal job search)" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`Jobicy returned ${response.status}`);
  }
  const payload: JobicyResponse = await response.json() as JobicyResponse;
  return payload.jobs.filter((item: JobicyItem): boolean => isRelevantRole(item.jobTitle, [...item.jobIndustry, ...item.jobType, item.jobLevel], resumeKeywords)).map((item: JobicyItem): Job => createJob({
    source: "Jobicy",
    sourceId: String(item.id),
    sourceUrl: item.url,
    title: item.jobTitle,
    company: item.companyName,
    location: item.jobGeo || "Remote",
    description: stripHtml(item.jobDescription),
    publishedAt: item.pubDate,
    tags: [...item.jobIndustry, ...item.jobType, item.jobLevel],
    resumeKeywords,
  }));
}

function isRelevantRemoteOkItem(item: RemoteOkItem, resumeKeywords: string[]): boolean {
  return Boolean(item.id && item.position && item.company) && isRelevantRole(item.position ?? "", item.tags ?? [], resumeKeywords);
}

function isRelevantRole(title: string, tags: string[], resumeKeywords: string[]): boolean {
  const normalizedTitle: string = title.toLowerCase();
  const searchableText: string = `${normalizedTitle} ${tags.join(" ").toLowerCase()}`;
  const isExcluded: boolean = excludedTitleKeywords.some((keyword: string): boolean => normalizedTitle.includes(keyword));
  const targetMatch: boolean = Object.values(categoryKeywords).flat().some((keyword: string): boolean => searchableText.includes(keyword));
  const resumeMatch: boolean = resumeKeywords.some((keyword: string): boolean => keyword.length >= 3 && searchableText.includes(keyword.toLowerCase()));
  return !isExcluded && (targetMatch || resumeMatch);
}

interface JobInput {
  source: string;
  sourceId: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  publishedAt: string;
  tags: string[];
  resumeKeywords: string[];
}

function createJob(input: JobInput): Job {
  const searchableText: string = `${input.title} ${input.description} ${input.tags.join(" ")}`;
  const category: WorkCategory = inferCategory(searchableText);
  const contactEmail: string | null = extractApplicationEmail(searchableText);
  return {
    id: createHash("sha256").update(`${input.source}:${input.sourceId}`).digest("hex").slice(0, 24),
    source: input.source,
    sourceUrl: input.sourceUrl,
    title: input.title,
    company: input.company,
    location: input.location,
    description: input.description.slice(0, 12000),
    contactEmail,
    category,
    status: "new",
    score: calculateScore(input.title, input.tags, searchableText, input.location, contactEmail, input.resumeKeywords),
    publishedAt: input.publishedAt,
    createdAt: new Date().toISOString(),
  };
}

function inferCategory(text: string): WorkCategory {
  const normalizedText: string = text.toLowerCase();
  const matches: Array<[WorkCategory, number]> = Object.entries(categoryKeywords).map(([category, keywords]: [string, readonly string[]]): [WorkCategory, number] => {
    const score: number = keywords.filter((keyword: string): boolean => normalizedText.includes(keyword)).length;
    return [category as WorkCategory, score];
  });
  matches.sort((first: [WorkCategory, number], second: [WorkCategory, number]): number => second[1] - first[1]);
  return matches[0]?.[0] ?? "communications";
}

function calculateScore(title: string, tags: string[], text: string, location: string, contactEmail: string | null, resumeKeywords: string[]): number {
  const normalizedText: string = `${text} ${location}`.toLowerCase();
  const titleAndTags: string = `${title} ${tags.join(" ")}`.toLowerCase();
  const expertiseMatches: number = Object.values(categoryKeywords).flat().filter((keyword: string): boolean => titleAndTags.includes(keyword)).length;
  const resumeMatches: number = resumeKeywords.filter((keyword: string): boolean => normalizedText.includes(keyword.toLowerCase())).length;
  let score: number = 35 + Math.min(expertiseMatches * 12, 30);
  score += Math.min(resumeMatches * 4, 20);
  score += ["intern", "internship", "junior", "graduate", "apprentice"].some((keyword: string): boolean => titleAndTags.includes(keyword)) ? 10 : 0;
  score += normalizedText.includes("remote") ? 20 : 0;
  score += normalizedText.includes("full-time") || normalizedText.includes("full time") ? 15 : 0;
  score += contactEmail ? 10 : 0;
  score += normalizedText.includes("worldwide") || normalizedText.includes("anywhere") ? 10 : 0;
  return Math.min(score, 100);
}

function extractApplicationEmail(text: string): string | null {
  const match: RegExpExecArray | null = emailPattern.exec(text);
  if (!match || match.index === undefined) {
    return null;
  }
  const nearbyText: string = text.slice(Math.max(0, match.index - 140), match.index).toLowerCase();
  const applicationSignals: string[] = ["apply", "application", "send your resume", "send your cv", "email your"];
  return applicationSignals.some((signal: string): boolean => nearbyText.includes(signal)) ? match[0] : null;
}

function stripHtml(value: string): string {
  return value
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}
