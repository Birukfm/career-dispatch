export const workCategories = [
  "communications",
  "virtual_assistance",
  "design",
  "customer_support",
  "prompt_engineering",
  "web_development",
  "application_development",
] as const;

export type WorkCategory = (typeof workCategories)[number];

export type JobStatus = "new" | "shortlisted" | "drafted" | "sent" | "replied" | "archived";

export interface Job {
  id: string;
  source: string;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  contactEmail: string | null;
  category: WorkCategory;
  status: JobStatus;
  score: number;
  publishedAt: string;
  createdAt: string;
}

export interface Outreach {
  id: number;
  jobId: string;
  recipientEmail: string;
  subject: string;
  sentAt: string;
  status: "sent" | "replied" | "failed";
  providerMessageId: string | null;
}

export interface CandidateProfile {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  portfolioUrl: string;
  linkedInUrl: string;
  summary: string;
  skills: string[];
  achievements: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export interface ExperienceItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  highlights: string[];
}

export interface EducationItem {
  institution: string;
  qualification: string;
  year: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  platform: string;
  completedAt: string;
}

export interface DashboardData {
  jobs: Job[];
  outreach: Outreach[];
  counts: {
    discovered: number;
    shortlisted: number;
    sentThisWeek: number;
    replied: number;
  };
  weeklyLimit: number;
  isSmtpConfigured: boolean;
}
