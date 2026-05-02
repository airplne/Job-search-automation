# 04 Stories

## P0 user stories

### US-001 Accept privacy and product boundaries
- Epic: E1
- User story: As a job seeker, I want to review and accept privacy and product boundaries so I understand what data is used and what the product will not do.
- Priority: P0
- Complexity: M
- Dependencies: US-004
- Compliance class: Safe with explicit user consent
- Acceptance criteria: consent text is shown before ingestion; prohibited automation is explicit; accepted consent version is stored; declined users cannot ingest data.
- Gherkin: Given I am new, when I open onboarding, then I must accept current terms before importing jobs or uploading documents.
- Test cases: accept, decline, version change, missing consent blocks import.
- Telemetry/events: `consent_viewed`, `consent_accepted`, `consent_declined`.
- Failure states: consent store unavailable; stale consent version.
- Open questions: final legal copy and version cadence.

### US-002 Revoke consent
- Epic: E1
- User story: As a job seeker, I want to revoke consent so processing stops.
- Priority: P0
- Complexity: M
- Dependencies: US-001
- Compliance class: Safe for MVP
- Acceptance criteria: revoked consent records `revoked_at`; dependent ingestion stops; audit log is written.
- Gherkin: Given I have consented, when I revoke consent, then future sensitive actions are blocked.
- Test cases: revoke active consent, revoke missing consent, import after revoke.
- Telemetry/events: `consent_revoked`.
- Failure states: partial revoke; audit failure.
- Open questions: whether some consents are required for account operation.

### US-003 Register allowed source types
- Epic: E17
- User story: As an operator, I want source rules so ingestion is blocked unless approved.
- Priority: P0
- Complexity: M
- Dependencies: database, audit
- Compliance class: Safe for MVP
- Acceptance criteria: sources default disabled; blocked decisions are audited; manual_user_link and csv_upload can be enabled for MVP.
- Gherkin: Given a disabled source, when ingestion is attempted, then no source event or job is created.
- Test cases: allowed manual source, disabled source, legal-review source, do-not-build source.
- Telemetry/events: `source_policy_checked`, `source_blocked`, `source_allowed`.
- Failure states: policy missing; source classification unknown.
- Open questions: admin approval workflow.

### US-004 Create account
- Epic: E2
- User story: As a job seeker, I want to create an account so my data is private to me.
- Priority: P0
- Complexity: M
- Dependencies: auth skeleton
- Compliance class: Safe for MVP
- Acceptance criteria: user record has unique email; sessions are replaceable; owner checks are used by user APIs.
- Gherkin: Given I submit a unique email, when signup succeeds, then I have a user workspace.
- Test cases: duplicate email, invalid email, owner-only query.
- Telemetry/events: `user_created`, `login_succeeded`, `login_failed`.
- Failure states: duplicate account; auth provider unavailable.
- Open questions: password auth vs external provider for beta.

### US-005 Upload resume
- Epic: E3
- User story: As a job seeker, I want to upload a resume so the system can build my profile.
- Priority: P0
- Complexity: L
- Dependencies: consent, storage
- Compliance class: Safe with explicit user consent
- Acceptance criteria: file type/size validation; encrypted storage plan; document row created; parsing deferred or stubbed; audit event written.
- Gherkin: Given I consented, when I upload a supported resume, then it is stored as my document and queued for parsing.
- Test cases: PDF, DOCX, oversized, unsupported type, no consent.
- Telemetry/events: `document_uploaded`, `document_rejected`, `resume_parse_queued`.
- Failure states: scan failure; storage failure.
- Open questions: object storage/KMS provider and max file size.

### US-006 Confirm extracted profile
- Epic: E3
- User story: As a job seeker, I want to confirm extracted facts so incorrect claims are not used.
- Priority: P0
- Complexity: M
- Dependencies: US-005
- Compliance class: Safe for MVP
- Acceptance criteria: unconfirmed facts are excluded from drafting/scoring; edits are audited.
- Gherkin: Given extracted facts, when I confirm only some facts, then only confirmed facts are active.
- Test cases: incorrect title, missing skill, duplicate fact, unsupported claim.
- Telemetry/events: `profile_fact_confirmed`, `profile_fact_rejected`.
- Failure states: stale extraction; conflicting facts.
- Open questions: confirmation granularity.

### US-007 Set job preferences
- Epic: E4
- User story: As a job seeker, I want job preferences so jobs can be ranked usefully.
- Priority: P0
- Complexity: M
- Dependencies: profile
- Compliance class: Safe for MVP
- Acceptance criteria: stores roles, locations, remote preference, salary target; does not collect protected-class fields for scoring.
- Gherkin: Given I save preferences, when scoring runs later, then only allowed fields are used.
- Test cases: valid preferences, forbidden field rejected, empty preferences.
- Telemetry/events: `preferences_updated`.
- Failure states: validation error; unsupported preference.
- Open questions: salary hide vs demote behavior.

