# Non-product agent assets

These files are not product runtime code and are not part of the job-search copilot application.

They must not be used to implement product browser automation, scraping, headless browsing, platform state changes, credential/cookie/session handling, CAPTCHA handling, or anti-bot flows.

They do not authorize Indeed, Glassdoor, or any other third-party job-platform automation.

Product code must enforce the compliance guardrails in `packages/shared/src/compliance.ts` and must not depend on files under `.agents/`.
