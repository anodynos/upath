# upath v3.0.0

[![npm version](https://img.shields.io/npm/v/upath.svg)](https://www.npmjs.com/package/upath)
[![npm downloads](https://img.shields.io/npm/dw/upath.svg)](https://www.npmjs.com/package/upath)
[![CI](https://img.shields.io/github/actions/workflow/status/anodynos/upath/ci.yml?branch=master&label=CI)](https://github.com/anodynos/upath/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/node/v/upath.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](https://www.npmjs.com/package/upath)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/upath)](https://bundlephobia.com/package/upath)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/anodynos?label=Sponsors)](https://github.com/sponsors/anodynos)

A drop-in replacement / proxy to Node.js `path` that:

- Replaces the Windows `\` with the Unix `/` in all string params & results.
- Adds **filename extension** functions: `addExt`, `trimExt`, `removeExt`, `changeExt`, and `defaultExt`.
- Adds `normalizeSafe` to preserve any meaningful leading `./` or `//` (UNC paths), and `normalizeTrim` which additionally trims any trailing `/`.
- Adds `joinSafe` which works like `path.join` but preserves leading `./` and `//`.
- Provides `toUnix` to simply convert `\` to `/` and consolidate duplicates.

Written in **TypeScript** with dual **CJS/ESM** output. Zero runtime dependencies.

## What's New in v3

- **TypeScript rewrite** — full type safety, source of truth types shipped with the package.
- **Dual CJS/ESM** — works with `import` and `require()` out of the box via package.json `exports`.
- **Node >= 20** — drops legacy Node support.
- **Auto-generated API docs** — see [`docs/API.md`](docs/API.md) for complete input/output tables generated from the test suite.
- **UNC path support** — carried forward from v2, with comprehensive test coverage.

## Migrating from v2

- **Node >= 20 required** — v2 supported Node >= 4. Update your CI matrix.
- **CJS usage unchanged** — `const upath = require('upath')` works as before. All functions are available directly on the module (no `.default` needed).
- **TypeScript: stricter params** — `join()`, `resolve()`, and `joinSafe()` params narrowed from `any[]` to `string[]`. Add explicit casts if you pass non-string args: `join(myVar as string)`.
- **`_makeLong` removed** — use `toNamespacedPath` instead (available since Node 8.3).
- **Named ESM imports now available** — `import { normalize, join, toUnix } from 'upath'` works in addition to the default import.
- **Boxed `String` objects rejected** — `new String('foo')` no longer accepted; use plain string primitives.

See [CHANGELOG.md](CHANGELOG.md) for the full list of changes.

## Installation

```bash
npm install upath
```

## Usage

```typescript
// ESM
import upath from 'upath'
// or import specific functions
import { normalize, joinSafe, addExt } from 'upath'

// CJS
const upath = require('upath')
```

### Quick examples

```typescript
upath.normalize('c:\\windows\\nodejs\\path') // 'c:/windows/nodejs/path'
upath.join('some/nodejs\\windows', '../path') // 'some/nodejs/path'
upath.toUnix('.//windows\\//unix//mixed////') // './windows/unix/mixed/'

upath.addExt('myfile', '.js') // 'myfile.js'
upath.changeExt('module.coffee', '.js') // 'module.js'
upath.removeExt('file.js', '.js') // 'file'
upath.defaultExt('file', '.js') // 'file.js'
upath.trimExt('file.min.js') // 'file.min'
```

## Why?

Normal `path` doesn't convert paths to a unified format before calculating paths (`normalize`, `join`), which leads to problems:

- Running `path` on Windows yields different results than on Linux / Mac.
- If you develop on Unix/Mac and deploy to Windows (or vice versa), `path` can produce inconsistent results.
- Using Unix `/` on Windows works perfectly inside Node.js, so there's no reason to stick to the Windows `\` convention.

upath solves this by normalizing all backslashes to forward slashes in every function result.

## API

upath proxies **all** functions and properties from Node.js `path` (`basename`, `dirname`, `extname`, `format`, `isAbsolute`, `join`, `normalize`, `parse`, `relative`, `resolve`, `toNamespacedPath`, `matchesGlob`), converting any `\` in results to `/`.

Additionally, `upath.sep` is always `'/'` and `upath.VERSION` provides the package version string.

### Extra functions

Below is a summary. See [`docs/API.md`](docs/API.md) for full input/output tables.

#### `upath.toUnix(path)`

Converts all `\` to `/` and consolidates duplicate slashes, without any normalization.

```typescript
upath.toUnix('.//windows\\//unix//mixed////') // './windows/unix/mixed/'
```

#### `upath.normalizeSafe(path)`

Like `path.normalize()`, but preserves a leading `./` and leading `//` (UNC paths). All backslashes are converted to forward slashes.

```typescript
upath.normalizeSafe('./path/../dep') // './dep'  (path.normalize gives 'dep')
upath.normalizeSafe('//server/share/file') // '//server/share/file'
```

#### `upath.normalizeTrim(path)`

Like `normalizeSafe()`, but trims any trailing `/`.

```typescript
upath.normalizeTrim('./../dep/') // '../dep'
```

#### `upath.joinSafe([path1][, path2][, ...])`

Like `path.join()`, but preserves a leading `./` and `//`.

```typescript
upath.joinSafe('./some/local/unix/', '../path') // './some/local/path'
upath.joinSafe('//server/share/file', '../path') // '//server/share/path'
```

#### `upath.addExt(filename, [ext])`

Adds `.ext` to `filename`, but only if it doesn't already have the exact extension.

```typescript
upath.addExt('myfile', '.js') // 'myfile.js'
upath.addExt('myfile.js', '.js') // 'myfile.js' (unchanged)
upath.addExt('myfile.txt', '.js') // 'myfile.txt.js'
```

#### `upath.trimExt(filename, [ignoreExts], [maxSize=7])`

Trims a filename's extension. Extensions longer than `maxSize` chars (including the dot) are not considered valid. Extensions listed in `ignoreExts` are not trimmed.

```typescript
upath.trimExt('my/file.min.js') // 'my/file.min'
upath.trimExt('my/file.min', ['min'], 8) // 'my/file.min' (ignored)
```

#### `upath.removeExt(filename, ext)`

Removes the specific `ext` from `filename`, if present.

```typescript
upath.removeExt('file.js', '.js') // 'file'
upath.removeExt('file.txt', '.js') // 'file.txt' (unchanged)
```

#### `upath.changeExt(filename, [ext], [ignoreExts], [maxSize=7])`

Changes a filename's extension to `ext`. If it has no valid extension, the new extension is added. Extensions in `ignoreExts` are not replaced.

```typescript
upath.changeExt('module.coffee', '.js') // 'module.js'
upath.changeExt('file.min', '.js', ['min'], 8) // 'file.min.js'
```

#### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=7])`

Adds `.ext` to `filename` only if it doesn't already have any valid extension. Extensions in `ignoreExts` are treated as if absent, so the default extension is added.

```typescript
upath.defaultExt('file', '.js') // 'file.js'
upath.defaultExt('file.ts', '.js') // 'file.ts' (already has extension)
upath.defaultExt('file.min', '.js', ['min'], 8) // 'file.min.js' (.min ignored)
```

## Contributing

Contributions are welcome! Please open an issue or pull request on [GitHub](https://github.com/anodynos/upath).

```bash
git clone https://github.com/anodynos/upath.git
cd upath
npm install
npm test          # 421 tests
npm run test:integration  # CJS/ESM integration tests
```

## Sponsor

If upath is useful to you or your company, please consider [sponsoring](https://github.com/sponsors/anodynos) its continued maintenance.

## License

[MIT](LICENSE) -- Copyright (c) 2014-2026 [Angelos Pikoulas](https://github.com/anodynos)
