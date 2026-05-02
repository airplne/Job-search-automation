# 06 Compliance Guardrails

## Hard rules
1. Deny-by-default source registry: ingestion must be blocked unless a source policy explicitly allows the provider and acquisition method.
2. No third-party platform automation: no automated saves, applies, messages, button clicks, form submissions, or account actions.
3. No Indeed or Glassdoor scraping: no crawlers, headless browsers, stealth browsing, or page scraping against those platforms.
4. No Glassdoor content copying: do not bulk copy reviews, salaries, ratings, interview questions, or interview content.
5. No auto-apply: application submission is always performed by the user unless a future official API/written agreement explicitly permits otherwise.
6. No auto-message: recruiter, employer, and follow-up messages are drafts only unless the user sends them outside the product.
7. No screening-answer automation: the product must not answer screening questions on the user's behalf.
8. Human approval required for generated materials: AI materials remain drafts until approved.
9. Source attribution required for every job: provider, acquisition method, URL or source event, and policy decision must be stored.
10. Consent required before sensitive data ingestion: resume, email, documents, and generated material workflows require consent.
11. Audit log required for sensitive actions: consent changes, source decisions, imports, document actions, approvals, export, and deletion.
12. Data deletion/export required: user-owned data must be exportable and deletable according to policy.

## Classification labels

### Safe for MVP
Low platform risk with ordinary privacy/security controls.
Examples: manual job link entry, CSV import, application status tracking, source-attributed job cards, consent records, audit logs.

### Safe with explicit user consent
Requires sensitive user data access or document/email handling.
Examples: resume upload, user-authorized email alert ingestion, generated drafts based on confirmed profile data.

### Requires legal review
Source/platform/extension/API uncertainty or external terms dependency.
Examples: official ATS/API connectors, company career-page ingestion, browser extension capture, systematic handling of platform deep links.

### Do not build
Contradicts the product boundaries.
Examples: Indeed scraping, Glassdoor scraping, CAPTCHA bypass, anti-bot evasion, fake accounts, credentials/cookies/session replay, auto-apply, auto-message, screening-question automation, bulk Glassdoor content copying.

## Engineering enforcement
- Compliance decisions must live in code and tests, not only in documentation.
- Guardrail tests must fail if prohibited providers and methods are allowed.
- Manual import should store the user-provided URL and user-entered fields without crawling prohibited platforms.
- All future importers must call `assertSourceAllowed` before creating source events.
- All future generated-material flows must call an approval service before marking content approved.
