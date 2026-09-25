# Career Dispatch

[![Security and build](https://github.com/Birukfm/career-dispatch/actions/workflows/security.yml/badge.svg)](https://github.com/Birukfm/career-dispatch/actions/workflows/security.yml)
[![CodeQL](https://github.com/Birukfm/career-dispatch/actions/workflows/codeql.yml/badge.svg)](https://github.com/Birukfm/career-dispatch/actions/workflows/codeql.yml)

A local-first workspace for discovering relevant jobs, cleaning up application documents, reviewing personalized application packages, and sending deliberate one-to-one outreach.

Career Dispatch is designed to help applicants organize a serious job search without turning it into indiscriminate email automation. Every application requires review, every claim comes from the candidate's profile, and messages can only be sent to recruiting addresses explicitly published in a job listing.

## Highlights

- Searches four permitted public job APIs without scraping protected websites.
- Scores roles using discipline, experience, location, employment type, and resume skills.
- Accepts PDF, DOCX, and TXT resumes for transient local skill extraction.
- Includes full-time, internship, graduate, junior, and apprenticeship targeting.
- Generates editable ATS resumes, cover letters, and application emails.
- Provides three resume templates and three cover-letter templates.
- Tracks discovered, shortlisted, drafted, sent, replied, and archived opportunities.
- Sends reviewed applications through Gmail, Microsoft 365, or custom SMTP.
- Enforces duplicate prevention, daily and weekly limits, and minimum send delays.
- Stores profiles, credentials, jobs, and settings locally rather than in a hosted database.

## Product principles

### Cleanup, not invention

Document tailoring improves structure, wording, emphasis, and ATS readability. It does not invent credentials, metrics, responsibilities, employers, education, or achievements. Every generated document remains editable before use.

### Review before sending

Career Dispatch does not provide an unattended bulk-send mode. The recipient and generated documents must be reviewed before each application can be sent.

### Public contact information only

Email sending is restricted to a recruiting address explicitly found near application instructions in a public job post. The application does not guess addresses, harvest personal contact details, or purchase lists.

## Job sources

Career Dispatch currently uses public APIs from:

- [Remote OK](https://remoteok.com)
- [Arbeitnow](https://www.arbeitnow.com)
- [Remotive](https://remotive.com)
- [Jobicy](https://jobicy.com)

LinkedIn, Indeed, Wellfound, and similar protected platforms are not scraped.

## Application flow

```mermaid
flowchart LR
    A[Candidate profile or uploaded resume] --> B[Skill extraction]
    B --> C[Public job APIs]
    C --> D[Relevance scoring and filters]
    D --> E[Shortlist and review]
    E --> F[Editable resume and cover letter]
    F --> G{Public recruiting email?}
    G -- Yes --> H[Reviewed SMTP send]
    G -- No --> I[Open original application page]
    H --> J[Local outreach tracking]
```

## Quick start

### Requirements

- Node.js 20 or newer
- npm
- An email account with SMTP access if you want to send applications

### Installation

```bash
git clone https://github.com/Birukfm/career-dispatch.git
cd career-dispatch
npm install
cp .env.example .env.local
cp data/profile.example.json data/profile.json
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Add your profile

Edit `data/profile.json` with accurate information:

- Contact details and professional links
- Professional summary
- Verified skills
- Employment history and dates
- Factual achievements
- Education and certifications

`data/profile.json` is ignored by Git. The committed `data/profile.example.json` contains placeholders only.

## Dashboard

The main dashboard provides:

- Opportunity counts and weekly send progress
- Resume-aware discovery
- Discipline, location, experience, and employment filters
- Search, fit scoring, and application statuses
- Original job links
- Tailored application previews
- Manual review confirmation before sending

Uploaded resumes are parsed in memory and are not written to disk.

## Documents workspace

The `/documents` page contains separate editable sections for resumes and cover letters.

### Resume templates

1. **Classic ATS** — conventional single-column layout for application portals.
2. **Technical Focus** — emphasizes products, implementation skills, and technical experience.
3. **Compact Professional** — concise format for support, communications, and operational roles.

### Cover-letter templates

1. **Direct Professional** — traditional role-to-experience structure.
2. **Product Story** — concise ownership and delivery narrative.
3. **Concise Value** — short format for recruiter outreach.

Templates support live editing, previewing, copying, and text download.

## Email configuration

Open `/settings` and choose an email provider.

### Gmail

1. Enable Google 2-Step Verification.
2. Open [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create an app password named `Career Dispatch`.
4. Enter your address, sender name, and generated app password.

Do not enter your normal Google account password.

### Microsoft 365 or Outlook

Personal Outlook accounts may expose app passwords under Microsoft Advanced security options.

For Microsoft 365 work or school mailboxes, an administrator must enable **Authenticated SMTP** under:

`Users → Active users → User → Mail → Manage email apps`

Microsoft accounts that disable app passwords or Authenticated SMTP require OAuth and cannot use the current password-based mailer.

### Custom SMTP

Enter the SMTP host, port, TLS preference, mailbox username, password, sender name, and sender address supplied by your provider.

Environment variables remain available as a fallback; see `.env.example`.

## AI configuration

The Configuration page can locally store:

- Provider
- Provider-specific model identifier
- Optional custom compatible endpoint
- API key

Supported configuration presets include OpenAI, Anthropic, Google Gemini, and OpenRouter.

**Current status:** AI credentials are configuration-only. The current release uses deterministic resume analysis and document templates and does not yet send requests to an AI provider.

## Read receipts

Hidden tracking pixels are deliberately excluded.

Standards-based receipt requests can be enabled in `.env.local`:

```env
REQUEST_READ_RECEIPTS=true
```

This adds `Disposition-Notification-To` and `Return-Receipt-To` headers. Recipients may decline or ignore them, and a receipt does not prove meaningful engagement.

## Safety limits

Defaults are configurable in `.env.local`:

```env
WEEKLY_SEND_LIMIT=100
DAILY_SEND_LIMIT=20
MINIMUM_SEND_DELAY_SECONDS=90
```

These values are ceilings, not recommended targets. Fewer well-matched applications generally produce better results and protect sender reputation.

## Privacy and security

Career Dispatch is local-first. The following are excluded from Git:

- `.env` files
- Candidate profiles
- Email credentials
- AI API keys
- Local job and outreach history
- Generated PDFs and resume source files
- Private keys and certificates

Credential files are written with restricted local permissions. Public API responses return configuration status and masked hints, never complete stored credentials.

### Remote access

All API routes and the Documents and Configuration pages are limited to localhost by default.

Before exposing the application beyond localhost, generate an access token:

```bash
openssl rand -hex 32
```

Add it to `.env.local`:

```env
CAREER_DISPATCH_ACCESS_TOKEN=your-generated-token
```

Remote browsers use HTTP Basic authentication. Any username is accepted; the access token is the password. API clients may send:

```http
Authorization: Bearer your-generated-token
```

Security headers include CSP, frame protection, MIME-sniffing protection, restrictive referrer and permissions policies, and HSTS for remote production traffic.

This is not a hosted multi-user authentication system. Do not deploy it publicly without the access token and appropriate network controls.

## Local data

Runtime data is stored as atomic JSON files under `data/`:

- Candidate profile
- Job queue
- Outreach history
- Email settings
- AI settings

The application is intended for one local user. Concurrent multi-user writes and cloud synchronization are outside the current design.

## Project structure

```text
src/
├── app/
│   ├── api/             # Discovery, documents, settings, and sending routes
│   ├── documents/       # Editable document studio
│   └── settings/        # Email and AI configuration
├── components/          # Dashboard and configuration interfaces
├── lib/                 # Sources, templates, storage, mailer, and security data access
└── proxy.ts             # Remote-access controls and security headers
data/
└── profile.example.json # Public-safe profile schema
```

## Commands

```bash
npm run dev        # Start the local development server
npm run typecheck  # Check TypeScript
npm run build      # Create a production build
npm start          # Run the production build
npm audit          # Check dependencies for known vulnerabilities
```

## Responsible use

You are responsible for complying with:

- Job-board terms and application instructions
- Email provider policies
- Privacy and anti-spam laws
- Employer communication preferences
- Accuracy of all submitted documents

Do not use Career Dispatch to harvest contacts, guess addresses, bypass site controls, send deceptive claims, or distribute duplicate unsolicited messages.

## Security and contributing

- Review [SECURITY.md](SECURITY.md) before reporting a vulnerability.
- Do not place credentials or personal resumes in issues, pull requests, fixtures, or screenshots.
- Run type checking, the production build, and `npm audit` before opening a pull request.
- GitHub Actions, CodeQL, Dependabot, secret scanning, and push protection are enabled for this repository.
