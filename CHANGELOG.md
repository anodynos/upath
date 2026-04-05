# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [3.0.0] - 2026-04-05

### Breaking Changes

- **Node >= 20 required** — dropped support for Node 4–18. Update your CI matrix and `engines` field.
- **CJS exports now include `__esModule` and `default` properties** — `require('upath')` still works for all standard usage (no `.default` needed). However, `Object.keys(require('upath'))` now includes `"__esModule"` and `"default"`. Bundlers using Babel-style interop (`mod.__esModule ? mod.default : mod`) will resolve to `.default`, which IS the full upath object, so it works correctly.
- **TypeScript type params narrowed** — `join(...paths: any[])` → `join(...paths: string[])`, same for `resolve` and `joinSafe`. If you pass non-string args, add explicit casts: `join(myVar as string)`.
- **`_makeLong` removed from top-level exports** — this was a deprecated Node.js internal. Use `toNamespacedPath` instead (available in upath v2+ and Node.js 8.3+).
- **Boxed `String` objects no longer accepted** — `new String('foo')` is rejected; use plain string primitives. This is unlikely to affect anyone.

### Added

- **TypeScript rewrite** — full type safety, source-of-truth types shipped with the package.
- **Dual CJS/ESM** — `import` and `require()` both work via package.json `exports`.
- **Named ESM imports** — `import { normalize, join, toUnix } from 'upath'`.
- **`matchesGlob`** typed export (wraps Node 22+ `path.matchesGlob`).
- **`toNamespacedPath`** typed export.
- **`UPath` interface** exported for TypeScript consumers.
- **Auto-generated API docs** — `docs/API.md` built from test suite.

### Changed

- Source rewritten from CoffeeScript/JavaScript to TypeScript.
- Build toolchain changed to tsup (dual CJS + ESM output).
- Test framework changed to Jest with ts-jest.

[3.0.0]: https://github.com/anodynos/upath/releases/tag/v3.0.0
