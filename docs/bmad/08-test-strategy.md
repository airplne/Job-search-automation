# 08 Test Strategy

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

## Compliance guardrail tests
- Indeed scraping is rejected.
- Glassdoor scraping is rejected.
- Headless browser automation is rejected.
- CAPTCHA bypass and anti-bot evasion are rejected.
- Auto-apply, auto-message, and screening-answer automation are rejected.
- Glassdoor bulk review/salary/rating/interview content is rejected.

## Parser fixture tests
Planned parser fixtures validate deterministic extraction and review fallbacks. Parser output must include source attribution, confidence, and missing-field flags.

## Scoring regression tests
Planned scoring tests cover high-fit, medium-fit, low-fit, impossible location, salary mismatch, and red-flag penalty cases. Scores must be versioned.

## Privacy deletion/export tests
- Export includes all user-owned records and excludes other users.
- Delete removes or anonymizes user-owned records.
- Tokens and object storage entries are revoked/deleted once those systems ship.

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
