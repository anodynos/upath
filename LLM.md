# upath

A drop-in replacement for Node.js's built-in `path` module that normalizes all path separators to Unix-style forward slashes (`/`). It wraps every `path` function so that Windows backslashes are automatically converted in both inputs and outputs. Additionally, it provides file extension manipulation functions (`addExt`, `trimExt`, `removeExt`, `changeExt`, `defaultExt`) and safe normalization variants that preserve meaningful leading `./` and UNC path prefixes (`//`).

upath has zero runtime dependencies — it only requires Node's built-in `path` module. It requires Node.js >= 20 and ships with auto-generated TypeScript declarations.

## Key Technologies

- **Language:** TypeScript
- **Build:** tsup (dual CJS + ESM output)
- **Testing:** Jest + ts-jest, custom doc-generating reporter
- **Types:** Auto-generated from source
- **Runtime deps:** None

## Directory Structure

```
src/
  index.ts                        # Main source (single file, all logic)
  __tests__/
    upath.test.ts                 # Core proxy tests
    safe.test.ts                  # normalizeSafe, normalizeTrim, joinSafe tests
    extensions.test.ts            # addExt, trimExt, removeExt, etc. tests
    api-coverage.test.ts          # Dynamic path API completeness check
    helpers.ts                    # Test helper functions
    reporters/
      doc-reporter.ts             # Custom Jest reporter → docs/API.md
dist/                             # Build output (CJS + ESM + types)
docs/
  API.md                          # Auto-generated API reference
jest.config.ts
tsconfig.json
tsup.config.ts
package.json
readme.md
```

## Important Commands

```bash
npm install         # Install dependencies
npm run dev         # Build with watch mode
npm test            # Run all tests (142 tests)
npm run build       # One-shot build (dist/)
npm run lint        # Type check (tsc --noEmit)
npm run test:coverage  # Tests with coverage report
```

## API Overview

**Proxied from path** (with `/` normalization): `normalize`, `join`, `resolve`, `isAbsolute`, `relative`, `dirname`, `basename`, `extname`, `parse`, `format`, `toNamespacedPath`, `matchesGlob`, `sep` (forced to `/`)

**upath-specific:**
- `toUnix(path)` — convert `\` to `/`, consolidate duplicates
- `normalizeSafe(path)` — normalize preserving leading `./` and `//`
- `normalizeTrim(path)` — normalizeSafe + trim trailing `/`
- `joinSafe(...paths)` — join preserving leading `./` and `//`
- `addExt(file, ext)` — add extension if not already present
- `trimExt(file, ignoreExts?, maxSize?)` — remove file extension
- `removeExt(file, ext)` — remove specific extension
- `changeExt(file, ext, ignoreExts?, maxSize?)` — replace extension
- `defaultExt(file, ext, ignoreExts?, maxSize?)` — add extension only if none exists
