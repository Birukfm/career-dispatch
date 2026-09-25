import type { CandidateProfile, CertificationItem, ExperienceItem } from "@/lib/types";

export type DocumentKind = "resume" | "cover_letter";

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  bestFor: string;
  content: string;
}

export interface DocumentTemplateLibrary {
  resumes: DocumentTemplate[];
  coverLetters: DocumentTemplate[];
}

export function createDocumentTemplateLibrary(profile: CandidateProfile): DocumentTemplateLibrary {
  return {
    resumes: [
      {
        id: "classic_ats",
        name: "Classic ATS",
        description: "A conventional, single-column structure optimized for applicant tracking systems.",
        bestFor: "Corporate roles and application portals",
        content: createClassicResume(profile),
      },
      {
        id: "technical_focus",
        name: "Technical Focus",
        description: "Leads with products, technical skills, and implementation experience.",
        bestFor: "Software, web, mobile, and ICT roles",
        content: createTechnicalResume(profile),
      },
      {
        id: "compact_professional",
        name: "Compact Professional",
        description: "A concise version for quick recruiter review and broad operational roles.",
        bestFor: "Support, communications, and operations",
        content: createCompactResume(profile),
      },
    ],
    coverLetters: [
      {
        id: "direct_professional",
        name: "Direct Professional",
        description: "A traditional letter that connects verified experience directly to the role.",
        bestFor: "Formal employers and application portals",
        content: createDirectCoverLetter(profile),
      },
      {
        id: "product_story",
        name: "Product Story",
        description: "Uses a concise professional narrative centered on ownership and shipped work.",
        bestFor: "Startups and product teams",
        content: createNarrativeCoverLetter(profile),
      },
      {
        id: "concise_value",
        name: "Concise Value",
        description: "A brief, skimmable letter designed for busy hiring teams.",
        bestFor: "Email outreach and high-volume applications",
        content: createConciseCoverLetter(profile),
      },
    ],
  };
}

function createClassicResume(profile: CandidateProfile): string {
  const experience: string = profile.experience.map(formatExperience).join("\n\n");
  const certifications: string = profile.certifications.map(formatCertification).join("\n");
  return `${profile.fullName.toUpperCase()}\n${profile.professionalTitle}\n${createContactLine(profile)}\n\nPROFESSIONAL SUMMARY\n${profile.summary}\n\nCORE SKILLS\n${profile.skills.join(" | ")}\n\nPROFESSIONAL EXPERIENCE\n${experience}\n\nSELECTED ACHIEVEMENTS\n${profile.achievements.map((achievement: string): string => `• ${achievement}`).join("\n")}\n\nCERTIFICATIONS\n${certifications}\n\nEDUCATION\n${profile.education.map((item): string => `${item.qualification} | ${item.institution} | ${item.year}`).join("\n")}`;
}

function createTechnicalResume(profile: CandidateProfile): string {
  const experience: string = profile.experience.map(formatExperience).join("\n\n");
  const technicalSkills: string = profile.skills.slice(0, 10).join(" | ");
  return `${profile.fullName.toUpperCase()}\nSOFTWARE DEVELOPER | MOBILE, WEB & ICT SYSTEMS\n${createContactLine(profile)}\n\nTECHNICAL PROFILE\n${profile.summary}\n\nSELECTED PRODUCTS & DELIVERY\n${profile.achievements.map((achievement: string): string => `• ${achievement}`).join("\n")}\n\nTECHNICAL SKILLS\n${technicalSkills}\n\nEXPERIENCE\n${experience}\n\nCERTIFICATIONS\n${profile.certifications.map(formatCertification).join("\n")}\n\nEDUCATION\n${profile.education.map((item): string => `${item.qualification} — ${item.institution}, ${item.year}`).join("\n")}`;
}

function createCompactResume(profile: CandidateProfile): string {
  const experience: string = profile.experience.map((item: ExperienceItem): string => `${item.title} — ${item.company} | ${item.startDate}–${item.endDate}\n${item.highlights.slice(0, 2).map((highlight: string): string => `• ${highlight}`).join("\n")}`).join("\n\n");
  return `${profile.fullName.toUpperCase()}\n${profile.professionalTitle}\n${createContactLine(profile)}\n\nPROFILE\n${profile.summary}\n\nKEY CAPABILITIES\n${profile.skills.slice(0, 12).join(" | ")}\n\nEXPERIENCE\n${experience}\n\nEDUCATION & CERTIFICATIONS\n${profile.education.map((item): string => `${item.qualification}, ${item.institution}`).join("\n")}\n${profile.certifications.map(formatCertification).join("\n")}`;
}

function createDirectCoverLetter(profile: CandidateProfile): string {
  return `[DATE]\n\nHiring Team\n[COMPANY]\n\nRe: [ROLE]\n\nDear Hiring Team,\n\nI am applying for the [ROLE] position at [COMPANY]. I am a ${profile.professionalTitle.toLowerCase()} with experience taking work from initial requirements through dependable delivery.\n\nOne relevant example from my background is: ${profile.achievements[0] ?? "[ADD A VERIFIED ACHIEVEMENT]"}. I would welcome the opportunity to apply my technical problem-solving, ownership, and communication skills to your team.\n\nThank you for considering my application. I would be pleased to discuss how my verified experience aligns with your priorities.\n\nSincerely,\n${createSignature(profile)}`;
}

function createNarrativeCoverLetter(profile: CandidateProfile): string {
  return `Dear [COMPANY] Hiring Team,\n\nI do my best work where a practical problem needs to become a dependable result. A representative achievement from my experience is: ${profile.achievements[0] ?? "[ADD A VERIFIED ACHIEVEMENT]"}.\n\nThe [ROLE] opportunity stands out because [ADD A SPECIFIC, TRUTHFUL REASON FROM THE JOB POST]. My background in ${profile.skills.slice(0, 6).join(", ")} would allow me to contribute with a practical and user-focused perspective.\n\nI would value the opportunity to discuss the work your team is doing and where my experience could be useful.\n\nBest regards,\n${createSignature(profile)}`;
}

function createConciseCoverLetter(profile: CandidateProfile): string {
  return `Hello [COMPANY] Hiring Team,\n\nI am applying for the [ROLE] position. My background as a ${profile.professionalTitle.toLowerCase()} includes ${profile.skills.slice(0, 5).join(", ")}. One verified achievement is: ${profile.achievements[0] ?? "[ADD A VERIFIED ACHIEVEMENT]"}.\n\nI have attached my resume and would welcome a conversation about how I can contribute to [COMPANY].\n\nBest,\n${createSignature(profile)}`;
}

function formatExperience(item: ExperienceItem): string {
  return `${item.title.toUpperCase()} | ${item.company} | ${item.startDate}–${item.endDate}\n${item.highlights.map((highlight: string): string => `• ${highlight}`).join("\n")}`;
}

function formatCertification(item: CertificationItem): string {
  return `${item.name} | ${item.issuer} via ${item.platform}`;
}

function createContactLine(profile: CandidateProfile): string {
  return [profile.location, profile.email, profile.phone, profile.portfolioUrl, profile.linkedInUrl].filter(Boolean).join(" | ");
}

function createSignature(profile: CandidateProfile): string {
  return [profile.fullName, profile.email, profile.phone, profile.portfolioUrl, profile.linkedInUrl].filter(Boolean).join("\n");
}
