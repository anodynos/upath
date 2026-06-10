#!/usr/bin/env bash
# corpus-empty-guard — blocks commits that GUT tracked files (AZ-1755 / AZ-1756).
#
# A tracked file going "non-empty in HEAD → effectively empty staged" (zero bytes OR
# whitespace-only) is the signature of a faulty bulk tool — a SIGTERM'd `remark --output`
# truncated 736 tracked files to 0 bytes on AgenZen main and the gutting got committed as a
# benign "style:" commit. No honest edit empties a file — emptying is `git rm` territory.
#
# Wired from .husky/pre-commit AND .husky/pre-merge-commit (merge commits do NOT run
# pre-commit — git ≥ 2.24; without the second hook the guard misses merge ingress).
# FAIL-CLOSED: a staged blob that cannot be read BLOCKS, never passes.
# Bypass (deliberate emptying): CORPUS_EMPTY_BYPASS=<rel-path>[,<rel-path>] (scoped) or
# CORPUS_EMPTY_BYPASS=all (disarm entirely).
#
# CANONICAL SOURCE: <AgenZen>/scripts/mounted/corpus-empty-guard.sh — the copy in each
# mounted repo MUST stay byte-identical (AgenZen's mounted-format-shim drift test enforces
# it). Pure git-plumbing twin of AgenZen's scripts/lib/corpus-guards.ts `staged` mode.
# Interpreter contract: bash (read -d ''/process substitution) — invoke via `bash <path>`.
# SEE: AZ-1755 · AZ-1756 · <AgenZen>/docs/patterns/mirror-verify-rename.pattern.mdc

if git rev-parse -q --verify HEAD >/dev/null 2>&1 && [ "${CORPUS_EMPTY_BYPASS-}" != "all" ] && [ "${CORPUS_EMPTY_BYPASS-}" != "1" ]; then
  emptied=""
  unverified=""
  while IFS= read -r -d '' f; do
    [ -n "$f" ] || continue
    case ",${CORPUS_EMPTY_BYPASS-}," in *",$f,"*) continue ;; esac
    if ! head_content=$(git cat-file -p "HEAD:$f" 2>/dev/null); then
      unverified="$unverified$f"$'\n'
      continue
    fi
    [ -z "${head_content//[[:space:]]/}" ] && continue # was already effectively empty
    if ! staged_content=$(git cat-file -p ":0:$f" 2>/dev/null); then
      unverified="$unverified$f"$'\n'
      continue
    fi
    [ -z "${staged_content//[[:space:]]/}" ] && emptied="$emptied$f"$'\n'
  done < <(git diff --cached --name-only --diff-filter=M -z HEAD)
  if [ -n "$emptied" ]; then
    echo "✖ commit BLOCKED (AZ-1755 corpus-empty guard): staged content GUTS tracked file(s):" >&2
    printf '%s' "$emptied" | sed 's/^/  /' >&2
    echo "  A formatter/codemod likely truncated these. Restore with: git checkout -- <file>" >&2
    echo "  Deliberate emptying: CORPUS_EMPTY_BYPASS=<path>[,<path>] git commit ..." >&2
    exit 1
  fi
  if [ -n "$unverified" ]; then
    echo "✖ commit BLOCKED (AZ-1755 corpus-empty guard): could not verify staged blob(s) — failing CLOSED:" >&2
    printf '%s' "$unverified" | sed 's/^/  /' >&2
    exit 1
  fi
fi

exit 0
