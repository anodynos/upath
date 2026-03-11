# upath v3.0.0 — TypeScript Rewrite Design

> Big-bang conversion from CoffeeScript to TypeScript. Strip all legacy tooling, modernize build/test, verify full `path` API coverage across Node.js versions.

## Goals

1. Convert CoffeeScript source to TypeScript (preserve all behavior)
2. Dual CJS + ESM output via tsup
3. Jest test suite with custom reporter that auto-generates API docs from test runs
4. Multi-Node-version testing to verify `path` API completeness (Node >= 20)
5. Remove all legacy tooling: CoffeeScript, Grunt, uRequire, Mocha, Chai, Travis CI

## Architecture

### Dynamic Proxy Pattern (Preserved)

The core pattern stays: iterate over `path` exports at runtime, wrap each function with `toUnix` pre/post processing. This ensures new `path` functions in future Node versions are automatically wrapped.

TypeScript types are declared statically for autocomplete/IDE support, but the runtime wrapping is dynamic.

### Extra Functions (Static)

upath-specific functions remain statically defined:
- `toUnix(p)` — backslash → forward slash, consolidate duplicates (preserve UNC `//`)
- `normalizeSafe(p)` — normalize preserving leading `./` and `//`
- `normalizeTrim(p)` — normalizeSafe + trim trailing `/`
- `joinSafe(...p)` — join preserving leading `./` and `//`
- `addExt(file, ext)` — add extension if not present
- `trimExt(filename, ignoreExts?, maxSize?)` — remove extension
- `removeExt(filename, ext)` — remove specific extension
- `changeExt(filename, ext, ignoreExts?, maxSize?)` — replace extension
- `defaultExt(filename, ext, ignoreExts?, maxSize?)` — add extension only if none exists

## Build & Package

| Aspect | Choice |
|--------|--------|
| Compiler | tsup (esbuild-based, dual output) |
| Output | `dist/index.cjs` + `dist/index.mjs` + `dist/index.d.ts` |
| Types | Auto-generated from source (replaces hand-maintained `upath.d.ts`) |
| Module | `exports` field with CJS + ESM conditions |
| Engines | `node >= 20` |
| Version | `3.0.0` |

## Testing

### Jest + Custom Doc Reporter

Test files use `test.each` with `inputToExpected` tables (mirroring the original CoffeeScript pattern):

```typescript
describe('upath.normalizeSafe', () => {
  const cases: [string, string][] = [
    ['./foo/bar',    './foo/bar'],
    ['.\\foo\\bar',  './foo/bar'],
  ];
  test.each(cases)('normalizeSafe(%s) → %s', (input, expected) => {
    expect(upath.normalizeSafe(input)).toBe(expected);
  });
});
```

Custom reporter at `src/__tests__/reporters/doc-reporter.ts`:
- Hooks into `onTestResult` / `onRunComplete`
- Extracts describe → test.each tree
- Writes `docs/API.md` with input/output tables
- CI guard: fails if generated docs differ from committed

### Multi-Node-Version Testing

**Layer 1 — Dynamic API coverage test** (every run):
- Discovers all `path` exports at runtime
- Asserts each exists in `upath` with correct type
- Auto-catches new Node `path` additions

**Layer 2 — CI matrix** (GitHub Actions):
- Node versions: 20, 22, 24
- Each runs full suite; dynamic test catches version-specific APIs

**Layer 3 — Local script** (`npm run test:all-nodes`):
- Uses Docker or npx to test across Node versions locally

## Directory Structure

```
src/
  index.ts                    # Main source
  types.ts                    # Type declarations
  __tests__/
    upath.test.ts             # Core proxy tests
    extensions.test.ts        # Extension function tests
    safe.test.ts              # normalizeSafe, normalizeTrim, joinSafe
    api-coverage.test.ts      # Dynamic path API completeness
    reporters/
      doc-reporter.ts         # Custom Jest reporter → docs/API.md
dist/                         # Build output (gitignored)
docs/
  API.md                      # Auto-generated from test runs
jest.config.ts
tsconfig.json
tsup.config.ts
package.json
```

## Deleted Artifacts

- `source/` → replaced by `src/`
- `build/` → replaced by `dist/`
- `Gruntfile.coffee`
- `upath.d.ts` → auto-generated into `dist/`
- `.travis.yml` → GitHub Actions
- `DRAFT/` → orphaned, never integrated
- All legacy devDeps: coffee-script, grunt, grunt-*, urequire*, mocha, chai, uberscore, underscore.string

## Decisions

- **Node >= 20**: current active LTS, no point supporting EOL in a major rewrite
- **tsup over tsc**: single config for dual CJS/ESM, simpler than two tsconfig files
- **Custom reporter over afterAll**: cleaner separation, tests stay as tests
- **Dynamic proxy preserved**: future-proof, auto-wraps new `path` functions
- **v3.0.0**: breaking change in module format (dual ESM/CJS), dropped Node < 20
