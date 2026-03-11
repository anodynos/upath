# upath

> A drop-in replacement / proxy to Node.js `path` that replaces `\` with `/` for all results, supports UNC paths, and adds file extension manipulation functions.

## Project Identity

- **Name:** upath
- **Task ID Prefix:** UP
- **Version:** 3.0.0
- **Author:** Angelos Pikoulas (anodynos)
- **License:** MIT
- **npm:** [upath](https://www.npmjs.com/package/upath)
- **GitHub:** [anodynos/upath](https://github.com/anodynos/upath)

## Tech Stack

- **Language:** TypeScript
- **Build:** tsup (dual CJS + ESM output)
- **Testing:** Jest (ts-jest) with custom doc-generating reporter
- **Runtime deps:** None (only built-in `path`)
- **Node support:** >= 20
- **Types:** Auto-generated from source (`dist/index.d.ts`)

## Development

```bash
npm install
npm run dev            # tsup --watch (rebuild on changes)
npm run build          # tsup (one-shot build)
npm run lint           # tsc --noEmit (type check only)
```

## Testing

```bash
npm test               # jest (runs all tests)
npm run test:coverage  # jest --coverage
```

- 365 tests across 5 test files
- Framework: Jest with `test.each` table-driven patterns
- Custom doc reporter auto-generates `docs/API.md` from test results
- Dynamic API coverage test discovers `path` exports at runtime — catches new Node.js additions

## Build & Deploy

```bash
npm run build          # produces dist/index.cjs, dist/index.js, dist/index.d.ts
```

- Published to npm as `upath`
- Dual output: CJS (`dist/index.cjs`) + ESM (`dist/index.js`)
- Types auto-generated alongside build output
- `prepublishOnly` runs build automatically

## Code Conventions

- TypeScript source in `src/`, compiled output in `dist/` — never edit `dist/` directly
- Tests are the source of truth for behavior documentation (doc reporter generates `docs/API.md`)
- Dynamic proxy pattern: iterates over `path` at runtime, wraps all functions
- UNC path regex `(?<!^)\/+` is critical — do not simplify
