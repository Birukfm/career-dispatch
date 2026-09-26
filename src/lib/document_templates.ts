import type { CandidateProfile, CertificationItem, ExperienceItem } from "@/lib/types";

export type DocumentKind = "resume" | "cover_letter" | "readme";

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
  readmes: DocumentTemplate[];
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
    readmes: [
      {
        id: "product_workspace",
        name: "Product Workspace",
        description: "A full product README with principles, flow, setup, and safety sections—modeled on this project's design.",
        bestFor: "Apps, tools, and local-first products",
        content: createProductWorkspaceReadme(profile),
      },
      {
        id: "open_source_library",
        name: "Open Source Library",
        description: "Leads with install, usage, API surface, and contribution guidance for packages.",
        bestFor: "Libraries, SDKs, and shared modules",
        content: createOpenSourceLibraryReadme(profile),
      },
      {
        id: "portfolio_showcase",
        name: "Portfolio Showcase",
        description: "A concise project README for demos, case studies, and personal repositories.",
        bestFor: "Portfolio pieces and interview projects",
        content: createPortfolioShowcaseReadme(profile),
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

function createProductWorkspaceReadme(profile: CandidateProfile): string {
  const skillHighlights: string = profile.skills.slice(0, 6).map((skill: string): string => `- ${skill}`).join("\n");
  const achievementHighlights: string = profile.achievements.slice(0, 3).map((achievement: string): string => `- ${achievement}`).join("\n");
  return `# [PROJECT_NAME]

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/[USERNAME]/[REPO])
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[ONE-SENTENCE PRODUCT SUMMARY]. Built for people who need a clear, reviewable workflow rather than noisy automation.

[PROJECT_NAME] helps ${profile.professionalTitle.toLowerCase()}s organize serious work without inventing claims or skipping review. Every output starts from verified information and stays editable before use.

## Highlights

${skillHighlights}
${achievementHighlights || "- [ADD A VERIFIED PRODUCT HIGHLIGHT]"}
- Stores configuration and history locally rather than in a hosted database.
- Keeps sensitive credentials out of source control.

## Product principles

### Cleanup, not invention

Document and content generation improves structure, wording, emphasis, and readability. It does not invent credentials, metrics, responsibilities, or achievements. Every generated artifact remains editable before use.

### Review before action

[PROJECT_NAME] does not provide an unattended bulk mode. Recipients, outputs, and side effects must be reviewed before each important action.

### Explicit inputs only

The application uses information you provide or publicly documented sources. It does not guess private details, harvest personal contacts, or purchase lists.

## Application flow

\`\`\`mermaid
flowchart LR
    A[Profile or project inputs] --> B[Local preparation]
    B --> C[Editable draft]
    C --> D{Reviewed?}
    D -- Yes --> E[Export or send]
    D -- No --> F[Continue editing]
    E --> G[Local history]
\`\`\`

## Quick start

### Requirements

- Node.js 20 or newer
- npm
- [ADD ANY REQUIRED ACCOUNTS OR TOOLS]

### Installation

\`\`\`bash
git clone https://github.com/[USERNAME]/[REPO].git
cd [REPO]
npm install
cp .env.example .env.local
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

### Configure your profile

Edit the local profile or settings with accurate information only:

- Contact details and professional links
- Verified skills and experience
- Factual project details

## Commands

\`\`\`bash
npm run dev        # Start the local development server
npm run typecheck  # Check TypeScript
npm run build      # Create a production build
npm start          # Run the production build
\`\`\`

## Privacy and security

[PROJECT_NAME] is local-first. Exclude the following from Git:

- \`.env\` files
- Personal profiles
- Credentials and API keys
- Local history and generated artifacts

## Responsible use

You are responsible for complying with applicable terms, privacy rules, and the accuracy of all submitted content. Do not use [PROJECT_NAME] to harvest contacts, invent claims, or distribute unsolicited messages.

## Author

${profile.fullName} · ${profile.professionalTitle}
${[profile.email, profile.portfolioUrl, profile.linkedInUrl].filter(Boolean).join(" · ")}
`;
}

function createOpenSourceLibraryReadme(profile: CandidateProfile): string {
  const capabilities: string = profile.skills.slice(0, 8).map((skill: string): string => `- \`${skill}\``).join("\n");
  return `# [PACKAGE_NAME]

[SHORT LIBRARY DESCRIPTION: what it does in one sentence.]

Maintained with a practical delivery focus informed by work in ${profile.skills.slice(0, 4).join(", ") || "[YOUR CORE SKILLS]"}.

## Install

\`\`\`bash
npm install [PACKAGE_NAME]
\`\`\`

## Quick example

\`\`\`ts
import { [EXPORT_NAME] } from "[PACKAGE_NAME]";

const result = [EXPORT_NAME]({
  // replace with real, verified inputs
});

console.log(result);
\`\`\`

## Features

${capabilities || "- `[FEATURE_ONE]`\n- `[FEATURE_TWO]`"}
- Typed public API surface
- Deterministic defaults with override options
- No invented network side effects in the core package

## API overview

### \`[EXPORT_NAME](options)\`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| \`input\` | \`string\` | required | Primary value to process |
| \`strict\` | \`boolean\` | \`true\` | Fail closed on invalid input |
| \`locale\` | \`string\` | \`"en"\` | Optional formatting locale |

Returns a structured result object. Document only methods that exist in the package.

## Project structure

\`\`\`text
src/
├── index.ts          # Public exports
├── core/             # Domain logic
├── types/            # Shared contracts
└── utils/            # Small helpers
\`\`\`

## Development

\`\`\`bash
npm install
npm run typecheck
npm test
npm run build
\`\`\`

## Contributing

1. Open an issue describing the change.
2. Keep commits focused and factual.
3. Do not include credentials, private data, or fabricated benchmarks.
4. Run type checking and tests before opening a pull request.

## License

[LICENSE_NAME] · Copyright © ${new Date().getFullYear()} ${profile.fullName}
`;
}

function createPortfolioShowcaseReadme(profile: CandidateProfile): string {
  const stack: string = profile.skills.slice(0, 8).join(" · ") || "[STACK ITEMS]";
  const outcome: string = profile.achievements[0] ?? "[ADD ONE VERIFIED OUTCOME FROM THIS PROJECT]";
  return `# [PROJECT_TITLE]

A portfolio project by **${profile.fullName}**, ${profile.professionalTitle.toLowerCase()}.

${profile.summary}

## What it is

[TWO TO THREE SENTENCES DESCRIBING THE PROBLEM, AUDIENCE, AND RESULT.]

## Stack

${stack}

## Highlights

- ${outcome}
- [ADD A SECOND VERIFIED HIGHLIGHT]
- [ADD A THIRD VERIFIED HIGHLIGHT]

## Demo

- Live: [DEMO_URL]
- Source: https://github.com/[USERNAME]/[REPO]
${profile.portfolioUrl ? `- Portfolio: ${profile.portfolioUrl}` : "- Portfolio: [PORTFOLIO_URL]"}

## Run locally

\`\`\`bash
git clone https://github.com/[USERNAME]/[REPO].git
cd [REPO]
npm install
npm run dev
\`\`\`

## What I owned

- [SCOPE YOU PERSONALLY DELIVERED]
- [DECISIONS YOU MADE]
- [CONSTRAINTS YOU WORKED WITHIN]

## Contact

${createSignature(profile)}
`;
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
