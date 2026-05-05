#!/usr/bin/env bash
set -euo pipefail

runtime_paths="apps packages"

if grep -R -n -E "\.agents|_bmad|tools/non-product-agent-assets|tea_browser_automation" $runtime_paths; then
  echo "Product runtime code must not reference non-product agent/BMAD tooling." >&2
  exit 1
fi

pattern="playwright|browser automation|headless|captcha|anti-bot|credential_collection|cookie_session_replay|session replay|auto_apply|auto-message|auto_message|auto_save_on_platform|screening_answer_automation"
offending=$(grep -R -n -i -E "$pattern" $runtime_paths || true)

if [ -n "$offending" ]; then
  allowed=$(printf "%s\n" "$offending" | grep -E "^(packages/shared/src/compliance\.ts|apps/api/tests/|apps/api/prisma/schema\.prisma|apps/api/prisma/migrations/)" || true)
  all_count=$(printf "%s\n" "$offending" | grep -c . || true)
  allowed_count=$(printf "%s\n" "$allowed" | grep -c . || true)
  if [ "$all_count" != "$allowed_count" ]; then
    echo "Product runtime code must not reference prohibited automation or browser tooling terms outside explicit guardrails/tests/schema." >&2
    printf "%s\n" "$offending" >&2
    exit 1
  fi
fi

echo "Product boundary grep passed."
