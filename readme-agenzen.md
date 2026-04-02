# upath — AgenZen Agent Guide

> Agent-oriented project summary. Read this before working in the upath codebase.

## What Is This?

upath is a drop-in replacement for Node.js's built-in `path` module. It wraps every `path` function to normalize Windows `\` to Unix `/` in all inputs and outputs. It also adds file extension manipulation functions (`addExt`, `trimExt`, `removeExt`, `changeExt`, `defaultExt`) and safe normalization that preserves meaningful leading `./` and `//` (UNC paths).

**Users:** Any Node.js developer who needs cross-platform path consistency. ~millions of weekly npm downloads.

**Zero runtime dependencies** — only built-in `path`.

## Architecture

### Core Pattern: Proxy Wrapper

The entire library is one file (`src/index.ts`) using a single pattern:

1. Iterate over all properties of Node's `path` via `Object.entries(path)`
2. For functions: wrap them to convert `\` → `/` on string args (pre-process) and on results (post-process)
3. For non-functions: copy as-is (except `sep`, forced to `'/'`)
4. `posix` and `win32` are passed through without wrapping (they're circular references)

The `toUnix()` helper does the actual conversion: replace `\` with `/`, then consolidate consecutive slashes — but preserve leading `//` for UNC paths via negative lookbehind: `/(?<!^)\/+/g`.

This dynamic proxy means **new `path` functions in future Node versions are automatically wrapped** without code changes.

### Extension Functions

Built on top of the proxy:

- `isValidExt()` — internal helper checking extension length (max 7 chars) and ignore lists
- `trimExt()` → `removeExt()` → `changeExt()` → `defaultExt()` — each composes on the previous
- `addExt()` — standalone, just appends if not already present

### File Map

| File                                      | Role                                                         | Edit?  |
| ----------------------------------------- | ------------------------------------------------------------ | ------ |
| `src/index.ts`                            | **Main source** — all logic, typed exports                   | YES    |
| `src/__tests__/upath.test.ts`             | Core proxy tests (normalize, join, parse, toUnix)            | YES    |
| `src/__tests__/safe.test.ts`              | Safe function tests (normalizeSafe, normalizeTrim, joinSafe) | YES    |
| `src/__tests__/extensions.test.ts`        | Extension function tests (addExt, trimExt, etc.)             | YES    |
| `src/__tests__/api-coverage.test.ts`      | Dynamic path API completeness check                          | YES    |
| `src/__tests__/reporters/doc-reporter.ts` | Custom Jest reporter → `docs/API.md`                         | Rarely |
| `src/__tests__/node-compat.test.ts`       | Node.js path test suite compatibility (223 tests)            | YES    |
| `docs/API.md`                             | Auto-generated from test runs — **do not hand-edit**         | NO     |
| `dist/`                                   | Build output — **never edit directly**                       | NO     |

### Key Gotchas

1. **TypeScript source, built output** — all edits go in `src/`, then build with `npx tsup`
2. **Types are auto-generated** — `dist/index.d.ts` comes from the source. No hand-maintained `.d.ts` file.
3. **`docs/API.md` is auto-generated** — never edit it directly; change the test specs instead
4. **UNC path preservation** — the negative lookbehind regex `(?<!^)` is critical; don't simplify it or you'll break `//server/share` paths
5. **Dynamic proxy** — `Object.entries(path)` at module load time. New `path` exports in future Node versions get wrapped automatically.
6. **Dual CJS/ESM** — `dist/index.cjs` and `dist/index.js`. Package uses `"type": "module"`.

## Development Commands

```bash
npm install              # Install devDependencies
npm run dev              # tsup --watch (rebuild on changes)
npm test                 # Jest (365 tests + generates docs/API.md)
npm run test:coverage    # Jest with coverage report
npm run build            # tsup (one-shot build → dist/)
npm run lint             # tsc --noEmit (type check)
```

## Testing

- Framework: Jest + ts-jest
- Pattern: `test.each` with `[input, expected]` tables (ported from CoffeeScript-era `inputToExpected` pattern)
- Custom doc reporter generates `docs/API.md` from test results
- API coverage test dynamically discovers `path` exports — catches new Node.js additions
- 365 tests, ~97% coverage

## Conventions

- **TypeScript** with strict mode
- **ESM source** (`"type": "module"` in package.json)
- **tsup** for dual CJS/ESM build
- **Jest** for testing
- **Node >= 20** minimum

## Integration with AgenZen

- **Task prefix:** `UP`
- **Backlog:** `project-management/0-backlog/backlog.md`
- **No @todos in codebase** — clean as of 2026-03-11
