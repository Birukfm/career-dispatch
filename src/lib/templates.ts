import { candidateProfile } from "@/lib/profile";
import type { CandidateProfile, Job, WorkCategory } from "@/lib/types";

interface RolePositioning {
  headline: string;
  opening: string;
  strengths: string[];
}

const rolePositioning: Readonly<Record<WorkCategory, RolePositioning>> = {
  communications: {
    headline: "Communications and Content Specialist",
    opening: "clear communication that helps teams earn trust and move work forward",
    strengths: ["Media and communications", "Technical documentation and user guidance", "WordPress website administration"],
  },
  virtual_assistance: {
    headline: "Virtual Assistant and Operations Specialist",
    opening: "dependable remote support that keeps priorities, people, and details organized",
    strengths: ["Google Workspace administration", "ICT asset and software license management", "Technical documentation and user guidance"],
  },
  design: {
    headline: "Digital and UI Designer",
    opening: "clean, accessible design that turns business goals into useful experiences",
    strengths: ["HTML, CSS, and JavaScript", "WordPress website administration", "Cross-platform application development"],
  },
  customer_support: {
    headline: "Customer Support and Success Specialist",
    opening: "empathetic, accurate support that resolves issues and strengthens customer relationships",
    strengths: ["Hardware and software troubleshooting", "Technical documentation and user guidance", "Google Workspace administration"],
  },
  prompt_engineering: {
    headline: "Prompt Engineer and AI Workflow Specialist",
    opening: "generative AI knowledge, structured technical thinking, and clear documentation for reliable digital workflows",
    strengths: ["Generative AI leadership and strategy", "Google AI tools and workflows", "Technical documentation and user guidance"],
  },
  web_development: {
    headline: "Web Application Developer",
    opening: "responsive, maintainable web products built around real user needs",
    strengths: ["React and Next.js", "HTML, CSS, and JavaScript", "PHP and Node.js"],
  },
  application_development: {
    headline: "Application Developer",
    opening: "reliable, thoughtful applications that balance user experience and maintainable engineering",
    strengths: ["Flutter and Dart", "Firebase backend integration", "Mapbox SDK integration"],
  },
};

export interface ApplicationPackage {
  subject: string;
  emailText: string;
  emailHtml: string;
  resumeText: string;
  resumeHtml: string;
  coverLetterText: string;
}

export function createApplicationPackage(job: Job, profile: CandidateProfile = candidateProfile): ApplicationPackage {
  const positioning: RolePositioning = rolePositioning[job.category];
  const subject: string = `Application — ${job.title} — ${profile.fullName}`;
  const coverLetterText: string = createCoverLetter(job, profile, positioning);
  const resumeText: string = createResumeText(profile, positioning);
  const resumeHtml: string = createResumeHtml(profile, positioning);
  const textSignature: string = [profile.fullName, profile.email, profile.phone, profile.portfolioUrl].filter(Boolean).join("\n");
  const htmlSignature: string = [profile.fullName, profile.email, profile.phone, profile.portfolioUrl].filter(Boolean).map(escapeHtml).join("<br>");
  const emailText: string = `Hello ${job.company} hiring team,\n\nI am applying for the ${job.title} role. My background combines ${positioning.opening}. I have attached a tailored resume and cover letter for your review.\n\nI would welcome a conversation about how I can contribute to ${job.company}. If another person handles this role, I would appreciate being pointed in the right direction.\n\nBest,\n${textSignature}\n\nYou are receiving this one-to-one application because this role was publicly advertised.`;
  const emailHtml: string = `<div style="font-family:Georgia,serif;color:#171713;line-height:1.6;max-width:620px"><p>Hello ${escapeHtml(job.company)} hiring team,</p><p>I am applying for the <strong>${escapeHtml(job.title)}</strong> role. My background combines ${escapeHtml(positioning.opening)}. I have attached a tailored resume and cover letter for your review.</p><p>I would welcome a conversation about how I can contribute to ${escapeHtml(job.company)}. If another person handles this role, I would appreciate being pointed in the right direction.</p><p>Best,<br>${htmlSignature}</p><p style="font-size:12px;color:#6f6d65">You are receiving this one-to-one application because this role was publicly advertised.</p></div>`;
  return { subject, emailText, emailHtml, resumeText, resumeHtml, coverLetterText };
}

function createCoverLetter(job: Job, profile: CandidateProfile, positioning: RolePositioning): string {
  const signature: string = [profile.fullName, profile.email, profile.phone, profile.portfolioUrl].filter(Boolean).join("\n");
  return `${new Date().toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}\n\nHiring Team\n${job.company}\n\nRe: ${job.title}\n\nDear Hiring Team,\n\nI am writing to apply for the ${job.title} position at ${job.company}. I offer ${positioning.opening}, supported by hands-on experience delivering digital projects, organizing remote work, and communicating clearly with clients and customers.\n\nMy most relevant strengths include ${joinNaturalLanguage(positioning.strengths)}. Through Nojic and my work at International Evangelical Church, I have taken projects from initial requirements to dependable results while managing priorities independently and keeping stakeholders informed. That combination of ownership, adaptability, and attention to detail would allow me to contribute quickly to your team.\n\n${job.company} interests me because this role aligns closely with the practical, cross-functional work I do best. I would value the opportunity to learn more about your priorities and discuss how my experience can support them.\n\nThank you for your consideration.\n\nSincerely,\n${signature}`;
}

