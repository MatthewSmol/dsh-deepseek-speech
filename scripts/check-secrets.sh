#!/usr/bin/env bash
# Report files that look like they contain credentials. Never print the value.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
status=0
patterns=(
  'sk-[A-Za-z0-9]{20,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  '[0-9]{8,10}:AA[A-Za-z0-9_-]{30,}'
  '-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----'
)
for pattern in "${patterns[@]}"; do
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    case "$file" in
      ./scripts/check-secrets.sh|./.git/*) continue ;;
    esac
    echo "secret-like value: $file"
    status=1
  done < <(grep -RIlE --exclude-dir=.git --exclude='check-secrets.sh' -- "$pattern" . 2>/dev/null || true)
done
if [ "$status" -eq 0 ]; then
  echo "check-secrets: clean"
fi
exit "$status"
