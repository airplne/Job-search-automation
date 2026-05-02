# 07 Data Model

## users
- Purpose: account identity.
- Fields: id, email, name, status, timezone, privacy_region, created_at, updated_at.
- Sensitive fields: email, name.
- Retention notes: delete or anonymize on account deletion.
- Indexes: unique email, status.
- Ownership rules: user owns own row; admins have restricted access.
- Audit requirements: create, status change, delete.

## user_profiles
- Purpose: confirmed candidate profile and preferences.
- Fields: id, user_id, target_titles, skills, seniority, locations, remote_preference, salary_min, sponsorship_preference, created_at, updated_at.
- Sensitive fields: sponsorship/work authorization, salary, precise location.
- Retention notes: delete with user.
- Indexes: user_id unique, target_titles, skills.
- Ownership rules: owner only.
- Audit requirements: create, update, delete.

## profile_facts
- Purpose: atomic user-confirmed facts for scoring/drafting.
- Fields: id, user_id, profile_id, fact_type, value, source_document_id, confidence, confirmed_at, rejected_at, created_at.
- Sensitive fields: all candidate facts can be sensitive.
- Retention notes: delete with user/profile/document.
- Indexes: user_id, profile_id, fact_type, confirmed_at.
- Ownership rules: owner only.
- Audit requirements: confirm, reject, edit.

## documents
- Purpose: resumes and user-uploaded documents.
- Fields: id, user_id, type, storage_uri, encrypted_sha256, mime_type, size_bytes, parser_status, created_at, deleted_at.
- Sensitive fields: storage_uri, parsed resume text, hash.
- Retention notes: delete object and row on request; raw parsed text minimized.
- Indexes: user_id, type, parser_status.
- Ownership rules: owner only.
- Audit requirements: upload, access, parse, delete.

## source_policies
- Purpose: source compliance registry.
- Fields: id, provider, acquisition_method, classification, legal_status, allowed_data, disallowed_data, retention_note, enabled, created_at, updated_at.
- Sensitive fields: none generally.
- Retention notes: retain for audit/history.
- Indexes: provider + acquisition_method unique, enabled, classification.
- Ownership rules: admin/system writes only; readable by services.
- Audit requirements: create, update, disable.

## source_events
- Purpose: provenance for every import.
- Fields: id, user_id, source_policy_id, source_type, provider, acquisition_method, source_url, external_message_id, received_at, metadata, created_at.
- Sensitive fields: email metadata, source_url may include personal tracking params.
- Retention notes: minimize raw content; delete/anonymize with user.
- Indexes: user_id, provider, source_policy_id, received_at.
- Ownership rules: owner/system only.
- Audit requirements: create, parse, blocked attempt.

## job_listings
- Purpose: source-specific job listing in user CRM.
- Fields: id, user_id, source_event_id, title, company_name, location, remote_type, salary_min, salary_max, currency, source_provider, source_url, canonical_url, description_summary, first_seen_at, created_at, updated_at.
- Sensitive fields: user notes if embedded; source URL may contain tokens and must be sanitized.
- Retention notes: delete with user or retention expiry.
- Indexes: user_id, canonical_url, company_name, title.
- Ownership rules: owner only.
- Audit requirements: create, update, delete.

## canonical_jobs
- Purpose: dedupe cluster across job listings.
- Fields: id, user_id, normalized_title, normalized_company, canonical_url, cluster_key, confidence, created_at, updated_at.
- Sensitive fields: low.
- Retention notes: derived; delete when underlying jobs deleted.
- Indexes: user_id, cluster_key, canonical_url.
- Ownership rules: owner/system only.
- Audit requirements: merge, unmerge.

## job_scores
- Purpose: fit and quality ranking outputs.
- Fields: id, user_id, job_listing_id, fit_score, quality_score, red_flags, explanation, score_version, created_at.
- Sensitive fields: profile-derived explanation.
- Retention notes: recompute/delete with job/profile.
- Indexes: user_id, job_listing_id, score_version.
- Ownership rules: owner only.
- Audit requirements: generated, invalidated.

## applications
- Purpose: user-controlled application tracker.
- Fields: id, user_id, job_listing_id, status, notes, applied_at, next_action_at, created_at, updated_at.
- Sensitive fields: notes, dates, outcomes.
- Retention notes: delete/export with user.
- Indexes: user_id, job_listing_id, status, next_action_at.
- Ownership rules: owner only.
- Audit requirements: status changes, note changes.

## generated_materials
- Purpose: resume suggestions, cover letters, future message drafts.
- Fields: id, user_id, job_listing_id, document_type, content_uri, content_text_dev, status, claims_map, model, prompt_version, approved_at, created_at.
- Sensitive fields: all content and claims.
- Retention notes: encrypt at rest; delete with user.
- Indexes: user_id, job_listing_id, status.
- Ownership rules: owner only.
- Audit requirements: generate, edit, approve, delete.

## consents
- Purpose: immutable user consent grants and revocations.
- Fields: id, user_id, consent_type, version, scope, granted_at, revoked_at, created_at.
- Sensitive fields: consent preferences.
- Retention notes: retain proof as policy permits; anonymize after deletion if required.
- Indexes: user_id, consent_type, revoked_at.
- Ownership rules: owner/admin restricted.
- Audit requirements: grant, revoke.

## audit_logs
- Purpose: accountability for sensitive/compliance actions.
- Fields: id, user_id, actor, action, target_type, target_id, metadata, created_at, ip_hash.
- Sensitive fields: metadata and ip_hash.
- Retention notes: append-only; anonymize user identifier after deletion as policy permits.
- Indexes: user_id, action, target_type, created_at.
- Ownership rules: admin restricted; user export may include relevant self events.
- Audit requirements: self-auditing by definition.

## reminders
- Purpose: user-created follow-up reminders.
- Fields: id, user_id, application_id, title, due_at, channel, status, created_at, completed_at.
- Sensitive fields: reminder titles/notes.
- Retention notes: delete with user/application.
- Indexes: user_id, due_at, status.
- Ownership rules: owner only.
- Audit requirements: create, update, complete, delete.
