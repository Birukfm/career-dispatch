# Security Policy

## Supported version

Security fixes are applied to the latest version on the default branch.

## Reporting a vulnerability

Do not include API keys, SMTP passwords, resumes, personal information, or exploit details in a public issue.

Report vulnerabilities privately through GitHub's **Security** → **Advisories** → **Report a vulnerability** flow for this repository.

Include:

- A concise description of the issue.
- Reproduction steps using placeholder credentials.
- The affected route or file.
- The expected security impact.

## Local-first security model

Career Dispatch is designed to run on localhost. Remote access to API routes and credential-bearing pages is denied by default. Set `CAREER_DISPATCH_ACCESS_TOKEN` before exposing the application beyond localhost.

Local files under `data/`, environment files, generated resumes, PDFs, and private keys are excluded from Git. Never override those ignore rules with real credentials or personal documents.
