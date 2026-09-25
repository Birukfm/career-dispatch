# Career Dispatch

A local-first job discovery and personalized application desk. It finds relevant full-time roles from public job-board APIs, scores them, creates a role-specific ATS resume and cover letter, and sends reviewed applications through your SMTP account.

## What it does

- Discovers relevant roles from Remote OK, Arbeitnow, Remotive, and Jobicy public APIs.
- Classifies communications, virtual assistance, design, customer support, prompt engineering, web development, and application development roles.
- Scores remote, worldwide, full-time, and publicly contactable opportunities.
- Generates a tailored email, ATS resume, and cover letter for each role.
- Sends only to recruiting addresses explicitly included in a public job post.
- Stores jobs and outreach history in an atomic local JSON data store.
- Enforces one-to-one review, deduplication, spacing, and daily/weekly limits.
- Tracks sent and replied status without covert tracking pixels.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`. Email and AI credentials can then be added from the local Configuration page.

3. Copy `data/profile.example.json` to `data/profile.json` and replace every placeholder. Accurate dates, verifiable achievements, education, portfolio links, and contact information are essential. The personal profile is ignored by Git.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`, select **Discover roles**, and review every application package before sending.

## Email provider examples

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-application-password
SMTP_FROM_EMAIL=your-address@gmail.com
```

### Microsoft 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-address@example.com
```

Provider policies vary. New accounts should start below the configured limits and increase only when delivery and response quality are healthy.

Microsoft accounts that disable app passwords or Authenticated SMTP require OAuth and cannot use password-based SMTP.

## Security

Career Dispatch is local-first. Personal profiles, generated PDFs, email credentials, AI keys, outreach history, and local settings are excluded from Git.

All API routes and the Documents and Configuration pages are limited to localhost by default. Before exposing the application on a network or deployment, set a long random access token:

```env
CAREER_DISPATCH_ACCESS_TOKEN=replace-with-a-long-random-value
```

Generate one with:

```bash
openssl rand -hex 32
```

Remote browsers will request HTTP Basic authentication; use any username and the access token as the password. API clients may alternatively send `Authorization: Bearer <token>`.

The application also sets CSP, clickjacking, MIME-sniffing, referrer, permissions, and HTTPS transport headers. This repository contains no hosted multi-user authentication system and should not be deployed publicly without the access token.

## Read receipts

The default is `REQUEST_READ_RECEIPTS=false`. Career Dispatch deliberately does not add a hidden tracking pixel.

To request a standards-based receipt:

```env
REQUEST_READ_RECEIPTS=true
```

This adds `Disposition-Notification-To` and `Return-Receipt-To` headers. The recipient's email client may ask for consent, ignore the request, or block it. A receipt is not proof that a person meaningfully read the message. For dependable tracking, use the dashboard's sent status and mark genuine replies as replied.

## Weekly workflow

The configured ceiling is 100 applications per week and 20 per day, with at least 90 seconds between messages. These are ceilings, not targets. Sending fewer well-matched applications generally protects deliverability and produces better results.

1. Discover roles at the beginning of each workday.
2. Shortlist strong matches.
3. Open **Prepare**, correct any generated claim that is not true, and follow the original application instructions.
4. Send only where the post publicly supplies a recruiting email. Otherwise, use the original listing link.
5. Mark responses in the dashboard.

## Responsible use

Respect each site's terms, robots policy, privacy law, anti-spam law, and the job post's application instructions. Do not guess addresses, harvest personal contact details, buy lists, bypass site controls, or send duplicate applications. The included sources expose public APIs; add another source only when its terms permit automated access.

## Verification

```bash
npm run typecheck
npm run build
```
