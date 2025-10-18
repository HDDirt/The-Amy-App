#!/usr/bin/env bash
set -euo pipefail

# Common heavy paths to remove (relative to repo root)
TARGETS=(
  "node_modules"
  ".cache"
  ".parcel-cache"
  "dist"
  "build"
  ".next"
  ".nuxt"
  "coverage"
  ".nyc_output"
  "out"
  "tmp"
  "logs"
)

DRY_RUN=false
FORCE=false

usage() {
  echo "Usage: $0 [--dry-run] [--yes]"
  echo "  --dry-run   Show what would be removed"
  echo "  --yes       Don't ask for confirmation"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --yes) FORCE=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown arg: $1"; usage ;;
  esac
done

echo "Repository root: $(pwd)"
echo
echo "Targets checked:"
for p in "${TARGETS[@]}"; do
  if [ -e "$p" ]; then
    echo "  [FOUND] $p"
  else
    echo "  [MISS ] $p"
  fi
done

echo
if [ "$DRY_RUN" = true ]; then
  echo "Dry run: no files will be removed."
  exit 0
fi

if [ "$FORCE" = false ]; then
  read -r -p "Proceed to remove the FOUND targets above? (type 'yes' to proceed): " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted by user."
    exit 1
  fi
fi

echo "Removing targets..."
for p in "${TARGETS[@]}"; do
  if [ -e "$p" ]; then
    echo "  rm -rf $p"
    rm -rf "$p"
  fi
done

echo "Cleaning package manager caches (npm/yarn) if present..."
if command -v npm >/dev/null 2>&1; then
  echo "  npm cache verify (best-effort)"
  npm cache verify || true
fi
if command -v yarn >/dev/null 2>&1; then
  echo "  yarn cache clean --all (best-effort)"
  yarn cache clean --all || true
fi

echo "Optional: to free Docker space, run 'docker system prune -af' on the host if desired."
echo "Done."
