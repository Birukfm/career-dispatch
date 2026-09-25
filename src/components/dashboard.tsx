"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleAlert,
  Inbox,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import type { ResumeAnalysis } from "@/lib/resume_analyzer";
import type { ApplicationPackage } from "@/lib/templates";
import type { DashboardData, Job, JobStatus, WorkCategory } from "@/lib/types";

interface DashboardProps {
  initialData: DashboardData;
  dateline: string;
}

type PreviewTab = "email" | "resume" | "cover";
type CategoryFilter = "all" | WorkCategory;
type LocationFilter = "all" | "worldwide" | "africa_emea" | "restricted";
type ExperienceFilter = "all" | "internship" | "entry" | "experienced";
type EmploymentFilter = "all" | "full_time" | "part_time" | "contract";

interface JobFilters {
  category: CategoryFilter;
  location: LocationFilter;
  experience: ExperienceFilter;
  employment: EmploymentFilter;
}

const defaultFilters: JobFilters = {
  category: "all",
  location: "all",
  experience: "all",
  employment: "all",
};

const categoryLabels: Readonly<Record<WorkCategory, string>> = {
  communications: "Communications",
  virtual_assistance: "Virtual assistance",
  design: "Design",
  customer_support: "Customer support",
  prompt_engineering: "Prompt engineering",
  web_development: "Web development",
  application_development: "App development",
};

