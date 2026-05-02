# 00 Project Brief

## Product summary
Job-search-automation is a compliance-first job-search copilot and application CRM. It helps job seekers collect opportunities from permitted, user-controlled sources, normalize job cards, rank opportunities, track applications, and later draft human-approved application materials.

## Target user
Individual job seekers applying to many roles who want one workspace for job leads, status tracking, prioritization, follow-ups, and reusable profile data.

## Core value proposition
Turn scattered job leads into a ranked, explainable, privacy-conscious job-search workspace that helps users act faster without violating platform rules or misrepresenting themselves.

## MVP scope
- Account foundation and replaceable local auth.
- Consent and product-boundary acknowledgement.
- Deny-by-default source compliance registry.
- Manual job link import with user review/edit fallback.
- CSV import planning and fixtures.
- Normalized job cards with source attribution.
- Application tracker CRM.
- Audit logging for sensitive and compliance-relevant actions.
- Data export and deletion scaffolding.
- Rule-based scoring and red-flag detection planning.

## Non-goals
- Direct scraping of job platforms.
- Automated application submission.
- Automated recruiter messaging.
- Automated screening-question answering.
- Bulk content copying from Glassdoor or similar platforms.
- Browser automation or extension workflows in the MVP.

## Explicitly prohibited features
- Indeed scraping.
- Glassdoor scraping.
- Headless browser automation against Indeed or Glassdoor.
- CAPTCHA handling or bypass.
- Anti-bot evasion.
- Fake-account flows.
- Cookie/session replay.
- Credential collection for third-party job platforms.
- Automated saves, applications, or messages on third-party platforms.
- Bulk copying of Glassdoor reviews, salaries, ratings, interview questions, or interview content.

## Compliance posture
Compliance is a first-class product requirement. All ingestion is gated by consent, a source policy decision, provenance capture, and audit logging. Sources default to blocked until explicitly classified. Generated materials are drafts until the user approves them.

## Assumptions
- The repo is greenfield and can adopt a TypeScript-first monorepo.
- Postgres is the MVP source of truth.
- pgvector, queue workers, object storage, OAuth email ingestion, and LLM features can be added behind interfaces later.
- Manual link import is allowed only as user-provided entry and review/edit flow; platform-specific fetching needs source approval.

## Risks
- Platform compliance drift.
- Privacy/security exposure from resumes and notes.
- Source policy misconfiguration.
- Poor import and normalization quality.
- LLM hallucination once generation is added.
- User mistrust if scoring or red flags are opaque.
