# upath v3.0.0

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

## Installation

```bash
npm install upath
```

## Usage

```typescript
// ESM
import upath from 'upath';
// or import specific functions
import { normalize, joinSafe, addExt } from 'upath';

// CJS
const upath = require('upath').default;
```

### Quick examples

```typescript
upath.normalize('c:\\windows\\nodejs\\path');  // 'c:/windows/nodejs/path'
upath.join('some/nodejs\\windows', '../path'); // 'some/nodejs/path'
upath.toUnix('.//windows\\//unix//mixed////'); // './windows/unix/mixed/'

upath.addExt('myfile', '.js');           // 'myfile.js'
upath.changeExt('module.coffee', '.js'); // 'module.js'
upath.removeExt('file.js', '.js');       // 'file'
upath.defaultExt('file', '.js');         // 'file.js'
upath.trimExt('file.min.js');            // 'file.min'
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
upath.toUnix('.//windows\\//unix//mixed////'); // './windows/unix/mixed/'
```

#### `upath.normalizeSafe(path)`

Like `path.normalize()`, but preserves a leading `./` and leading `//` (UNC paths). All backslashes are converted to forward slashes.

```typescript
upath.normalizeSafe('./path/../dep');       // './dep'  (path.normalize gives 'dep')
upath.normalizeSafe('//server/share/file'); // '//server/share/file'
```

#### `upath.normalizeTrim(path)`

Like `normalizeSafe()`, but trims any trailing `/`.

```typescript
upath.normalizeTrim('./../dep/'); // '../dep'
```

#### `upath.joinSafe([path1][, path2][, ...])`

Like `path.join()`, but preserves a leading `./` and `//`.

```typescript
upath.joinSafe('./some/local/unix/', '../path');       // './some/local/path'
upath.joinSafe('//server/share/file', '../path');      // '//server/share/path'
```

#### `upath.addExt(filename, [ext])`

Adds `.ext` to `filename`, but only if it doesn't already have the exact extension.

```typescript
upath.addExt('myfile', '.js');     // 'myfile.js'
upath.addExt('myfile.js', '.js');  // 'myfile.js' (unchanged)
upath.addExt('myfile.txt', '.js'); // 'myfile.txt.js'
```

#### `upath.trimExt(filename, [ignoreExts], [maxSize=7])`

Trims a filename's extension. Extensions longer than `maxSize` chars (including the dot) are not considered valid. Extensions listed in `ignoreExts` are not trimmed.

```typescript
upath.trimExt('my/file.min.js');                      // 'my/file.min'
upath.trimExt('my/file.min', ['min'], 8);              // 'my/file.min' (ignored)
```

#### `upath.removeExt(filename, ext)`

Removes the specific `ext` from `filename`, if present.

```typescript
upath.removeExt('file.js', '.js');  // 'file'
upath.removeExt('file.txt', '.js'); // 'file.txt' (unchanged)
```

#### `upath.changeExt(filename, [ext], [ignoreExts], [maxSize=7])`

Changes a filename's extension to `ext`. If it has no valid extension, the new extension is added. Extensions in `ignoreExts` are not replaced.

```typescript
upath.changeExt('module.coffee', '.js');                    // 'module.js'
upath.changeExt('file.min', '.js', ['min'], 8);             // 'file.min.js'
```

#### `upath.defaultExt(filename, [ext], [ignoreExts], [maxSize=7])`

Adds `.ext` to `filename` only if it doesn't already have any valid extension. Extensions in `ignoreExts` are treated as if absent, so the default extension is added.

```typescript
upath.defaultExt('file', '.js');          // 'file.js'
upath.defaultExt('file.ts', '.js');       // 'file.ts' (already has extension)
upath.defaultExt('file.min', '.js', ['min'], 8); // 'file.min.js' (.min ignored)
```

## License

Copyright(c) 2014-2020 Angelos Pikoulas (agelos.pikoulas@gmail.com)

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
