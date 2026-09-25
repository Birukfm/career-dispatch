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
const requestHeaders: Readonly<Record<string, string>> = { "User-Agent": "CareerDispatch/1.0 (personal job search)" };
const defaultGreenhouseBoardTokens: readonly string[] = ["greenhouse"];
const defaultLeverSiteNames: readonly string[] = ["spotify"];
const defaultAshbyBoardNames: readonly string[] = ["Ashby"];
const defaultWorkableSubdomains: readonly string[] = ["epignosis"];

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

interface GreenhouseItem {
  id: number;
  absolute_url: string;
  title: string;
  company_name?: string;
  location?: { name?: string };
  content?: string;
  first_published?: string;
  updated_at?: string;
  departments?: Array<{ name?: string }>;
  offices?: Array<{ name?: string }>;
}

interface GreenhouseResponse {
  jobs: GreenhouseItem[];
}

interface LeverItem {
  id: string;
  text: string;
  hostedUrl: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: {
    location?: string;
    allLocations?: string[];
    team?: string;
    department?: string;
    commitment?: string;
  };
}

interface AshbyItem {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
}

interface AshbyResponse {
  jobs: AshbyItem[];
}

interface WorkableItem {
  title: string;
  shortcode: string;
  employment_type?: string;
  telecommuting?: boolean;
  department?: string;
  url: string;
  published_on?: string;
  created_at?: string;
  country?: string;
  city?: string;
  state?: string;
  experience?: string;
  function?: string;
  industry?: string;
  description?: string;
}

interface WorkableResponse {
  name: string;
  jobs: WorkableItem[];
}

