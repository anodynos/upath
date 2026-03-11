# upath

> A drop-in replacement for Node.js `path` that normalizes all separators to `/`, supports UNC paths, and adds file extension manipulation. Zero runtime dependencies. Node >= 20. TypeScript with dual CJS/ESM.

Use upath anywhere you would use `path`. Every `path` function is wrapped to convert `\` to `/` in both inputs and outputs. On top of that, upath adds safe normalization (preserving `./` and `//`) and extension manipulation functions.

## Instructions

- Import as `import upath from 'upath'` (ESM) or `const upath = require('upath').default` (CJS)
- Named imports also work: `import { normalize, joinSafe, addExt } from 'upath'`
- Use `upath.normalizeSafe()` instead of `upath.normalize()` when you need to preserve leading `./` or `//` (UNC paths)
- Use `upath.joinSafe()` instead of `upath.join()` when the first segment starts with `./` or `//` and you want that preserved
- Extension functions accept both `.ext` and `ext` — the dot is normalized automatically
- `upath.sep` is always `'/'` regardless of platform
- All `path.posix` and `path.win32` are available as pass-through (not wrapped)

## Proxied path functions

All of these behave identically to their `path` equivalents, but with `\` → `/` normalization:

```typescript
upath.normalize(p: string): string
upath.join(...paths: string[]): string
upath.resolve(...paths: string[]): string
upath.relative(from: string, to: string): string
upath.dirname(p: string): string
upath.basename(p: string, suffix?: string): string
upath.extname(p: string): string
upath.parse(p: string): ParsedPath
upath.format(pathObject: FormatInputPathObject): string
upath.isAbsolute(p: string): boolean
upath.toNamespacedPath(p: string): string
upath.matchesGlob(path: string, pattern: string): boolean  // Node >= 22
upath.sep  // always '/'
upath.delimiter  // platform-dependent (':' on POSIX, ';' on Windows)
```

## Extra functions

```typescript
// Convert \ to / and collapse duplicate slashes (preserves leading // for UNC)
upath.toUnix(p: string): string
upath.toUnix('some\\windows\\path')  // 'some/windows/path'

// Like normalize() but preserves leading ./ and // (UNC)
upath.normalizeSafe(p: string): string
upath.normalizeSafe('./path/../dep')        // './dep'  (normalize gives 'dep')
upath.normalizeSafe('//server/share/file')  // '//server/share/file'

// Like normalizeSafe() but trims trailing /
upath.normalizeTrim(p: string): string
upath.normalizeTrim('./../dep/')  // '../dep'

// Like join() but preserves leading ./ and // from first segment
upath.joinSafe(...paths: string[]): string
upath.joinSafe('./some/path', '../other')       // './some/other'
upath.joinSafe('//server/share', '../path')     // '//server/path'

// Add extension if not already present
upath.addExt(file: string, ext: string): string
upath.addExt('myfile', '.js')     // 'myfile.js'
upath.addExt('myfile.js', '.js')  // 'myfile.js'

// Remove file extension (maxSize=7 default, can ignore specific extensions)
upath.trimExt(filename: string, ignoreExts?: string[], maxSize?: number): string
upath.trimExt('file.min.js')                   // 'file.min'
upath.trimExt('file.min', ['min'], 8)          // 'file.min' (ignored)

// Remove a specific extension
upath.removeExt(filename: string, ext: string): string
upath.removeExt('file.js', '.js')   // 'file'
upath.removeExt('file.txt', '.js')  // 'file.txt'

// Replace extension (subject to ignoreExts/maxSize)
upath.changeExt(filename: string, ext: string, ignoreExts?: string[], maxSize?: number): string
upath.changeExt('module.coffee', '.js')                  // 'module.js'
upath.changeExt('file.min', '.js', ['min'], 8)           // 'file.min.js'

// Add extension only if no valid extension exists
upath.defaultExt(filename: string, ext: string, ignoreExts?: string[], maxSize?: number): string
upath.defaultExt('file', '.js')                          // 'file.js'
upath.defaultExt('file.ts', '.js')                       // 'file.ts'
upath.defaultExt('file.min', '.js', ['min'], 8)          // 'file.min.js'
```

## Extension function rules

- Extensions up to `maxSize` chars (including dot) are considered valid. Default: 7 (e.g. `.coffee` = 7 chars)
- `ignoreExts` prevents those extensions from being treated as valid — they won't be trimmed/changed/defaulted
- Both `.ext` and `ext` forms work — the dot is normalized automatically
- Passing no `ext` (or empty string) to `addExt`/`defaultExt` returns filename unchanged
- Passing no `ext` to `changeExt` trims the extension without replacing
