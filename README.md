# Job-search-automation

Compliance-first job-search copilot and application CRM.

This project is intentionally manual-first and consent-first. It helps users collect job opportunities from permitted, user-controlled sources, normalize job cards, track applications, and later draft human-approved materials. It does not operate as a bot on Indeed, Glassdoor, or other third-party platforms.

## Current repository status

The repo is a TypeScript monorepo:

```text
/
  docs/bmad/              BMAD planning artifacts
  apps/api/               Express + TypeScript API skeleton
  apps/web/               Next.js shell
  packages/shared/        Shared compliance and domain utilities
  scripts/                CI and safety checks
  docker-compose.yml      Local Postgres
  .env.example            Local environment template
  package-lock.json       npm lockfile for clean npm ci installs
```

## Sprint 1 hardening status

Sprint 1 hardening has patched the major runtime design issues and added the final reproducibility/CI wiring. Sprint 1 is still not formally accepted until a real checkout or GitHub Actions run proves the full validation suite is green. Sprint 2 must not begin until CI is verified green by the review team.

## Implemented now

- Local-only dev auth, disabled unless `ALLOW_DEV_AUTH=true` and never allowed in production.
- Auth middleware that uses the authenticated principal, not caller-supplied body `userId`.
- Prisma schema, checked-in migration, and seed script for default source policies.
- Prisma-backed consent, source policy, source event, job listing, and audit services.
- Manual link import that checks consent and source policy before creating records.
- Manual link import creates `SourceEvent` first, then a linked `JobListing`.
- DB-backed smoke test proving source policy seed, consent persistence, source event/job linkage, and no records after failed policy checks.
- Global audit listing is not public; it is local-dev admin gated and disabled unless `ALLOW_DEV_AUDIT=true`.
- Privacy export/delete route stubs that require auth, emit audit events, and return `501` until full orchestration is implemented.
- Granular code-level guardrails and tests for non-negotiable prohibited actions.
- Product-boundary grep script for runtime code under `apps/` and `packages/`.
- CI workflow using `npm ci`, product-boundary check, Prisma generation, committed migrations via `prisma migrate deploy`, seed, typecheck, lint, and tests.

## Planned, not implemented yet

- Full production authentication and authorization provider.
- Resume upload/parsing.
- CSV import endpoint.
- Application tracker API beyond schema foundation.
- Data export/delete orchestration beyond audited route stubs.
- Email alert ingestion.
- LLM drafting.
- ATS/API connectors.
- Browser extension.
- Scoring and red-flag detection.

## Explicit product boundaries

Do not add code paths for:

- Indeed scraping
- Glassdoor scraping
- Headless browser automation against Indeed or Glassdoor
- CAPTCHA handling or bypass
- Anti-bot evasion
- Fake-account flows
- Cookie/session replay
- Third-party job-platform credential collection
- Automated saves, applications, recruiter messages, or screening-answer workflows
- Bulk copying of Glassdoor reviews, salaries, ratings, interview questions, or interview content

Manual import must use user-provided URLs and user-entered/reviewed fields. It must not fetch Indeed or Glassdoor pages unless a future legal review and source policy explicitly allow a specific non-prohibited method.

Sprint 2 must not include email ingestion, LLM drafting, ATS integrations, browser extension work, resume upload, recruiter messaging, application automation, or screening-answer workflows.

## Local development

Prerequisites:

- Node.js 20+
- npm 10+
- Docker Desktop or compatible Docker runtime

Current setup:

```bash
cp .env.example .env
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

### Local-only dev auth

Dev auth is disabled by default. To use local protected routes during development, set:

```bash
ALLOW_DEV_AUTH=true
```

Then pass a local auth header:

```bash
x-dev-user-id: dev_user_1
```

`/auth/dev-login` is unavailable in production and unavailable outside production unless `ALLOW_DEV_AUTH=true`.

### Local-only audit listing

Global audit listing is never public. For local debugging only, set:

```bash
ALLOW_DEV_AUDIT=true
```

Then call `GET /audit/events` with both:

```bash
x-dev-user-id: admin_user
x-dev-admin: true
```

## Validation commands

```bash
cp .env.example .env
npm ci
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
bash scripts/check-product-boundary.sh
npm run typecheck
npm run lint
npm test
```

API defaults to port `4000`.

## Useful API routes

- `GET /health`
- `POST /auth/dev-login` local-only, disabled by default
- `POST /consents` protected
- `DELETE /consents/:consentType` protected
- `GET /source-policies` protected
- `POST /jobs/import/link` protected
- `POST /privacy/export` protected audited stub, returns `501`
- `POST /privacy/delete` protected audited stub, returns `501`
- `GET /audit/events` local-dev admin only, disabled by default

## BMAD artifacts

- `docs/bmad/00-project-brief.md`
- `docs/bmad/01-prd.md`
- `docs/bmad/02-architecture.md`
- `docs/bmad/03-epics.md`
- `docs/bmad/04-stories.md`
- `docs/bmad/05-sprint-plan.md`
- `docs/bmad/06-compliance-guardrails.md`
- `docs/bmad/07-data-model.md`
- `docs/bmad/08-test-strategy.md`
- `docs/bmad/09-risk-register.md`

## CI status

A GitHub Actions workflow is configured at `.github/workflows/ci.yml`. It uses `npm ci`, applies committed Prisma migrations with `prisma migrate deploy`, seeds source policies, runs the product-boundary grep, typecheck, lint, and tests against a Postgres service. Sprint 1 acceptance requires the workflow to be green.

## Development rule

Every ingestion or generation feature must pass through consent, source-policy, attribution, human approval, and audit controls appropriate to its data class before it can ship.
