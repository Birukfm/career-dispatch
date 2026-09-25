import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getPublicEmailSettings } from "@/lib/email_settings";
import type { DashboardData, Job, JobStatus, Outreach } from "@/lib/types";

interface LocalStore {
  jobs: Job[];
  outreach: Outreach[];
}

export interface SendSafetyState {
  sentToday: number;
  sentThisWeek: number;
  lastSentAt: string | null;
}

const dataDirectory: string = path.join(process.cwd(), "data");
const storePath: string = path.join(dataDirectory, "career_dispatch.json");
const temporaryStorePath: string = path.join(dataDirectory, "career_dispatch.tmp.json");
mkdirSync(dataDirectory, { recursive: true });

export function saveJobs(jobs: Job[]): number {
  const store: LocalStore = readStore();
  const existingJobs: Map<string, Job> = new Map(store.jobs.map((job: Job): [string, Job] => [job.id, job]));
  for (const job of jobs) {
    const existingJob: Job | undefined = existingJobs.get(job.id);
    existingJobs.set(job.id, existingJob ? { ...job, status: existingJob.status, createdAt: existingJob.createdAt } : job);
  }
  writeStore({ ...store, jobs: Array.from(existingJobs.values()) });
  return jobs.length;
}

export function getJob(jobId: string): Job | null {
  return readStore().jobs.find((job: Job): boolean => job.id === jobId) ?? null;
}

export function updateJobStatus(jobId: string, status: JobStatus): void {
  const store: LocalStore = readStore();
  const jobs: Job[] = store.jobs.map((job: Job): Job => job.id === jobId ? { ...job, status } : job);
  writeStore({ ...store, jobs });
}

export function saveOutreach(input: Omit<Outreach, "id">): void {
  const store: LocalStore = readStore();
  const isDuplicate: boolean = store.outreach.some((item: Outreach): boolean => item.jobId === input.jobId && item.recipientEmail.toLowerCase() === input.recipientEmail.toLowerCase());
  if (isDuplicate) {
    throw new Error("An application has already been sent to this recipient for this role.");
  }
  const nextId: number = store.outreach.reduce((maximumId: number, item: Outreach): number => Math.max(maximumId, item.id), 0) + 1;
  writeStore({ ...store, outreach: [{ ...input, id: nextId }, ...store.outreach] });
}

export function getSendSafetyState(): SendSafetyState {
  const outreach: Outreach[] = readStore().outreach.filter((item: Outreach): boolean => item.status === "sent");
  const today: Date = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sentToday: number = outreach.filter((item: Outreach): boolean => new Date(item.sentAt) >= today).length;
  const sentThisWeek: number = outreach.filter((item: Outreach): boolean => new Date(item.sentAt) >= getStartOfWeek()).length;
  const lastSentAt: string | null = outreach.sort((first: Outreach, second: Outreach): number => second.sentAt.localeCompare(first.sentAt))[0]?.sentAt ?? null;
  return { sentToday, sentThisWeek, lastSentAt };
}

export function getDashboardData(): DashboardData {
  const store: LocalStore = readStore();
  const jobs: Job[] = [...store.jobs].sort((first: Job, second: Job): number => second.score - first.score || second.publishedAt.localeCompare(first.publishedAt)).slice(0, 200);
  const outreach: Outreach[] = [...store.outreach].sort((first: Outreach, second: Outreach): number => second.sentAt.localeCompare(first.sentAt)).slice(0, 100);
  const sentThisWeek: number = outreach.filter((item: Outreach): boolean => item.status === "sent" && new Date(item.sentAt) >= getStartOfWeek()).length;
  return {
    jobs,
    outreach,
    counts: {
      discovered: jobs.length,
      shortlisted: jobs.filter((job: Job): boolean => job.status === "shortlisted").length,
      sentThisWeek,
      replied: outreach.filter((item: Outreach): boolean => item.status === "replied").length,
    },
    weeklyLimit: Number(process.env.WEEKLY_SEND_LIMIT ?? "100"),
    isSmtpConfigured: getPublicEmailSettings().isConfigured,
  };
}

function readStore(): LocalStore {
  if (!existsSync(storePath)) {
    return { jobs: [], outreach: [] };
  }
  try {
    return JSON.parse(readFileSync(storePath, "utf8")) as LocalStore;
  } catch {
    throw new Error("The local data store is unreadable. Restore or remove data/career_dispatch.json.");
  }
}

function writeStore(store: LocalStore): void {
  writeFileSync(temporaryStorePath, JSON.stringify(store, null, 2), "utf8");
  renameSync(temporaryStorePath, storePath);
}

function getStartOfWeek(): Date {
  const date: Date = new Date();
  const day: number = date.getUTCDay();
  const difference: number = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + difference);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
