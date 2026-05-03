# 08 Test Strategy

## Current Sprint 1 validation status
- Shared compliance guardrail tests exist for explicit prohibited actions, deny-by-default source policies, disabled policies, legal-review policies, do-not-build policies, and consent-required MVP policies.
- API hardening tests exist for local dev auth gating, protected-route authentication, body `userId` impersonation resistance, consent grant/revoke behavior, audit route gating, manual import validation, and privacy route stubs.
- DB-backed smoke proof has been added in `apps/api/tests/prisma-smoke.test.ts` and must run after Prisma generation, migrations, and seed in CI.
- Full validation is not complete until a real checkout confirms `npm ci`, Postgres startup, Prisma generation, migrations, seed, typecheck, lint, and tests all pass.

## Unit tests
- Compliance source-policy decisions.
- Prohibited-action detection.
- Consent-required checks.
- URL validation and future canonicalization.
- Application status validation.
- Scoring components once scoring ships.

## Integration tests
- Auth -> consent -> manual import -> job listing -> application flow.
- Disabled source blocks source event and job creation.
- Consent revocation blocks sensitive actions.
- Export/delete scaffolding returns expected user-owned data boundaries.

## Prisma/Postgres smoke test
The Sprint 1 acceptance suite must include a DB-backed proof, not only in-memory API tests. `apps/api/tests/prisma-smoke.test.ts` verifies:
- Migrations have created the tables needed by Prisma Client.
- Seeded source policies include allowed MVP manual import policy.
- Consent can be granted and read through the real `PrismaStore`.
- Manual import creates a `SourceEvent` before a linked `JobListing`.
- `JobListing.sourceEventId` points at the persisted source event.
- Failed source-policy checks do not create source events or job listings.

CI must run this after `npm run db:generate`, `npm run db:migrate`, and `npm run db:seed` against Postgres.

## Compliance guardrail tests
- Indeed scraping is rejected.
- Glassdoor scraping is rejected.
- Headless browser automation is rejected.
- CAPTCHA bypass and anti-bot evasion are rejected.
- Credential collection and cookie/session replay are rejected.
- Auto-save, auto-apply, auto-message, and screening-answer automation are rejected.
- Glassdoor bulk review/salary/rating/interview content is rejected.
- Product runtime code must not reference `.agents`, `_bmad`, Playwright, `browser automation`, or TEA browser automation config. CI runs `scripts/check-product-boundary.sh` to enforce this for `apps/` and `packages/`.

## Parser fixture tests
Planned parser fixtures validate deterministic extraction and review fallbacks. Parser output must include source attribution, confidence, and missing-field flags.

## Scoring regression tests
Planned scoring tests cover high-fit, medium-fit, low-fit, impossible location, salary mismatch, and red-flag penalty cases. Scores must be versioned.

## Privacy deletion/export tests
- Export includes all user-owned records and excludes other users.
- Delete removes or anonymizes user-owned records.
- Tokens and object storage entries are revoked/deleted once those systems ship.
- Current Sprint 1 export/delete routes are authenticated audited `501` stubs only.

## Authz tests
Every user-owned endpoint must reject cross-user reads/writes.

## Source policy tests
- Missing policy means blocked.
- Disabled policy means blocked.
- `DO_NOT_BUILD` classification means blocked.
- `REQUIRES_LEGAL_REVIEW` means blocked until enabled with an explicit approved status.
- `SAFE_FOR_MVP` and `SAFE_WITH_EXPLICIT_USER_CONSENT` can proceed only when consent requirements are satisfied.

## LLM guardrail tests for later phases
- Unsupported candidate claims are blocked.
- Drafts remain drafts until approved.
- No screening-answer generation.
- Claims map traces every generated claim to confirmed facts.
- Structured outputs validate against schemas.

## Required fixtures
- Manual job link import.
- CSV import.
- Duplicate jobs.
- Missing salary/location.
- Remote/hybrid ambiguity.
- Scam/low-quality job.
- Indeed alert email fixture for later.
- Glassdoor alert email fixture for later.
- Greenhouse posting fixture for later.
- Lever posting fixture for later.
