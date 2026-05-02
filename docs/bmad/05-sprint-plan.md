# 05 Sprint Plan

## Sprint 1: Compliance and data foundation
- Goal: Establish the compliant skeleton: auth, consent, source registry, audit logs.
- Stories: US-001, US-002, US-003, US-004, US-014.
- Engineering tasks: create TypeScript API workspace; add Prisma schema; implement dev auth route; implement consent model; implement source policy checks; implement audit writer; add compliance tests.
- Design tasks: onboarding consent screen, prohibited automation disclosure, empty dashboard shell.
- Compliance tasks: draft consent copy, define source classification taxonomy, seed blocked providers.
- Test tasks: auth tests, consent-blocking tests, source guardrail tests, audit event tests.
- Demo outcome: user is created, consent is accepted/revoked, disabled or prohibited source blocks import.
- Risks and mitigations: legal copy delay -> use placeholder copy clearly marked for legal review; auth overbuild -> keep replaceable dev auth.

## Sprint 2: Core CRM and manual import
- Goal: User can manually import and track jobs.
- Stories: US-008, US-009, US-010, US-012, US-013.
- Engineering tasks: job schema, source events, manual link import, job review fields, application statuses, export/delete service scaffolding.
- Design tasks: link import form, job card, CRM list/board, status menu, export/delete settings screen.
- Compliance tasks: source attribution requirements, blocked-source copy, manual fallback policy.
- Test tasks: manual link fixture, disabled policy fixture, status transition tests, export/delete skeleton tests.
- Demo outcome: paste URL -> source policy check -> review/edit job -> save -> move through pipeline.
- Risks and mitigations: page extraction ambiguity -> manual field entry first, fetching only after source approval.

## Sprint 3: Resume/profile/preferences
- Goal: User can upload resume, confirm profile facts, and save preferences.
- Stories: US-005, US-006, US-007.
- Engineering tasks: document upload abstraction, storage interface, resume parser placeholder, profile facts, preferences validation.
- Design tasks: upload screen, extracted-fact review UI, preferences form.
- Compliance tasks: resume retention copy, encryption requirements, no protected-class scoring fields.
- Test tasks: supported file fixtures, oversize/unsupported file, confirmation-only profile facts, forbidden preference fields.
- Demo outcome: resume upload creates document record; facts are reviewed before activation; preferences save.
- Risks and mitigations: hallucinated extraction -> all extracted facts are unconfirmed until user approval.

## Sprint 4: Normalization, dedupe v1, scoring v1
- Goal: Jobs are normalized, conservatively deduped, and ranked with transparent reasons.
- Stories: US-019, US-020, US-021, US-022.
- Engineering tasks: normalized job fields, URL canonicalizer, conservative dedupe rules, rule-based scoring, score explanation JSON, red-flag detector.
- Design tasks: ranked list, explanation drawer, red-flag chips, undo merge UI.
- Compliance tasks: bias review for scoring fields, no protected-class inputs, score version audit.
- Test tasks: duplicate job fixture, missing salary/location fixture, remote/hybrid ambiguity fixture, scam/low-quality fixture, scoring regression tests.
- Demo outcome: imported jobs show canonical grouping, fit score, red flags, and explanation.
- Risks and mitigations: poor score trust -> rules-first scoring and editable assumptions.