### US-008 Import job by link
- Epic: E5
- User story: As a job seeker, I want to paste a job URL so I can track jobs I find manually.
- Priority: P0
- Complexity: M
- Dependencies: US-001, US-003
- Compliance class: Safe for MVP
- Acceptance criteria: checks consent and source policy; never scrapes prohibited sources; creates source event and reviewable job fields; user can manually enter missing fields.
- Gherkin: Given an allowed manual source, when I paste a URL, then a source-attributed job draft is created.
- Test cases: valid URL, invalid URL, disabled provider, Indeed/Glassdoor blocked for fetching, duplicate URL.
- Telemetry/events: `manual_link_submitted`, `manual_import_created`, `manual_import_blocked`.
- Failure states: URL parse failure; blocked source.
- Open questions: legal decision on metadata fetch per source.

### US-009 View normalized job card
- Epic: E7
- User story: As a job seeker, I want a normalized job card so I can verify imported job data.
- Priority: P0
- Complexity: M
- Dependencies: US-008
- Compliance class: Safe for MVP
- Acceptance criteria: shows title, company, location, source, URL, status, missing-field flags; editable by owner.
- Gherkin: Given a saved job, when I view it, then I see source attribution and normalized fields.
- Test cases: missing salary, missing location, remote ambiguity.
- Telemetry/events: `job_card_viewed`, `job_fields_updated`.
- Failure states: missing source attribution blocks display save.
- Open questions: card vs list default.

### US-010 Track application status
- Epic: E11
- User story: As a job seeker, I want to update status so I know where each application stands.
- Priority: P0
- Complexity: M
- Dependencies: US-009
- Compliance class: Safe for MVP
- Acceptance criteria: user-controlled status transitions; timeline/audit event captures old/new status.
- Gherkin: Given a saved job, when I mark it applied, then the application status is updated and audited.
- Test cases: saved to applied, applied to interviewing, undo, invalid job owner.
- Telemetry/events: `application_status_changed`.
- Failure states: unauthorized update; invalid status.
- Open questions: strict vs flexible pipeline.

### US-011 Approve generated material
- Epic: E14
- User story: As a job seeker, I want to approve drafts explicitly so nothing is final without me.
- Priority: P0
- Complexity: M
- Dependencies: generated_materials table, audit
- Compliance class: Safe with approval
- Acceptance criteria: generated material starts as draft; approval is explicit and audited; no send/submit endpoint exists.
- Gherkin: Given a generated draft, when I approve it, then approval metadata is stored but nothing is sent.
- Test cases: approve draft, approve non-owner draft, approve missing claims map later.
- Telemetry/events: `material_approved`.
- Failure states: immutable approval conflict.
- Open questions: approval language.

### US-012 Delete account/data
- Epic: E18
- User story: As a job seeker, I want to delete my data so I can exercise privacy control.
- Priority: P0
- Complexity: L
- Dependencies: all stores
- Compliance class: Safe for MVP
- Acceptance criteria: deletes or anonymizes user-owned data; revokes tokens later; writes deletion audit event.
- Gherkin: Given I confirm deletion, when deletion completes, then my user-owned records are gone or anonymized per policy.
- Test cases: full delete, partial failure, queued jobs, audit anonymization.
- Telemetry/events: `deletion_requested`, `deletion_completed`, `deletion_failed`.
- Failure states: storage delete failed; retry required.
- Open questions: audit retention policy.

### US-013 Export user data
- Epic: E18
- User story: As a job seeker, I want to export my data so I can leave with my records.
- Priority: P0
- Complexity: M
- Dependencies: all stores
- Compliance class: Safe for MVP
- Acceptance criteria: export includes profile, jobs, applications, consents, source events, generated materials metadata; signed URL later.
- Gherkin: Given I request export, when processing completes, then I receive machine-readable data.
- Test cases: empty account, populated account, large account.
- Telemetry/events: `export_requested`, `export_completed`.
- Failure states: timeout; missing store.
- Open questions: export SLA and format.

### US-014 Monitor compliance violations
- Epic: E19
- User story: As an operator, I want alerts on disallowed ingestion so issues stop quickly.
- Priority: P0
- Complexity: M
- Dependencies: source registry, audit
- Compliance class: Safe for MVP
- Acceptance criteria: blocked actions create audit records; tests fail if prohibited providers/methods become allowed without policy update.
- Gherkin: Given an attempted prohibited action, when the guardrail blocks it, then an audit event exists.
- Test cases: Indeed scrape attempt, Glassdoor bulk content attempt, auto-apply attempt, disabled source.
- Telemetry/events: `compliance_violation_detected`.
- Failure states: alert sink unavailable; audit writer unavailable.
- Open questions: alerting provider.

## P1/P2/later story seeds
US-015 Gmail connect, US-016 email scope configuration, US-017 Indeed alert fixture parsing, US-018 Glassdoor alert fixture parsing, US-019 duplicate detection, US-020 ranked list, US-021 score explanation, US-022 red flags, US-023 resume suggestions, US-024 cover-letter draft, US-025 follow-up reminder, US-026 Greenhouse connector, US-027 Lever connector, US-028 Ashby connector, US-029 USAJOBS connector, US-030 Adzuna connector, US-031 browser extension manual capture, US-032 extension review before save, US-033 follow-up message draft, US-034 feedback-trained scoring, US-035 email-based application confirmation parsing.
