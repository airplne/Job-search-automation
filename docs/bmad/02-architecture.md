# 02 Architecture

## System overview
MVP uses a TypeScript modular monolith API, a future Next.js web app, shared TypeScript types, Postgres, and Prisma. Compliance is enforced inside the API before ingestion, profile, document, export/delete, and generated-material workflows.

```text
apps/web -> apps/api -> modules
  auth
  consent
  compliance
  sources
  audit
  jobs
  applications
  privacy
  future: documents, scoring, email, LLM, ATS connectors
Postgres + future pgvector
Future object storage, queue, LLM provider, email provider
```

## Service/module boundaries
- Auth: local/dev user identity and replaceable session boundary.
- Consent: grant/revoke consent with versioning and audit events.
- Compliance: deny-by-default source decisions and prohibited-action checks.
- Source registry: stores provider, method, classification, allowed/disallowed data, legal status.
- Ingestion: manual link and later CSV/email/API import paths.
- Jobs: source-attributed listing records and normalized job card fields.
- Applications: user-controlled CRM statuses and timeline.
- Privacy: user export/delete orchestration.
- Audit: append-only activity records.

## Data flow
1. User authenticates.
2. Consent is checked before sensitive or ingestion actions.
3. Import request calls compliance guard before any source event is created.
4. Source event captures provenance.
5. Job listing is created with required source fields.
6. Application tracker references the job listing.
7. Audit logs record consent, source decisions, imports, status updates, export/delete, and approvals.

## Database entities
Initial Prisma schema covers users, consents, source_policies, source_events, job_listings, applications, generated_materials, and audit_logs. Planned entities add user_profiles, profile_facts, documents, canonical_jobs, job_scores, and reminders.

## API boundaries
- `GET /health`
- `POST /auth/dev-login`
- `POST /consents`
- `DELETE /consents/:id`
- `GET /source-policies`
- `POST /jobs/import/link`
- `POST /applications`
- Future: `/documents`, `/profile`, `/privacy/export`, `/privacy/delete`, `/materials`, `/email/*`, `/admin/*`.

## Background job boundaries
No background workers are required in the first skeleton. Future workers include resume parsing, CSV row processing, email sync, normalization, dedupe, scoring, export/delete, and reminders.

## Security model
- Owner-only access for user data.
- Admin-only writes for source policies in future admin UI.
- Password/auth implementation is replaceable; current skeleton is dev-friendly only.
- Never store third-party platform credentials or cookies.
- Do not log resume text, OAuth tokens, raw email bodies, or generated materials.

## Audit model
Audit logs are append-only application events with actor, action, target, and redacted metadata. After user deletion, logs should be anonymized or retained only as policy permits.

## Source compliance registry model
Every source policy has provider, acquisition method, classification, legal status, allowed data, disallowed data, retention note, and enabled flag. A source must be enabled and classified as safe or consent-safe before ingestion.

## Future email ingestion architecture
User grants OAuth with minimal scopes, chooses label/query scope, and can revoke access. Sync stores message IDs and minimal metadata, parses only alert messages, creates source events, and avoids storing unrelated email bodies.

## Future LLM architecture
LLM calls sit behind a gateway that enforces prompt versioning, schema validation, redaction, claim tracing, unsupported-claim blocking, and user approval before material is marked approved.

## Future ATS connector architecture
Each connector must use official/public APIs or written agreements, have source registry approval, respect rate limits, preserve source attribution, and avoid application submission unless officially authorized.
