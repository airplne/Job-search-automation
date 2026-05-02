# 09 Risk Register

| Risk | Severity | Likelihood | Owner | Mitigation | Detection mechanism | Contingency plan |
|---|---:|---:|---|---|---|---|
| Platform compliance risk | Critical | Medium | PM + Legal | Deny-by-default registry; prohibited automation tests; code review checklist | Blocked-source events, compliance test failures | Disable source/feature and patch policy |
| Email OAuth verification risk | High | Medium | Platform Eng | Minimal scopes, verification plan, scoped query UX | OAuth review feedback, auth failures | Keep manual import and CSV path |
| Privacy/security risk | Critical | Medium | Security | Encryption, owner-only authz, PII-safe logs, deletion/export | Security tests, log scans, access audits | Incident response and feature freeze |
| Resume data breach risk | Critical | Low/Medium | Platform Eng | KMS/object encryption, signed URLs, no raw resume logs | Access logs, storage alerts | Revoke URLs, rotate keys, notify users as required |
| LLM hallucination risk | High | High | AI Eng | Claim tracing, schemas, user approval, eval fixtures | Unsupported-claim tests, user reports | Disable generation and fall back to templates |
| Misrepresentation risk | High | Medium | PM + AI Eng | No auto-submit; no screening answers; approval gates | Draft review telemetry, audits | Draft-only mode and stricter claim filters |
| Bias/fairness risk | High | Medium | AI Eng + Legal | No protected-class fields; explainable user-side scoring | Scoring audits, regression tests | Rules-only scoring and field removal |
| Parser quality risk | Medium | High | Backend Eng | Fixtures, confidence fields, manual review fallback | Parser failure metrics, user edits | Manual entry and review queue |
| Duplicate detection risk | Medium | Medium | Backend Eng | Conservative thresholds, source history, undo | Merge undo rate, duplicate reports | Disable auto-merge, review-only dedupe |
| Poor ranking quality risk | Medium | Medium | AI Eng | Rules-first scoring, explanations, feedback controls | Save/reject metrics, regression drift | Manual sorting/filtering fallback |
| Browser extension compliance risk | High | Medium | PM + Legal | Defer; strict permissions; legal/security review | Extension permission review, tests | Keep manual link import only |
| User trust risk | High | Medium | PM/Design | Transparent source attribution, explanations, privacy controls | Support tickets, churn, NPS | More manual controls and clearer copy |
| Vendor/API availability risk | Medium | Medium | Backend Eng | Connector abstraction, graceful disable | Error rates, API status | Disable connector and use manual import |
