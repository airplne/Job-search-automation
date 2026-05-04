#!/usr/bin/env bash
set -euo pipefail

runtime_paths="apps packages"

if grep -R -n -E "\.agents|_bmad|tools/non-product-agent-assets|tea_browser_automation" $runtime_paths; then
  echo "Product runtime code must not reference non-product agent/BMAD tooling." >&2
  exit 1
fi

if grep -R -n -i -E "playwright|browser automation|headless|captcha|anti-bot|credential_collection|cookie_session_replay|session replay|auto_apply|auto-message|auto_message|auto_save_on_platform|screening_answer_automation" $runtime_paths; then
  echo "Product runtime code must not reference prohibited automation or browser tooling terms outside compliance guardrails/tests." >&2
  echo "If a legitimate compliance guardrail test needs one of these terms, keep it in packages/shared/src/compliance.ts or apps/api/tests/* only and update this script deliberately." >&2
  offending=$(grep -R -n -i -E "playwright|browser automation|headless|captcha|anti-bot|credential_collection|cookie_session_replay|session replay|auto_apply|auto-message|auto_message|auto_save_on_platform|screening_answer_automation" $runtime_paths || true)
  allowed=$(printf "%s\n" "$offending" | grep -E "^(packages/shared/src/compliance\.ts|apps/api/tests/)" || true)
  all_count=$(printf "%s\n" "$offending" | grep -c . || true)
  allowed_count=$(printf "%s\n" "$allowed" | grep -c . || true)
  if [ "$all_count" != "$allowed_count" ]; then
    printf "%s\n" "$offending" >&2
    exit 1
  fi
fi

echo "Product boundary grep passed."
