# Job-search-automation

Compliance-first job-search copilot and application CRM.

This project is intentionally manual-first and consent-first. It helps users collect job opportunities from permitted, user-controlled sources, normalize job cards, track applications, and later draft human-approved materials. It does not operate as a bot on Indeed, Glassdoor, or other third-party platforms.

## Current repository status

The repo was greenfield and has been initialized as a TypeScript monorepo:

```text
/
  docs/bmad/              BMAD planning artifacts
  apps/api/               Express + TypeScript API skeleton
  apps/web/               Next.js shell
  packages/shared/        Shared compliance and domain utilities
  docker-compose.yml      Local Postgres
  .env.example            Local environment template
```

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

## Safe P0 MVP slice

The first implementation establishes:

- Auth skeleton with dev-friendly login route
- Consent grant/revoke flow
- Deny-by-default source policy guardrails
- Manual job link import behind consent and source-policy checks
- Source-attributed normalized job shape
- Application tracker data model
- Audit log abstraction
- Prisma schema for P0 entities
- Compliance guardrail tests
- BMAD planning docs under `docs/bmad/`

## Local development

Prerequisites:

- Node.js 20+
- npm 10+
- Docker Desktop or compatible Docker runtime

Setup:

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run dev
```

Run tests:

```bash
npm test
```

Run type checks:

```bash
npm run typecheck
```

API defaults to port `4000`.

## Useful API routes

- `GET /health`
- `POST /auth/dev-login`
- `POST /consents`
- `DELETE /consents/:userId/:consentType`
- `GET /source-policies`
- `POST /jobs/import/link`
- `GET /audit/events`

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

## Development rule

Every ingestion or generation feature must pass through consent, source-policy, attribution, human-approval, and audit controls appropriate to its data class before it can ship.