export async function discoverJobs(resumeKeywords: string[] = []): Promise<Job[]> {
  const results: PromiseSettledResult<Job[]>[] = await Promise.allSettled([
    fetchRemoteOkJobs(resumeKeywords),
    fetchArbeitnowJobs(resumeKeywords),
    fetchRemotiveJobs(resumeKeywords),
    fetchJobicyJobs(resumeKeywords),
    fetchGreenhouseJobs(resumeKeywords),
    fetchLeverJobs(resumeKeywords),
    fetchAshbyJobs(resumeKeywords),
    fetchWorkableJobs(resumeKeywords),
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

async function fetchGreenhouseJobs(resumeKeywords: string[]): Promise<Job[]> {
  const boardTokens: string[] = getBoardIdentifiers("GREENHOUSE_BOARD_TOKENS", defaultGreenhouseBoardTokens);
  return fetchConfiguredBoards(boardTokens, (boardToken: string): Promise<Job[]> => fetchGreenhouseBoard(boardToken, resumeKeywords));
}

async function fetchGreenhouseBoard(boardToken: string, resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`, { headers: requestHeaders, next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Greenhouse board ${boardToken} returned ${response.status}`);
  }
  const payload: GreenhouseResponse = await response.json() as GreenhouseResponse;
  return payload.jobs.filter((item: GreenhouseItem): boolean => isRelevantRole(item.title, getGreenhouseTags(item), resumeKeywords)).map((item: GreenhouseItem): Job => createJob({
    source: "Greenhouse",
    sourceId: String(item.id),
    sourceUrl: item.absolute_url,
    title: item.title,
    company: item.company_name || formatBoardName(boardToken),
    location: item.location?.name || "Location not specified",
    description: stripHtml(item.content ?? ""),
    publishedAt: item.first_published || item.updated_at || new Date().toISOString(),
    tags: getGreenhouseTags(item),
    resumeKeywords,
  }));
}

async function fetchLeverJobs(resumeKeywords: string[]): Promise<Job[]> {
  const siteNames: string[] = getBoardIdentifiers("LEVER_SITE_NAMES", defaultLeverSiteNames);
  return fetchConfiguredBoards(siteNames, (siteName: string): Promise<Job[]> => fetchLeverBoard(siteName, resumeKeywords));
}

async function fetchLeverBoard(siteName: string, resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch(`https://api.lever.co/v0/postings/${encodeURIComponent(siteName)}?mode=json`, { headers: requestHeaders, next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Lever site ${siteName} returned ${response.status}`);
  }
  const items: LeverItem[] = await response.json() as LeverItem[];
  return items.filter((item: LeverItem): boolean => isRelevantRole(item.text, getLeverTags(item), resumeKeywords)).map((item: LeverItem): Job => createJob({
    source: "Lever",
    sourceId: item.id,
    sourceUrl: item.hostedUrl,
    title: item.text,
    company: formatBoardName(siteName),
    location: item.categories?.location || item.categories?.allLocations?.join(", ") || item.workplaceType || "Location not specified",
    description: [item.descriptionPlain, item.additionalPlain].filter(isNonEmptyString).join(" "),
    publishedAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    tags: getLeverTags(item),
    resumeKeywords,
  }));
}

async function fetchAshbyJobs(resumeKeywords: string[]): Promise<Job[]> {
  const boardNames: string[] = getBoardIdentifiers("ASHBY_JOB_BOARD_NAMES", defaultAshbyBoardNames);
  return fetchConfiguredBoards(boardNames, (boardName: string): Promise<Job[]> => fetchAshbyBoard(boardName, resumeKeywords));
}

async function fetchAshbyBoard(boardName: string, resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(boardName)}`, { headers: requestHeaders, next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Ashby board ${boardName} returned ${response.status}`);
  }
  const payload: AshbyResponse = await response.json() as AshbyResponse;
  return payload.jobs.filter((item: AshbyItem): boolean => item.isListed !== false && isRelevantRole(item.title, getAshbyTags(item), resumeKeywords)).map((item: AshbyItem): Job => createJob({
    source: "Ashby",
    sourceId: item.id,
    sourceUrl: item.jobUrl,
    title: item.title,
    company: formatBoardName(boardName),
    location: item.location || (item.isRemote ? "Remote" : "Location not specified"),
    description: item.descriptionPlain || stripHtml(item.descriptionHtml ?? ""),
    publishedAt: item.publishedAt || new Date().toISOString(),
    tags: getAshbyTags(item),
    resumeKeywords,
  }));
}

async function fetchWorkableJobs(resumeKeywords: string[]): Promise<Job[]> {
  const subdomains: string[] = getBoardIdentifiers("WORKABLE_ACCOUNT_SUBDOMAINS", defaultWorkableSubdomains);
  return fetchConfiguredBoards(subdomains, (subdomain: string): Promise<Job[]> => fetchWorkableBoard(subdomain, resumeKeywords));
}

async function fetchWorkableBoard(subdomain: string, resumeKeywords: string[]): Promise<Job[]> {
  const response: Response = await fetch(`https://www.workable.com/api/accounts/${encodeURIComponent(subdomain)}?details=true`, { headers: requestHeaders, next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Workable account ${subdomain} returned ${response.status}`);
  }
  const payload: WorkableResponse = await response.json() as WorkableResponse;
  return payload.jobs.filter((item: WorkableItem): boolean => isRelevantRole(item.title, getWorkableTags(item), resumeKeywords)).map((item: WorkableItem): Job => createJob({
    source: "Workable",
    sourceId: item.shortcode,
    sourceUrl: item.url,
    title: item.title,
    company: payload.name || formatBoardName(subdomain),
    location: [item.city, item.state, item.country].filter(isNonEmptyString).join(", ") || (item.telecommuting ? "Remote" : "Location not specified"),
    description: stripHtml(item.description ?? ""),
    publishedAt: item.published_on || item.created_at || new Date().toISOString(),
    tags: getWorkableTags(item),
    resumeKeywords,
  }));
}

async function fetchConfiguredBoards(boardIdentifiers: string[], fetchBoard: (boardIdentifier: string) => Promise<Job[]>): Promise<Job[]> {
  const results: PromiseSettledResult<Job[]>[] = await Promise.allSettled(boardIdentifiers.map(fetchBoard));
  return results.flatMap((result: PromiseSettledResult<Job[]>): Job[] => result.status === "fulfilled" ? result.value : []);
}

function getBoardIdentifiers(environmentVariable: string, defaults: readonly string[]): string[] {
  const configuredValue: string | undefined = process.env[environmentVariable];
  if (configuredValue === undefined) {
    return [...defaults];
  }
  return configuredValue.split(",").map((value: string): string => value.trim()).filter(Boolean).slice(0, 20);
}

function getGreenhouseTags(item: GreenhouseItem): string[] {
  return [...(item.departments ?? []).map((department: { name?: string }): string => department.name ?? ""), ...(item.offices ?? []).map((office: { name?: string }): string => office.name ?? "")].filter(isNonEmptyString);
}

function getLeverTags(item: LeverItem): string[] {
  return [item.categories?.team, item.categories?.department, item.categories?.commitment, item.workplaceType].filter(isNonEmptyString);
}

function getAshbyTags(item: AshbyItem): string[] {
  return [item.department, item.team, item.employmentType, item.workplaceType, item.isRemote ? "remote" : ""].filter(isNonEmptyString);
}

function getWorkableTags(item: WorkableItem): string[] {
  return [item.department, item.employment_type, item.experience, item.function, item.industry, item.telecommuting ? "remote" : ""].filter(isNonEmptyString);
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

function formatBoardName(value: string): string {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (character: string): string => character.toUpperCase());
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
  return decodeHtmlEntities(value)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"").replace(/&#39;|&apos;/gi, "'").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&");
}
