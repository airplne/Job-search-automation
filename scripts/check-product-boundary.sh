#!/usr/bin/env bash
set -euo pipefail

runtime_paths="apps packages"

if grep -R -n -E "\.agents|_bmad|tea_browser_automation" $runtime_paths; then
  echo "Product runtime code must not reference non-product agent/BMAD tooling." >&2
  exit 1
fi

if grep -R -n -i -E "playwright|browser automation" $runtime_paths; then
  echo "Product runtime code must not reference browser automation tooling." >&2
  exit 1
fi

echo "Product boundary grep passed."