function createResumeText(profile: CandidateProfile, positioning: RolePositioning): string {
  const experience: string = profile.experience.map((item): string => `${item.title.toUpperCase()} | ${item.company} | ${item.startDate}–${item.endDate}\n${item.highlights.map((highlight: string): string => `• ${highlight}`).join("\n")}`).join("\n\n");
  const education: string = profile.education.map((item): string => `${item.qualification} | ${item.institution} | ${item.year}`).join("\n");
  const certifications: string = profile.certifications.map((item): string => [item.name, `${item.issuer} via ${item.platform}`, item.completedAt].filter(Boolean).join(" | ")).join("\n");
  const contactDetails: string = [profile.location, profile.email, profile.phone].filter(Boolean).join(" | ");
  const professionalLinks: string = [profile.portfolioUrl, profile.linkedInUrl].filter(Boolean).join(" | ");
  const linksSection: string = professionalLinks ? `${professionalLinks}\n` : "";
  return `${profile.fullName.toUpperCase()}\n${positioning.headline}\n${contactDetails}\n${linksSection}\nPROFESSIONAL SUMMARY\n${profile.summary}\n\nCORE SKILLS\n${positioning.strengths.concat(profile.skills).filter((skill: string, index: number, skills: string[]): boolean => skills.indexOf(skill) === index).join(" | ")}\n\nPROFESSIONAL EXPERIENCE\n${experience}\n\nSELECTED ACHIEVEMENTS\n${profile.achievements.map((achievement: string): string => `• ${achievement}`).join("\n")}\n\nCERTIFICATIONS\n${certifications}\n\nEDUCATION\n${education}`;
}

function createResumeHtml(profile: CandidateProfile, positioning: RolePositioning): string {
  const skills: string[] = positioning.strengths.concat(profile.skills).filter((skill: string, index: number, items: string[]): boolean => items.indexOf(skill) === index);
  const contactDetails: string = [profile.location, profile.email, profile.phone].filter(Boolean).map(escapeHtml).join(" | ");
  const professionalLinks: string = [profile.portfolioUrl, profile.linkedInUrl].filter(Boolean).map(escapeHtml).join(" | ");
  const linksHtml: string = professionalLinks ? `<br>${professionalLinks}` : "";
  const experienceHtml: string = profile.experience.map((item): string => `<section><h3>${escapeHtml(item.title)} — ${escapeHtml(item.company)}</h3><p class="meta">${escapeHtml(item.startDate)}–${escapeHtml(item.endDate)}</p><ul>${item.highlights.map((highlight: string): string => `<li>${escapeHtml(highlight)}</li>`).join("")}</ul></section>`).join("");
  const educationHtml: string = profile.education.map((item): string => `<p><strong>${escapeHtml(item.qualification)}</strong> — ${escapeHtml(item.institution)}, ${escapeHtml(item.year)}</p>`).join("");
  const certificationsHtml: string = profile.certifications.map((item): string => `<p><strong>${escapeHtml(item.name)}</strong> — ${[item.issuer, item.platform, item.completedAt].filter(Boolean).map(escapeHtml).join(" · ")}</p>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(profile.fullName)} Resume</title><style>body{font-family:Arial,sans-serif;color:#191919;max-width:760px;margin:32px auto;line-height:1.42;font-size:11pt}h1{font-size:24pt;margin:0}h2{font-size:12pt;border-bottom:1px solid #333;padding-bottom:4px;margin-top:22px}h3{font-size:11pt;margin:12px 0 0}.title{font-size:13pt;margin:4px 0}.contact,.meta{color:#444;margin:4px 0}ul{margin:6px 0;padding-left:20px}li{margin:3px 0}.skills{line-height:1.7}@media print{body{margin:0;max-width:none}}</style></head><body><header><h1>${escapeHtml(profile.fullName)}</h1><p class="title">${escapeHtml(positioning.headline)}</p><p class="contact">${contactDetails}${linksHtml}</p></header><h2>PROFESSIONAL SUMMARY</h2><p>${escapeHtml(profile.summary)}</p><h2>CORE SKILLS</h2><p class="skills">${skills.map(escapeHtml).join(" | ")}</p><h2>PROFESSIONAL EXPERIENCE</h2>${experienceHtml}<h2>SELECTED ACHIEVEMENTS</h2><ul>${profile.achievements.map((achievement: string): string => `<li>${escapeHtml(achievement)}</li>`).join("")}</ul><h2>CERTIFICATIONS</h2>${certificationsHtml}<h2>EDUCATION</h2>${educationHtml}</body></html>`;
}

function joinNaturalLanguage(items: string[]): string {
  if (items.length < 2) {
    return items[0] ?? "";
  }
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character: string): string => {
    const entities: Readonly<Record<string, string>> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return entities[character] ?? character;
  });
}
