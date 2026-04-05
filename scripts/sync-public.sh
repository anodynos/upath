#!/usr/bin/env bash
#
# sync-public.sh — Sync library files from private repo to public anodynos/upath
#
# Usage: ./scripts/sync-public.sh [commit message]
#
# Copies whitelisted files from current working tree to a temporary checkout
# of the public repo, commits, and pushes.
#
# @todo(U:34 S:21 A:55 G:89 D:55 C:55): Automate via GitHub Actions on tag push

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PUBLIC_REMOTE="public"
PUBLIC_BRANCH="master"
TEMP_DIR=""

# ─── Whitelist: files/dirs that go to the public repo ─────────────
WHITELIST=(
  src/
  test/
  docs/
  .husky/
  CHANGELOG.md
  LICENSE
  readme.md
  package.json
  package-lock.json
  tsconfig.json
  tsup.config.ts
  jest.config.ts
  .editorconfig
  .gitattributes
  .gitignore
  .npmrc
  .prettierrc
)

# ─── Helpers ──────────────────────────────────────────────────────

cleanup() {
  if [[ -n "$TEMP_DIR" && -d "$TEMP_DIR" ]]; then
    rm -rf "$TEMP_DIR"
  fi
}
trap cleanup EXIT

die() { echo "ERROR: $*" >&2; exit 1; }
info() { echo "→ $*"; }

# ─── Preflight ────────────────────────────────────────────────────

cd "$REPO_ROOT"

# Verify remotes
git remote get-url "$PUBLIC_REMOTE" &>/dev/null \
  || die "Remote '$PUBLIC_REMOTE' not found. Add it: git remote add public https://github.com/anodynos/upath.git"

# Verify tests pass
info "Running tests..."
npx jest --no-coverage --silent || die "Tests failed. Fix before syncing."
npm run test:integration 2>&1 | tail -2

# Get commit message
if [[ $# -gt 0 ]]; then
  COMMIT_MSG="$*"
else
  # Default: use the latest commit message from private
  COMMIT_MSG="$(git log -1 --format='%s')"
fi

# ─── Clone public into temp dir ──────────────────────────────────

info "Cloning public repo..."
TEMP_DIR="$(mktemp -d)"
PUBLIC_URL="$(git remote get-url "$PUBLIC_REMOTE")"
git clone --branch "$PUBLIC_BRANCH" --depth 1 "$PUBLIC_URL" "$TEMP_DIR/public" 2>&1 | tail -1

# ─── Sync whitelisted files ──────────────────────────────────────

info "Syncing whitelisted files..."

# Remove everything in public (except .git) to handle deletions
find "$TEMP_DIR/public" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +

# Copy whitelisted files
for item in "${WHITELIST[@]}"; do
  src="$REPO_ROOT/$item"
  dest="$TEMP_DIR/public/$item"
  if [[ -d "$src" ]]; then
    mkdir -p "$dest"
    cp -a "$src/." "$dest/"
  elif [[ -f "$src" ]]; then
    mkdir -p "$(dirname "$dest")"
    cp -a "$src" "$dest"
  else
    echo "  WARN: $item not found in source, skipping"
  fi
done

# ─── Check for changes ───────────────────────────────────────────

cd "$TEMP_DIR/public"

if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  info "No changes to sync. Public repo is up to date."
  exit 0
fi

# ─── Verify no PM files leaked ───────────────────────────────────

info "Checking for PM file leaks..."
LEAKS="$(find . -not -path './.git/*' \( \
  -name 'CLAUDE.md' -o \
  -name 'readme-agenzen.md' -o \
  -name 'mise.toml' -o \
  -name 'llms.txt' -o \
  -path '*/project-management/*' -o \
  -path '*/.claude/*' \
\) 2>/dev/null || true)"

if [[ -n "$LEAKS" ]]; then
  die "PM files detected in sync output! Aborting.\n$LEAKS"
fi

# ─── Commit and push ─────────────────────────────────────────────

git add -A
echo ""
info "Changes to push:"
git diff --cached --stat
echo ""

git commit -m "$COMMIT_MSG

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"

info "Pushing to $PUBLIC_REMOTE/$PUBLIC_BRANCH..."
git push origin "$PUBLIC_BRANCH"

echo ""
info "Done! Public repo synced."
info "  Commit: $(git log -1 --format='%h %s')"
info "  Remote: $PUBLIC_URL"
