#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Sync deploy/.env.prod to service env files.

Usage:
  ./deploy/sync-prod-env.sh [--source <path>] [--mode symlink|copy] [--dry-run]

Options:
  --source <path>   Source env file (default: deploy/.env.prod)
  --mode <mode>     symlink (default) or copy
  --dry-run         Print actions without changing files
  -h, --help        Show this help

Examples:
  ./deploy/sync-prod-env.sh
  ./deploy/sync-prod-env.sh --mode copy
  ./deploy/sync-prod-env.sh --source /opt/secrets/.env.prod --dry-run
EOF
}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_ENV="$ROOT_DIR/deploy/.env.prod"
MODE="symlink"
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE_ENV="$2"
      shift 2
      ;;
    --mode)
      MODE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "symlink" && "$MODE" != "copy" ]]; then
  echo "Invalid mode: $MODE (use symlink or copy)" >&2
  exit 1
fi

if [[ ! -f "$SOURCE_ENV" ]]; then
  echo "Source env not found: $SOURCE_ENV" >&2
  exit 1
fi

if [[ "$SOURCE_ENV" != /* ]]; then
  SOURCE_ENV="$(cd "$ROOT_DIR" && realpath "$SOURCE_ENV")"
fi

TARGETS=(
  "$ROOT_DIR/track-api/.env"
  "$ROOT_DIR/track-tcp/.env"
  "$ROOT_DIR/tracker-simulator/.env"
)

timestamp="$(date +%Y%m%d%H%M%S)"

run_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] $*"
  else
    eval "$@"
  fi
}

backup_if_needed() {
  local target="$1"
  if [[ -e "$target" || -L "$target" ]]; then
    local backup="${target}.bak.${timestamp}"
    run_cmd "cp -a \"$target\" \"$backup\""
  fi
}

echo "Source: $SOURCE_ENV"
echo "Mode:   $MODE"
echo "Targets:"
for target in "${TARGETS[@]}"; do
  echo "  - $target"
done

for target in "${TARGETS[@]}"; do
  run_cmd "mkdir -p \"$(dirname "$target")\""
  backup_if_needed "$target"

  if [[ "$MODE" == "symlink" ]]; then
    run_cmd "ln -sfn \"$SOURCE_ENV\" \"$target\""
  else
    run_cmd "cp \"$SOURCE_ENV\" \"$target\""
  fi
done

if [[ "$DRY_RUN" == "true" ]]; then
  echo "Done (dry-run)."
else
  echo "Done."
fi