export function Dashboard({ initialData, dateline }: DashboardProps): ReactNode {
  const [data, setData] = useState<DashboardData>(initialData);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [application, setApplication] = useState<ApplicationPackage | null>(null);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("email");
  const [hasReviewed, setHasReviewed] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");
  const [filters, setFilters] = useState<JobFilters>(defaultFilters);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzingResume, setIsAnalyzingResume] = useState<boolean>(false);
  const filteredJobs: Job[] = useMemo((): Job[] => filterJobs(data.jobs, searchQuery, filters), [data.jobs, searchQuery, filters]);
  async function refreshDashboard(): Promise<void> {
    const response: Response = await fetch("/api/dashboard", { cache: "no-store" });
    const nextData: DashboardData = await response.json() as DashboardData;
    setData(nextData);
  }
  async function executeDiscovery(keywords: string[] = resumeAnalysis?.keywords ?? []): Promise<void> {
    setIsDiscovering(true);
    setNotice("");
    try {
      const response: Response = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const result: { discovered?: number; error?: string } = await response.json() as { discovered?: number; error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Discovery failed.");
      }
      await refreshDashboard();
      setNotice(`${result.discovered ?? 0} relevant roles found across approved job feeds.`);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Discovery failed.");
    } finally {
      setIsDiscovering(false);
    }
  }
  async function analyzeResumeFile(file: File): Promise<void> {
    setIsAnalyzingResume(true);
    setNotice("");
    try {
      const formData: FormData = new FormData();
      formData.append("resume", file);
      const response: Response = await fetch("/api/resume/analyze", { method: "POST", body: formData });
      const result: ResumeAnalysis | { error: string } = await response.json() as ResumeAnalysis | { error: string };
      if (!response.ok || "error" in result) {
        throw new Error("error" in result ? result.error : "Unable to analyze resume.");
      }
      setResumeAnalysis(result);
      await executeDiscovery(result.keywords);
      setNotice(`${result.keywords.length} skills detected from ${result.fileName}. Job discovery is now resume-focused.`);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Unable to analyze resume.");
    } finally {
      setIsAnalyzingResume(false);
    }
  }
  async function openApplication(job: Job): Promise<void> {
    setSelectedJob(job);
    setApplication(null);
    setHasReviewed(false);
    setPreviewTab("email");
    const response: Response = await fetch(`/api/applications/${job.id}`, { cache: "no-store" });
    const result: ApplicationPackage | { error: string } = await response.json() as ApplicationPackage | { error: string };
    if (!response.ok || "error" in result) {
      setNotice("error" in result ? result.error : "Could not create application.");
      setSelectedJob(null);
      return;
    }
    setApplication(result);
    await refreshDashboard();
  }
  async function updateStatus(job: Job, status: JobStatus): Promise<void> {
    const response: Response = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      await refreshDashboard();
    }
  }
  async function sendSelectedApplication(): Promise<void> {
    if (!selectedJob?.contactEmail || !hasReviewed) {
      return;
    }
    setIsSending(true);
    setNotice("");
    try {
      const response: Response = await fetch(`/api/applications/${selectedJob.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: selectedJob.contactEmail, hasReviewed }),
      });
      const result: { error?: string } = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send application.");
      }
      setSelectedJob(null);
      await refreshDashboard();
      setNotice(`Application sent to ${selectedJob.company}.`);
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Unable to send application.");
    } finally {
      setIsSending(false);
    }
  }
  return (
    <main className="app-shell">
      <Sidebar activeSection="dispatch" />
      <section className="workspace">
        <Header isSmtpConfigured={data.isSmtpConfigured} dateline={dateline} />
        <ProfileWarning />
        <section className="overview-grid">
          <StatCard label="Roles discovered" value={data.counts.discovered} detail="Current qualified pool" icon={<BriefcaseBusiness size={18} />} />
          <StatCard label="Shortlisted" value={data.counts.shortlisted} detail="Ready for review" icon={<Sparkles size={18} />} />
          <StatCard label="Sent this week" value={data.counts.sentThisWeek} detail={`of ${data.weeklyLimit} weekly limit`} icon={<Send size={18} />} />
          <StatCard label="Replies" value={data.counts.replied} detail="Mark replies manually" icon={<Inbox size={18} />} />
        </section>
        <DiscoveryControls
          filters={filters}
          analysis={resumeAnalysis}
          isAnalyzing={isAnalyzingResume}
          onFiltersChange={setFilters}
          onResumeSelected={analyzeResumeFile}
        />
        <section className="dispatch-card">
          <div className="dispatch-heading">
            <div>
              <p className="eyebrow">Opportunity queue</p>
              <h2>Today&apos;s dispatch desk</h2>
            </div>
            <button className="primary-button" type="button" onClick={(): void => void executeDiscovery()} disabled={isDiscovering}>
              <RefreshCw size={16} className={isDiscovering ? "spin" : ""} />
              {isDiscovering ? "Scanning feeds…" : "Discover roles"}
            </button>
          </div>
          <div className="table-toolbar">
            <label className="search-field">
              <Search size={16} />
              <input value={searchQuery} onChange={(event: ChangeEvent<HTMLInputElement>): void => setSearchQuery(event.target.value)} placeholder="Search company, title, or discipline" />
            </label>
            <div className="ethical-note"><Check size={14} /> Public feeds · local data · review required</div>
          </div>
          {notice ? <div className="notice" role="status">{notice}</div> : null}
          <JobTable jobs={filteredJobs} onOpen={openApplication} onStatusChange={updateStatus} />
        </section>
      </section>
      {selectedJob ? (
        <ApplicationDrawer
          job={selectedJob}
          application={application}
          activeTab={previewTab}
          hasReviewed={hasReviewed}
          isSending={isSending}
          onClose={(): void => setSelectedJob(null)}
          onTabChange={setPreviewTab}
          onReviewChange={setHasReviewed}
          onSend={sendSelectedApplication}
        />
      ) : null}
    </main>
  );
}

function Header({ isSmtpConfigured, dateline }: { isSmtpConfigured: boolean; dateline: string }): ReactNode {
  return (
    <header className="page-header">
      <div><p className="dateline">{dateline}</p><h1>Make your next move count.</h1></div>
      <div className={`configuration-status ${isSmtpConfigured ? "ready" : ""}`}><span />{isSmtpConfigured ? "Mailer ready" : "Mailer needs configuration"}</div>
    </header>
  );
}

function ProfileWarning(): ReactNode {
  return (
    <div className="profile-warning">
      <CircleAlert size={18} />
      <div><strong>Review before sending.</strong><span>Your resume profile and professional links are loaded. Verify every tailored document before sending.</span></div>
      <ChevronRight size={18} />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
}

function StatCard({ label, value, detail, icon }: StatCardProps): ReactNode {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <p>{label}</p>
      <strong>{String(value).padStart(2, "0")}</strong>
      <span>{detail}</span>
    </article>
  );
}

interface DiscoveryControlsProps {
  filters: JobFilters;
  analysis: ResumeAnalysis | null;
  isAnalyzing: boolean;
  onFiltersChange: (filters: JobFilters) => void;
  onResumeSelected: (file: File) => Promise<void>;
}

function DiscoveryControls(props: DiscoveryControlsProps): ReactNode {
  const { filters, analysis, isAnalyzing, onFiltersChange, onResumeSelected } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  function selectResume(files: FileList | null): void {
    const file: File | undefined = files?.[0];
    if (file) {
      void onResumeSelected(file);
    }
  }
  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    selectResume(event.dataTransfer.files);
  }
  return (
    <section className="discovery-controls">
      <div
        className={`resume-dropzone ${isDragging ? "dragging" : ""}`}
        onDragEnter={(event: DragEvent<HTMLDivElement>): void => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event: DragEvent<HTMLDivElement>): void => event.preventDefault()}
        onDragLeave={(): void => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event: ChangeEvent<HTMLInputElement>): void => selectResume(event.target.files)} hidden />
        <div className="dropzone-icon">{isAnalyzing ? <RefreshCw className="spin" size={20} /> : <UploadCloud size={20} />}</div>
        <div className="dropzone-copy">
          <strong>{isAnalyzing ? "Reading resume…" : analysis ? analysis.fileName : "Drop in a resume"}</strong>
          <span>{analysis ? `${analysis.keywords.length} matching skills detected` : "PDF, DOCX, or TXT · processed locally · 5 MB maximum"}</span>
        </div>
        <button type="button" onClick={(): void => inputRef.current?.click()} disabled={isAnalyzing}>{analysis ? "Replace" : "Choose file"}</button>
        {analysis ? <div className="skill-preview">{analysis.keywords.slice(0, 4).map((keyword: string): ReactNode => <span key={keyword}>{keyword}</span>)}</div> : null}
      </div>
      <div className="filter-panel">
        <div className="filter-heading"><SlidersHorizontal size={16} /><div><strong>Refine opportunities</strong><span>Filters update the queue instantly</span></div></div>
        <div className="filter-grid">
          <label><span>Discipline</span><select value={filters.category} onChange={(event: ChangeEvent<HTMLSelectElement>): void => onFiltersChange({ ...filters, category: event.target.value as CategoryFilter })}><option value="all">All disciplines</option>{Object.entries(categoryLabels).map(([value, label]: [string, string]): ReactNode => <option key={value} value={value}>{label}</option>)}</select></label>
          <label><span>Location</span><select value={filters.location} onChange={(event: ChangeEvent<HTMLSelectElement>): void => onFiltersChange({ ...filters, location: event.target.value as LocationFilter })}><option value="all">All locations</option><option value="worldwide">Worldwide remote</option><option value="africa_emea">Africa and EMEA</option><option value="restricted">Country-restricted</option></select></label>
          <label><span>Experience</span><select value={filters.experience} onChange={(event: ChangeEvent<HTMLSelectElement>): void => onFiltersChange({ ...filters, experience: event.target.value as ExperienceFilter })}><option value="all">All levels</option><option value="internship">Internships</option><option value="entry">Junior and graduate</option><option value="experienced">Experienced</option></select></label>
          <label><span>Employment</span><select value={filters.employment} onChange={(event: ChangeEvent<HTMLSelectElement>): void => onFiltersChange({ ...filters, employment: event.target.value as EmploymentFilter })}><option value="all">All types</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="contract">Contract</option></select></label>
        </div>
      </div>
    </section>
  );
}

interface JobTableProps {
  jobs: Job[];
  onOpen: (job: Job) => Promise<void>;
  onStatusChange: (job: Job, status: JobStatus) => Promise<void>;
}

function JobTable({ jobs, onOpen, onStatusChange }: JobTableProps): ReactNode {
  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-symbol"><Search size={24} /></div>
        <h3>Your opportunity desk is clear.</h3>
        <p>Run discovery to collect relevant roles from permitted public job feeds.</p>
      </div>
    );
  }
  return (
    <div className="job-table" id="opportunities">
      <div className="job-row table-head"><span>Opportunity</span><span>Discipline</span><span>Fit</span><span>Status</span><span /></div>
      {jobs.map((job: Job): ReactNode => (
        <div className="job-row" key={job.id}>
          <div className="job-primary"><strong>{job.title}</strong><span>{job.company} · {job.location}</span><small>{job.source}</small></div>
          <span className="category-pill">{categoryLabels[job.category]}</span>
          <div className="score"><span style={{ "--score": `${job.score}%` } as CSSProperties} /><strong>{job.score}</strong></div>
          <select value={job.status} onChange={(event: ChangeEvent<HTMLSelectElement>): void => void onStatusChange(job, event.target.value as JobStatus)} aria-label={`Status for ${job.title}`}>
            <option value="new">New</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="drafted">Drafted</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <div className="row-actions">
            <a href={job.sourceUrl} target="_blank" rel="noreferrer" aria-label="Open original listing"><ArrowUpRight size={16} /></a>
            <button type="button" onClick={(): void => void onOpen(job)}>Prepare <ChevronRight size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ApplicationDrawerProps {
  job: Job;
  application: ApplicationPackage | null;
  activeTab: PreviewTab;
  hasReviewed: boolean;
  isSending: boolean;
  onClose: () => void;
  onTabChange: (tab: PreviewTab) => void;
  onReviewChange: (value: boolean) => void;
  onSend: () => Promise<void>;
}

function ApplicationDrawer(props: ApplicationDrawerProps): ReactNode {
  const { job, application, activeTab, hasReviewed, isSending, onClose, onTabChange, onReviewChange, onSend } = props;
  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="application-drawer" role="dialog" aria-modal="true" aria-label={`Application for ${job.title}`}>
        <div className="drawer-header">
          <div><p className="eyebrow">Application package</p><h2>{job.title}</h2><span>{job.company}</span></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close application preview"><X size={20} /></button>
        </div>
        <div className="preview-tabs" role="tablist">
          <button className={activeTab === "email" ? "active" : ""} type="button" onClick={(): void => onTabChange("email")}>Email</button>
          <button className={activeTab === "resume" ? "active" : ""} type="button" onClick={(): void => onTabChange("resume")}>Resume</button>
          <button className={activeTab === "cover" ? "active" : ""} type="button" onClick={(): void => onTabChange("cover")}>Cover letter</button>
        </div>
        <div className="tailoring-note"><ShieldCheck size={14} /><span>Tailoring cleans structure and emphasis only—it does not add or change your information.</span><a href="/documents">Open editable templates</a></div>
        <div className="document-preview">
          {!application ? <div className="loading-document"><RefreshCw className="spin" size={22} /> Tailoring your documents…</div> : <PreviewContent application={application} activeTab={activeTab} />}
        </div>
        <div className="drawer-footer">
          {job.contactEmail ? <p className="recipient"><Mail size={15} /> To: {job.contactEmail}</p> : <p className="recipient warning"><CircleAlert size={15} /> No public recruiting email in this listing. Apply through the original post.</p>}
          <label className="review-check"><input type="checkbox" checked={hasReviewed} onChange={(event: ChangeEvent<HTMLInputElement>): void => onReviewChange(event.target.checked)} /><span>I reviewed the recipient and personalized documents.</span></label>
          <button className="send-button" type="button" disabled={!application || !job.contactEmail || !hasReviewed || isSending} onClick={(): void => void onSend()}>
            <Send size={16} /> {isSending ? "Sending…" : "Send this application"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function PreviewContent({ application, activeTab }: { application: ApplicationPackage; activeTab: PreviewTab }): ReactNode {
  if (activeTab === "resume") {
    return <pre>{application.resumeText}</pre>;
  }
  if (activeTab === "cover") {
    return <pre>{application.coverLetterText}</pre>;
  }
  return <div className="email-preview"><p className="subject-line"><span>Subject</span>{application.subject}</p><pre>{application.emailText}</pre></div>;
}

function filterJobs(jobs: Job[], query: string, filters: JobFilters): Job[] {
  const normalizedQuery: string = query.trim().toLowerCase();
  return jobs.filter((job: Job): boolean => {
    const searchableText: string = `${job.title} ${job.company} ${job.location} ${job.description} ${categoryLabels[job.category]}`.toLowerCase();
    const matchesSearch: boolean = !normalizedQuery || searchableText.includes(normalizedQuery);
    const matchesCategory: boolean = filters.category === "all" || job.category === filters.category;
    return matchesSearch && matchesCategory && matchesLocation(job, filters.location) && matchesExperience(job, filters.experience) && matchesEmployment(job, filters.employment);
  });
}

function matchesLocation(job: Job, filter: LocationFilter): boolean {
  const location: string = job.location.toLowerCase();
  const isWorldwide: boolean = ["anywhere", "global", "remote", "worldwide"].some((value: string): boolean => location === value || location.includes(value));
  const isAfricaOrEmea: boolean = ["africa", "emea", "ethiopia", "addis ababa"].some((value: string): boolean => location.includes(value));
  if (filter === "worldwide") {
    return isWorldwide;
  }
  if (filter === "africa_emea") {
    return isAfricaOrEmea;
  }
  if (filter === "restricted") {
    return !isWorldwide && !isAfricaOrEmea;
  }
  return true;
}

function matchesExperience(job: Job, filter: ExperienceFilter): boolean {
  const title: string = job.title.toLowerCase();
  const isInternship: boolean = /intern|internship|apprentice/.test(title);
  const isEntryLevel: boolean = /junior|graduate|entry.level|engineer i\b|developer i\b/.test(title);
  if (filter === "internship") {
    return isInternship;
  }
  if (filter === "entry") {
    return isEntryLevel;
  }
  if (filter === "experienced") {
    return !isInternship && !isEntryLevel;
  }
  return true;
}

function matchesEmployment(job: Job, filter: EmploymentFilter): boolean {
  const text: string = `${job.title} ${job.description}`.toLowerCase();
  if (filter === "full_time") {
    return /full.time|permanent/.test(text);
  }
  if (filter === "part_time") {
    return /part.time/.test(text);
  }
  if (filter === "contract") {
    return /contract|freelance|temporary/.test(text);
  }
  return true;
}
