# 01 Product Requirements Document

## Goals
1. Give job seekers a safe CRM for opportunities and applications.
2. Require explicit consent before sensitive data ingestion.
3. Enforce source compliance before any import path creates data.
4. Preserve source attribution for every job record.
5. Keep users in control of drafts, applications, messages, and status changes.

## Personas
- Active job seeker: imports many jobs, compares fit, tracks status.
- Privacy-conscious candidate: wants resume/profile controls, deletion, and export.
- Operator/compliance reviewer: monitors source policies, blocked events, and audit logs.

## User journeys
1. User signs up, reviews privacy/product boundaries, accepts consent, and enters the workspace.
2. User uploads or manually enters profile data, confirms extracted facts, and sets preferences.
3. User imports jobs by manual link or CSV, reviews normalized fields, and saves jobs.
4. User tracks applications through saved, applied, interviewing, offer, rejected, and archived states.
5. Later, user connects scoped email-alert ingestion and reviews imported jobs.
6. Later, user requests resume or cover-letter drafts, edits them, and explicitly approves final versions.

## MVP features
- Auth skeleton.
- Consent records and revocation.
- Source policy registry.
- Audit log writer.
- Manual link import endpoint.
- Job listing and application models.
- Export/delete service skeleton.
- Compliance guardrail tests.

## Deferred features
- Gmail alert ingestion.
- Outlook ingestion.
- Resume parsing beyond upload abstraction.
- LLM-backed extraction and drafting.
- Official ATS/API connectors.
- Reminders.
- Browser extension user-click capture.

## Success metrics
- 60% of activated users import at least 5 jobs.
- 90% title/company/source accuracy on import fixtures.
- 95% dedupe precision on duplicate fixtures once dedupe ships.
- Zero prohibited automation incidents.
- 100% data deletion/export completion within the adopted policy window.

## Launch blockers
- Missing consent gate.
- Missing source registry.
- Missing audit logs on ingestion or sensitive actions.
- Any code path that scrapes or automates Indeed/Glassdoor.
- Any auto-apply, auto-message, or screening-answer automation.
- No export/delete path.
- Generated materials without human approval checkpoint.

## Product principles
- User remains in control.
- Manual-first, consent-first, compliance-first.
- Deny by default for sources and ingestion methods.
- Explainable scoring and editable assumptions.
- No invented candidate claims.
- Drafts are not submissions.
- Minimize stored raw content.

## Human-in-the-loop requirements
- Users must review imported job fields before final save if confidence is low or source policy limits fetching.
- Profile facts from resumes are unusable for drafting until confirmed.
- Generated materials require explicit user approval before being marked approved.
- Application status changes are user-controlled unless a later email evidence workflow asks the user to confirm.
