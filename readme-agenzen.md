# upath — AgenZen Agent Guide

> Agent-oriented project summary. Read this before working in the upath codebase.

## What Is This?

upath is a drop-in replacement for Node.js's built-in `path` module. It wraps every `path` function to normalize Windows `\` to Unix `/` in all inputs and outputs. It also adds file extension manipulation functions (`addExt`, `trimExt`, `removeExt`, `changeExt`, `defaultExt`) and safe normalization that preserves meaningful leading `./` and `//` (UNC paths).

**Users:** Any Node.js developer who needs cross-platform path consistency. ~millions of weekly npm downloads.

**Zero runtime dependencies** — only built-in `path`.

## Architecture

### Core Pattern: Proxy Wrapper

The entire library is one file (`source/code/upath.coffee`) using a single pattern:

1. Iterate over all properties of Node's `path`
2. For functions: wrap them to convert `\` → `/` on string args (pre-process) and on results (post-process)
3. For non-functions: copy as-is (except `sep`, forced to `'/'`)

The `toUnix()` helper does the actual conversion: replace `\` with `/`, then consolidate consecutive slashes — but preserve leading `//` for UNC paths via negative lookbehind: `/(?<!^)\/+/g`.

### Extension Functions

Built on top of the proxy:
- `isValidExt()` — internal helper checking extension length (max 7 chars) and ignore lists
- `trimExt()` → `removeExt()` → `changeExt()` → `defaultExt()` — each composes on the previous
- `addExt()` — standalone, just appends if not already present

### File Map

| File | Role | Edit? |
|------|------|-------|
| `source/code/upath.coffee` | **Main source** — all logic | YES |
| `source/spec/upath-spec.coffee` | **Tests + docs** — specs auto-generate README | YES |
| `source/spec/specHelpers.coffee` | Test assertion helpers (Chai + uberscore wrappers) | Rarely |
| `build/code/upath.js` | Compiled output — **never edit directly** | NO |
| `build/spec/*.js` | Compiled tests — **never edit directly** | NO |
| `upath.d.ts` | Hand-maintained TypeScript declarations | YES (if API changes) |
| `Gruntfile.coffee` | Build config (uRequire + Grunt) | Rarely |
| `readme.md` | Auto-generated from specs — **do not hand-edit** | NO |

### Key Gotchas

1. **CoffeeScript source, JS build** — all edits go in `source/`, then compile with `npx grunt lib`
2. **TypeScript declarations are hand-maintained** — if you change the API in `upath.coffee`, you MUST update `upath.d.ts` manually
3. **README is auto-generated** — never edit `readme.md` directly; change the specs instead
4. **UNC path preservation** — the negative lookbehind regex `(?<!^)` is critical; don't simplify it or you'll break `//server/share` paths
5. **DRAFT/ directory is gitignored** — contains orphaned experimental code (a debounce utility), not part of the project

## Development Commands

```bash
npm install              # Install devDependencies (Grunt, CoffeeScript, Mocha, etc.)
npm run dev              # Build + watch specs (npx grunt dev)
npm test                 # Full build + test (npx grunt)
npm run build            # Build library only (npx grunt lib)
```

## Testing

- Framework: Mocha + Chai (via uRequire spec runner)
- Specs in CoffeeScript: `source/spec/upath-spec.coffee`
- Pattern: `inputToExpected` objects map inputs → expected results
- Specs are living documentation — test descriptions become README content
- Custom assertion helpers in `specHelpers.coffee` use uberscore for deep comparison

## Conventions

- **CoffeeScript** — not TypeScript. The project predates TS adoption.
- **No linter** — CoffeeScript era, no ESLint/Prettier configured
- **CommonJS** — compiled output is CJS (`module.exports`), supports Node >=4
- **Test naming** — specs use `-spec.coffee` suffix (hyphenated, not dotted)
- **No CI** — Travis CI config exists but the service is defunct; tests run locally

## Integration with AgenZen

- **Task prefix:** `UP`
- **Backlog:** `project-management/0-backlog/backlog.md`
- **Divergences:** CoffeeScript, Grunt, Mocha (vs AZ standard TypeScript/Jest)
- **No @todos in codebase** — clean as of 2026-03-11 harvest
