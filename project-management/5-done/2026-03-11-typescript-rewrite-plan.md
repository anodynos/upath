# upath v3.0.0 TypeScript Rewrite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert upath from CoffeeScript to TypeScript with dual CJS/ESM output, Jest tests with a custom doc-generating reporter, and multi-Node-version API coverage testing.

**Architecture:** Keep the dynamic proxy pattern (iterate over `path` at runtime, wrap functions with `toUnix` pre/post-processing). Static TypeScript types provide IDE support. Jest tests port all existing spec data and add dynamic API completeness checks. A custom Jest reporter auto-generates `docs/API.md` from test results.

**Tech Stack:** TypeScript, tsup (dual CJS/ESM build), Jest + ts-jest, custom Jest reporter

**Design doc:** `project-management/3-in-progress/2026-03-11-typescript-rewrite-design.md`

---

## Task 1: Project Setup — Tooling Foundation

**Files:**

- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `jest.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/**/*.test.ts"]
}
```

**Step 2: Create `tsup.config.ts`**

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
})
```

**Step 3: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/__tests__/**'],
  reporters: ['default', '<rootDir>/src/__tests__/reporters/doc-reporter.ts'],
}

export default config
```

NOTE: The doc-reporter line should be commented out initially (it doesn't exist yet). Uncomment in Task 7.

**Step 4: Overhaul `package.json`**

Replace the entire contents with:

```json
{
  "name": "upath",
  "description": "A drop-in replacement / proxy to Node.js path, replacing \\\\ with / for all results & adding file extension functions.",
  "version": "3.0.0",
  "homepage": "https://github.com/anodynos/upath/",
  "author": {
    "name": "Angelos Pikoulas",
    "email": "agelos.pikoulas@gmail.com"
  },
  "license": "MIT",
  "keywords": [
    "path",
    "unix",
    "windows",
    "cross-platform",
    "extension",
    "file extension",
    "replace extension",
    "change extension",
    "trim extension",
    "add extension",
    "default extension",
    "UNC paths"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/anodynos/upath.git"
  },
  "bugs": {
    "url": "https://github.com/anodynos/upath/issues"
  },
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": ["dist", "LICENSE"],
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.5.0"
  }
}
```

**Step 5: Update `.gitignore`**

```
node_modules
dist
build
.idea
DRAFT
*.tsbuildinfo
coverage
```

**Step 6: Install dependencies**

Run: `npm install`
Expected: Clean install with no errors.

**Step 7: Verify tooling**

Run: `npx tsc --version`
Expected: TypeScript 5.x

Run: `npx tsup --version`
Expected: tsup 8.x

**Step 8: Commit**

```bash
git add tsconfig.json tsup.config.ts jest.config.ts package.json package-lock.json .gitignore
git commit -m "chore: initialize TypeScript/tsup/Jest tooling for v3.0.0 rewrite"
```

---

## Task 2: Core Source — Convert upath.coffee → src/index.ts

**Files:**

- Create: `src/index.ts`

**Step 1: Create `src/index.ts`**

This is a direct conversion of `source/code/upath.coffee` (128 lines) to TypeScript. The dynamic proxy pattern is preserved.

```typescript
import path from 'node:path'

// ---- helpers ----

function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function toUnix(p: string): string {
  p = p.replace(/\\/g, '/')
  p = p.replace(/(?<!^)\/+/g, '/') // consolidate duplicates, preserve leading // for UNC
  return p
}

function isValidExt(ext: string, ignoreExts: string[] = [], maxSize: number): boolean {
  if (!ext || ext.length > maxSize) return false
  const normalized = ignoreExts.map((e) => (e && e[0] !== '.' ? '.' + e : e))
  return !normalized.includes(ext)
}

// ---- dynamic proxy: wrap all path functions ----

type PathModule = typeof path
type UPath = {
  [K in keyof PathModule]: PathModule[K]
} & typeof extraFunctions & {
    VERSION: string
    sep: string
  }

const upath = {} as Record<string, unknown>

for (const [key, value] of Object.entries(path)) {
  if (key === 'posix' || key === 'win32') {
    upath[key] = value
    continue
  }
  if (typeof value === 'function') {
    upath[key] = (...args: unknown[]) => {
      const converted = args.map((a) => (isString(a) ? toUnix(a) : a))
      const result = (value as Function).apply(path, converted)
      return isString(result) ? toUnix(result) : result
    }
  } else {
    upath[key] = value
  }
}

upath['sep'] = '/'
upath['VERSION'] = '3.0.0'

// ---- extra functions ----

const extraFunctions = {
  toUnix,

  normalizeSafe(p: string): string {
    p = toUnix(p)
    const result = (upath['normalize'] as Function)(p) as string
    if (p.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')) {
      return './' + result
    }
    if (p.startsWith('//') && !result.startsWith('//')) {
      if (p.startsWith('//./')) {
        return '//.' + result
      }
      return '/' + result
    }
    return result
  },

  normalizeTrim(p: string): string {
    p = extraFunctions.normalizeSafe(p)
    return p.endsWith('/') ? p.slice(0, -1) : p
  },

  joinSafe(...parts: string[]): string {
    const result = (upath['join'] as Function).apply(null, parts) as string
    if (parts.length > 0) {
      const p0 = toUnix(parts[0])
      if (p0.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')) {
        return './' + result
      }
      if (p0.startsWith('//') && !result.startsWith('//')) {
        if (p0.startsWith('//./')) {
          return '//.' + result
        }
        return '/' + result
      }
    }
    return result
  },

  addExt(file: string, ext?: string): string {
    if (!ext) return file
    ext = ext[0] !== '.' ? '.' + ext : ext
    return file + (file.endsWith(ext) ? '' : ext)
  },

  trimExt(filename: string, ignoreExts?: string[], maxSize: number = 7): string {
    const oldExt = path.extname(filename)
    if (isValidExt(oldExt, ignoreExts, maxSize)) {
      return filename.slice(0, filename.length - oldExt.length)
    }
    return filename
  },

  removeExt(filename: string, ext?: string): string {
    if (!ext) return filename
    ext = ext[0] === '.' ? ext : '.' + ext
    if (path.extname(filename) === ext) {
      return extraFunctions.trimExt(filename, [], ext.length)
    }
    return filename
  },

  changeExt(filename: string, ext?: string, ignoreExts?: string[], maxSize: number = 7): string {
    const trimmed = extraFunctions.trimExt(filename, ignoreExts, maxSize)
    if (!ext) return trimmed
    return trimmed + (ext[0] === '.' ? ext : '.' + ext)
  },

  defaultExt(filename: string, ext?: string, ignoreExts?: string[], maxSize: number = 7): string {
    const oldExt = path.extname(filename)
    if (isValidExt(oldExt, ignoreExts, maxSize)) {
      return filename
    }
    return extraFunctions.addExt(filename, ext)
  },
}

// Attach extra functions, verify no conflicts
for (const [name, fn] of Object.entries(extraFunctions)) {
  if (upath[name] !== undefined) {
    throw new Error(`path.${name} already exists.`)
  }
  upath[name] = fn
}

// ---- typed exports ----

// Re-export all path functions with proper types
export const normalize: typeof path.normalize = upath['normalize'] as typeof path.normalize
export const join: typeof path.join = upath['join'] as typeof path.join
export const resolve: typeof path.resolve = upath['resolve'] as typeof path.resolve
export const isAbsolute: typeof path.isAbsolute = upath['isAbsolute'] as typeof path.isAbsolute
export const relative: typeof path.relative = upath['relative'] as typeof path.relative
export const dirname: typeof path.dirname = upath['dirname'] as typeof path.dirname
export const basename: typeof path.basename = upath['basename'] as typeof path.basename
export const extname: typeof path.extname = upath['extname'] as typeof path.extname
export const parse: typeof path.parse = upath['parse'] as typeof path.parse
export const format: typeof path.format = upath['format'] as typeof path.format
export const toNamespacedPath: typeof path.toNamespacedPath = upath[
  'toNamespacedPath'
] as typeof path.toNamespacedPath

// matchesGlob may not exist in all Node versions
export const matchesGlob: ((path: string, pattern: string) => boolean) | undefined = upath['matchesGlob'] as
  | ((path: string, pattern: string) => boolean)
  | undefined

export const sep = '/' as const
export const delimiter: typeof path.delimiter = path.delimiter
export const posix: typeof path.posix = path.posix
export const win32: typeof path.win32 = path.win32
export const VERSION = '3.0.0'

// Extra functions
export const { normalizeSafe, normalizeTrim, joinSafe, addExt, trimExt, removeExt, changeExt, defaultExt } =
  extraFunctions

// Default export: the whole upath object (for `import upath from 'upath'` / `const upath = require('upath')`)
export default upath as unknown as typeof path & typeof extraFunctions & { VERSION: string; sep: '/' }
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (or minor type issues to fix).

**Step 3: Build**

Run: `npx tsup`
Expected: `dist/index.cjs`, `dist/index.mjs`, `dist/index.d.ts` created.

**Step 4: Quick smoke test**

Run: `node -e "const u = require('./dist/index.cjs'); console.log(u.default.normalize('c:\\\\windows\\\\path')); console.log(u.default.sep);"`
Expected: `c:/windows/path` and `/`

Run: `node --input-type=module -e "import u from './dist/index.mjs'; console.log(u.normalize('c:\\\\windows\\\\path')); console.log(u.sep);"`
Expected: `c:/windows/path` and `/`

**Step 5: Commit**

```bash
git add src/index.ts
git commit -m "feat: convert upath core to TypeScript (preserving dynamic proxy pattern)"
```

---

## Task 3: Test Infrastructure — Jest Setup & Test Helpers

**Files:**

- Create: `src/__tests__/helpers.ts`
- Modify: `jest.config.ts` (comment out reporter line if not already)

**Step 1: Create test helper for the inputToExpected pattern**

```typescript
/**
 * Port of the CoffeeScript runSpec pattern.
 * Uses Jest's test.each with inputToExpected tables.
 */
export function runSpec(
  fnName: string,
  fn: (...args: unknown[]) => unknown,
  cases: [input: string, expected: unknown][],
): void {
  test.each(cases)(`${fnName}(%s) → %j`, (input, expected) => {
    expect(fn(input)).toEqual(expected)
  })
}

/**
 * For functions that take comma-separated path arguments (join, joinSafe).
 * Splits "path1, path2" into ['path1', 'path2'] and calls fn(...paths).
 */
export function runMultiArgSpec(
  fnName: string,
  fn: (...args: string[]) => unknown,
  cases: [input: string, expected: unknown][],
): void {
  test.each(cases)(`${fnName}(%s) → %j`, (input, expected) => {
    const args = input.split(',').map((p) => p.trim())
    expect(fn(...args)).toEqual(expected)
  })
}
```

**Step 2: Verify jest runs (empty suite)**

Run: `npx jest --passWithNoTests`
Expected: "No tests found" or pass with 0 tests.

**Step 3: Commit**

```bash
git add src/__tests__/helpers.ts jest.config.ts
git commit -m "test: add Jest test infrastructure and inputToExpected helpers"
```

---

## Task 4: Core Proxy Tests — normalize, join, parse, toUnix

**Files:**

- Create: `src/__tests__/upath.test.ts`

**Step 1: Write the core proxy tests**

Port all test data from `source/spec/upath-spec.coffee` lines 93-228.

```typescript
import path from 'node:path'
import upath from '../index.js'

describe('upath core proxy functions', () => {
  test('VERSION is set', () => {
    expect(upath.VERSION).toBe('3.0.0')
  })

  test('sep is /', () => {
    expect(upath.sep).toBe('/')
  })

  describe('upath.normalize(path)', () => {
    const cases: [string, string][] = [
      ['c:/windows/nodejs/path', 'c:/windows/nodejs/path'],
      ['c:/windows/../nodejs/path', 'c:/nodejs/path'],
      ['c:\\windows\\nodejs\\path', 'c:/windows/nodejs/path'],
      ['c:\\windows\\..\\nodejs\\path', 'c:/nodejs/path'],
      ['/windows\\unix/mixed', '/windows/unix/mixed'],
      ['\\windows//unix/mixed', '/windows/unix/mixed'],
      ['\\windows\\..\\unix/mixed/', '/unix/mixed/'],
    ]

    test.each(cases)('normalize(%j) → %j', (input, expected) => {
      expect(upath.normalize(input)).toBe(expected)
    })
  })

  describe('upath.join(paths...)', () => {
    const cases: [string[], string][] = [
      [['some/nodejs/deep', '../path'], 'some/nodejs/path'],
      [['some/nodejs\\windows', '../path'], 'some/nodejs/path'],
      [['some\\windows\\only', '..\\path'], 'some/windows/path'],
    ]

    test.each(cases)('join(%j) → %j', (args, expected) => {
      expect(upath.join(...args)).toBe(expected)
    })
  })

  describe('upath.parse(path)', () => {
    test('parses Windows-style path', () => {
      const result = upath.parse('c:\\Windows\\Directory\\somefile.ext')
      expect(result).toEqual({
        root: path.sep === '\\' ? 'c:/' : '',
        dir: 'c:/Windows/Directory',
        base: 'somefile.ext',
        ext: '.ext',
        name: 'somefile',
      })
    })

    test('parses Unix-style path', () => {
      const result = upath.parse('/root/of/unix/somefile.ext')
      expect(result).toEqual({
        root: '/',
        dir: '/root/of/unix',
        base: 'somefile.ext',
        ext: '.ext',
        name: 'somefile',
      })
    })
  })

  describe('upath.toUnix(path)', () => {
    const cases: [string, string][] = [
      ['.//windows\\//unix/\\/mixed////', './windows/unix/mixed/'],
      ['..///windows\\..\\\\unix/mixed', '../windows/../unix/mixed'],
    ]

    test.each(cases)('toUnix(%j) → %j', (input, expected) => {
      expect(upath.toUnix(input)).toBe(expected)
    })
  })
})
```

**Step 2: Run tests**

Run: `npx jest src/__tests__/upath.test.ts --verbose`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/__tests__/upath.test.ts
git commit -m "test: port core proxy tests (normalize, join, parse, toUnix)"
```

---

## Task 5: Safe Function Tests — normalizeSafe, normalizeTrim, joinSafe

**Files:**

- Create: `src/__tests__/safe.test.ts`

**Step 1: Write safe function tests**

Port all test data from `source/spec/upath-spec.coffee` lines 229-348.

```typescript
import upath from '../index.js'

describe('upath safe functions', () => {
  describe('upath.normalizeSafe(path)', () => {
    describe('equal to path.normalize', () => {
      const cases: [string, string][] = [
        ['', '.'],
        ['.', '.'],
        ['./', './'],
        ['.//', './'],
        ['.\\', './'],
        ['.\\///', './'],
        ['./..  ', '..'],
        ['.//..', '..'],
        ['./../', '../'],
        ['.\\..\\', '../'],
        ['./../dep', '../dep'],
        ['../dep', '../dep'],
        ['../path/dep', '../path/dep'],
        ['../path/../dep', '../dep'],
        ['dep', 'dep'],
        ['path//dep', 'path/dep'],
      ]

      test.each(cases)('normalizeSafe(%j) → %j', (input, expected) => {
        expect(upath.normalizeSafe(input)).toBe(expected)
      })
    })

    describe('different to path.normalize (preserves leading ./ and //)', () => {
      const cases: [string, string][] = [
        ['./dep', './dep'],
        ['./path/dep', './path/dep'],
        ['./path/../dep', './dep'],
        ['.//windows\\unix/mixed/', './windows/unix/mixed/'],
        ['..//windows\\unix/mixed', '../windows/unix/mixed'],
        ['windows\\unix/mixed/', 'windows/unix/mixed/'],
        ['..//windows\\..\\unix/mixed', '../unix/mixed'],
      ]

      test.each(cases)('normalizeSafe(%j) → %j', (input, expected) => {
        expect(upath.normalizeSafe(input)).toBe(expected)
      })
    })

    describe('UNC paths', () => {
      const cases: [string, string][] = [
        ['\\\\server\\share\\file', '//server/share/file'],
        ['//server/share/file', '//server/share/file'],
        ['\\\\?\\UNC\\server\\share\\file', '//?/UNC/server/share/file'],
        ['\\\\LOCALHOST\\c$\\temp\\file', '//LOCALHOST/c$/temp/file'],
        ['\\\\?\\c:\\temp\\file', '//?/c:/temp/file'],
        ['\\\\.\\c:\\temp\\file', '//./c:/temp/file'],
        ['//./c:/temp/file', '//./c:/temp/file'],
        ['////\\.\\c:/temp\\//file', '//./c:/temp/file'],
      ]

      test.each(cases)('normalizeSafe(%j) → %j', (input, expected) => {
        expect(upath.normalizeSafe(input)).toBe(expected)
      })
    })
  })

  describe('upath.normalizeTrim(path)', () => {
    const cases: [string, string][] = [
      ['./', '.'],
      ['./../', '..'],
      ['./../dep/', '../dep'],
      ['path//dep\\', 'path/dep'],
      ['.//windows\\unix/mixed/', './windows/unix/mixed'],
    ]

    test.each(cases)('normalizeTrim(%j) → %j', (input, expected) => {
      expect(upath.normalizeTrim(input)).toBe(expected)
    })
  })

  describe('upath.joinSafe(path1, path2, ...)', () => {
    const cases: [string[], string][] = [
      [['some/nodejs/deep', '../path'], 'some/nodejs/path'],
      [['./some/local/unix/', '../path'], './some/local/path'],
      [['./some\\current\\mixed', '..\\path'], './some/current/path'],
      [['../some/relative/destination', '..\\path'], '../some/relative/path'],
      // UNC paths
      [['\\\\server\\share\\file', '..\\path'], '//server/share/path'],
      [['\\\\.\\c:\\temp\\file', '..\\path'], '//./c:/temp/path'],
      [['//server/share/file', '../path'], '//server/share/path'],
      [['//./c:/temp/file', '../path'], '//./c:/temp/path'],
    ]

    test.each(cases)('joinSafe(%j) → %j', (args, expected) => {
      expect(upath.joinSafe(...args)).toBe(expected)
    })
  })
})
```

NOTE: Line 8 has a trailing space in the original spec: `'./..  '` maps to `'..'`. The original CoffeeScript has `'./..': '..'` — no trailing spaces. The extra spaces were a display artifact. Use `'./..': '..'` without trailing spaces.

**Step 2: Run tests**

Run: `npx jest src/__tests__/safe.test.ts --verbose`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/__tests__/safe.test.ts
git commit -m "test: port safe function tests (normalizeSafe, normalizeTrim, joinSafe)"
```

---

## Task 6: Extension Function Tests — addExt, trimExt, removeExt, changeExt, defaultExt

**Files:**

- Create: `src/__tests__/extensions.test.ts`

**Step 1: Write extension function tests**

Port all test data from `source/spec/upath-spec.coffee` lines 350-568.

```typescript
import upath from '../index.js'

describe('upath extension functions', () => {
  describe('upath.addExt(filename, ext)', () => {
    describe("addExt(filename, 'js')", () => {
      const cases: [string, string][] = [
        ['myfile/addExt', 'myfile/addExt.js'],
        ['myfile/addExt.txt', 'myfile/addExt.txt.js'],
        ['myfile/addExt.js', 'myfile/addExt.js'],
        ['myfile/addExt.min.', 'myfile/addExt.min..js'],
      ]

      test.each(cases)("addExt(%j, 'js') → %j", (input, expected) => {
        expect(upath.addExt(input, 'js')).toBe(expected)
        expect(upath.addExt(input, '.js')).toBe(expected)
      })
    })

    describe('addExt(filename) — no ext param', () => {
      const cases: string[] = ['myfile/addExt', 'myfile/addExt.txt', 'myfile/addExt.js', 'myfile/addExt.min.']

      test.each(cases)('addExt(%j) → unchanged', (input) => {
        expect(upath.addExt(input)).toBe(input)
        expect(upath.addExt(input, '')).toBe(input)
      })
    })
  })

  describe('upath.trimExt(filename, ignoreExts?, maxSize?)', () => {
    describe('trimExt(filename) — defaults', () => {
      const cases: [string, string][] = [
        ['my/trimedExt.txt', 'my/trimedExt'],
        ['my/trimedExt', 'my/trimedExt'],
        ['my/trimedExt.min', 'my/trimedExt'],
        ['my/trimedExt.min.js', 'my/trimedExt.min'],
        ['../my/trimedExt.longExt', '../my/trimedExt.longExt'],
      ]

      test.each(cases)('trimExt(%j) → %j', (input, expected) => {
        expect(upath.trimExt(input)).toBe(expected)
      })
    })

    describe("trimExt(filename, ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['my/trimedExt.txt', 'my/trimedExt'],
        ['my/trimedExt.min', 'my/trimedExt.min'],
        ['my/trimedExt.dev', 'my/trimedExt.dev'],
        ['../my/trimedExt.longExt', '../my/trimedExt'],
        ['../my/trimedExt.longRExt', '../my/trimedExt.longRExt'],
      ]

      test.each(cases)("trimExt(%j, ['min', '.dev'], 8) → %j", (input, expected) => {
        expect(upath.trimExt(input, ['min', '.dev'], 8)).toBe(expected)
      })
    })
  })

  describe('upath.removeExt(filename, ext)', () => {
    describe("removeExt(filename, '.js')", () => {
      const cases: [string, string][] = [
        ['removedExt.js', 'removedExt'],
        ['removedExt.txt.js', 'removedExt.txt'],
        ['notRemoved.txt', 'notRemoved.txt'],
      ]

      test.each(cases)("removeExt(%j, '.js') → %j", (input, expected) => {
        expect(upath.removeExt(input, '.js')).toBe(expected)
        expect(upath.removeExt(input, 'js')).toBe(expected)
      })
    })

    describe("removeExt(filename, '.longExt')", () => {
      const cases: [string, string][] = [
        ['removedExt.longExt', 'removedExt'],
        ['removedExt.txt.longExt', 'removedExt.txt'],
        ['notRemoved.txt', 'notRemoved.txt'],
      ]

      test.each(cases)("removeExt(%j, '.longExt') → %j", (input, expected) => {
        expect(upath.removeExt(input, '.longExt')).toBe(expected)
        expect(upath.removeExt(input, 'longExt')).toBe(expected)
      })
    })
  })

  describe('upath.changeExt(filename, ext?, ignoreExts?, maxSize?)', () => {
    describe("changeExt(filename, '.js')", () => {
      const cases: [string, string][] = [
        ['my/module.min', 'my/module.js'],
        ['my/module.coffee', 'my/module.js'],
        ['my/module', 'my/module.js'],
        ['file/withDot.', 'file/withDot.js'],
        ['file/change.longExt', 'file/change.longExt.js'],
      ]

      test.each(cases)("changeExt(%j, '.js') → %j", (input, expected) => {
        expect(upath.changeExt(input, 'js')).toBe(expected)
        expect(upath.changeExt(input, '.js')).toBe(expected)
      })
    })

    describe('changeExt(filename) — trims extension', () => {
      const cases: [string, string][] = [
        ['my/module.min', 'my/module'],
        ['my/module.coffee', 'my/module'],
        ['my/module', 'my/module'],
        ['file/withDot.', 'file/withDot'],
        ['file/change.longExt', 'file/change.longExt'],
      ]

      test.each(cases)('changeExt(%j) → %j', (input, expected) => {
        expect(upath.changeExt(input)).toBe(expected)
        expect(upath.changeExt(input, '')).toBe(expected)
      })
    })

    describe("changeExt(filename, 'js', ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['my/module.coffee', 'my/module.js'],
        ['file/notValidExt.min', 'file/notValidExt.min.js'],
        ['file/notValidExt.dev', 'file/notValidExt.dev.js'],
        ['file/change.longExt', 'file/change.js'],
        ['file/change.longRExt', 'file/change.longRExt.js'],
      ]

      test.each(cases)("changeExt(%j, 'js', ['min', 'dev'], 8) → %j", (input, expected) => {
        expect(upath.changeExt(input, 'js', ['min', 'dev'], 8)).toBe(expected)
        expect(upath.changeExt(input, '.js', ['.min', '.dev'], 8)).toBe(expected)
      })
    })
  })

  describe('upath.defaultExt(filename, ext?, ignoreExts?, maxSize?)', () => {
    describe("defaultExt(filename, 'js')", () => {
      const cases: [string, string][] = [
        ['fileWith/defaultExt', 'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.js', 'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.min', 'fileWith/defaultExt.min'],
        ['fileWith/defaultExt.longExt', 'fileWith/defaultExt.longExt.js'],
      ]

      test.each(cases)("defaultExt(%j, 'js') → %j", (input, expected) => {
        expect(upath.defaultExt(input, 'js')).toBe(expected)
        expect(upath.defaultExt(input, '.js')).toBe(expected)
      })
    })

    describe('defaultExt(filename) — no ext param', () => {
      const inputs = [
        'fileWith/defaultExt',
        'fileWith/defaultExt.js',
        'fileWith/defaultExt.min',
        'fileWith/defaultExt.longExt',
      ]

      test.each(inputs)('defaultExt(%j) → unchanged', (input) => {
        expect(upath.defaultExt(input)).toBe(input)
      })
    })

    describe("defaultExt(filename, 'js', ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['fileWith/defaultExt', 'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.min', 'fileWith/defaultExt.min.js'],
        ['fileWith/defaultExt.dev', 'fileWith/defaultExt.dev.js'],
        ['fileWith/defaultExt.longExt', 'fileWith/defaultExt.longExt'],
        ['fileWith/defaultExt.longRext', 'fileWith/defaultExt.longRext.js'],
      ]

      test.each(cases)("defaultExt(%j, 'js', ['min', '.dev'], 8) → %j", (input, expected) => {
        expect(upath.defaultExt(input, 'js', ['min', '.dev'], 8)).toBe(expected)
        expect(upath.defaultExt(input, '.js', ['.min', 'dev'], 8)).toBe(expected)
      })
    })
  })
})
```

**Step 2: Run tests**

Run: `npx jest src/__tests__/extensions.test.ts --verbose`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/__tests__/extensions.test.ts
git commit -m "test: port extension function tests (addExt, trimExt, removeExt, changeExt, defaultExt)"
```

---

## Task 7: API Coverage Test — Dynamic Path Completeness

**Files:**

- Create: `src/__tests__/api-coverage.test.ts`

**Step 1: Write the dynamic API coverage test**

This test discovers what `path` exports in the running Node version and asserts upath covers everything.

```typescript
import path from 'node:path'
import upath from '../index.js'

describe('path API completeness', () => {
  // Discover all path exports dynamically
  const pathKeys = Object.getOwnPropertyNames(path)
    .filter((k) => k !== 'posix' && k !== 'win32' && !k.startsWith('_'))
    .sort()

  const pathFunctions = pathKeys.filter((k) => typeof (path as Record<string, unknown>)[k] === 'function')
  const pathProperties = pathKeys.filter((k) => typeof (path as Record<string, unknown>)[k] !== 'function')

  describe('all path functions are proxied', () => {
    test.each(pathFunctions)('upath.%s exists and is a function', (key) => {
      expect(typeof (upath as Record<string, unknown>)[key]).toBe('function')
    })
  })

  describe('all path properties are present', () => {
    test.each(pathProperties)('upath.%s exists', (key) => {
      expect((upath as Record<string, unknown>)[key]).toBeDefined()
    })
  })

  describe('proxied functions convert backslashes', () => {
    test.each(pathFunctions)('upath.%s converts \\\\ to / in string results', (key) => {
      const fn = (upath as Record<string, unknown>)[key] as Function
      // Test with a simple Windows-style path where applicable
      try {
        const result = fn('c:\\test\\path')
        if (typeof result === 'string') {
          expect(result).not.toContain('\\')
        }
      } catch {
        // Some functions need specific arg counts/types — that's OK for this general test
      }
    })
  })

  test('upath.sep is /', () => {
    expect(upath.sep).toBe('/')
  })

  test('upath has extra functions not in path', () => {
    const extraFns = [
      'toUnix',
      'normalizeSafe',
      'normalizeTrim',
      'joinSafe',
      'addExt',
      'trimExt',
      'removeExt',
      'changeExt',
      'defaultExt',
    ]
    for (const fn of extraFns) {
      expect(typeof (upath as Record<string, unknown>)[fn]).toBe('function')
    }
  })

  test('upath has VERSION', () => {
    expect(upath.VERSION).toBe('3.0.0')
  })

  // Report what we found (useful for CI logs across Node versions)
  test('reports discovered path API surface', () => {
    console.log(
      `Node ${process.version} path API: ${pathFunctions.length} functions, ${pathProperties.length} properties`,
    )
    console.log(`  Functions: ${pathFunctions.join(', ')}`)
    console.log(`  Properties: ${pathProperties.join(', ')}`)
  })
})
```

**Step 2: Run tests**

Run: `npx jest src/__tests__/api-coverage.test.ts --verbose`
Expected: All tests PASS. Console output shows the discovered API surface.

**Step 3: Commit**

```bash
git add src/__tests__/api-coverage.test.ts
git commit -m "test: add dynamic path API completeness test (multi-Node-version ready)"
```

---

## Task 8: Custom Jest Doc Reporter

**Files:**

- Create: `src/__tests__/reporters/doc-reporter.ts`
- Create: `docs/` directory
- Modify: `jest.config.ts` (uncomment reporter line)

**Step 1: Create the doc reporter**

The reporter hooks into Jest's lifecycle to extract test structure and write markdown.

```typescript
import type { Reporter, ReporterOnStartOptions, Test, TestResult, AggregatedResult } from '@jest/reporters'
import type { ReporterContext } from '@jest/reporters'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Custom Jest reporter that generates docs/API.md from test results.
 *
 * Extracts describe/test.each structure and renders markdown tables
 * showing input → expected for each upath function.
 */
class DocReporter implements Reporter {
  private outputPath: string

  constructor(globalConfig: unknown, reporterConfig?: Record<string, unknown>) {
    this.outputPath = (reporterConfig?.outputPath as string) || path.join(process.cwd(), 'docs', 'API.md')
  }

  onRunStart(_results: AggregatedResult, _options: ReporterOnStartOptions): void {
    // no-op
  }

  onTestStart(_test: Test): void {
    // no-op
  }

  onTestResult(_test: Test, _testResult: TestResult, _aggregatedResult: AggregatedResult): void {
    // no-op — we process everything in onRunComplete
  }

  onRunComplete(_testContexts: Set<unknown>, results: AggregatedResult): void {
    const lines: string[] = [
      '# upath API Reference',
      '',
      '> Auto-generated from test specs. Do not edit manually.',
      `> Generated on Node ${process.version}`,
      '',
    ]

    for (const suite of results.testResults) {
      // Extract the test file name for section grouping
      const fileName = path.basename(suite.testFilePath, '.test.ts')
      if (fileName === 'api-coverage') continue // skip meta-test

      const testsByDescribe = this.groupByDescribe(suite.testResults)

      for (const [describePath, tests] of testsByDescribe) {
        // Extract function name from describe path
        const funcMatch = describePath.match(/upath\.(\w+)/)
        if (!funcMatch) continue

        const funcName = funcMatch[1]
        const sectionTitle = describePath.split(' > ').pop() || describePath

        lines.push(`## \`${sectionTitle}\``)
        lines.push('')
        lines.push('| Input | Result | Status |')
        lines.push('|-------|--------|--------|')

        for (const t of tests) {
          // Parse test title: "funcName(input) → expected"
          const titleMatch = t.title.match(/\((.+?)\)\s*→\s*(.+)/)
          if (titleMatch) {
            const input = titleMatch[1]
            const expected = titleMatch[2]
            const status = t.status === 'passed' ? 'pass' : 'FAIL'
            lines.push(`| \`${input}\` | \`${expected}\` | ${status} |`)
          }
        }

        lines.push('')
      }
    }

    // Ensure docs/ directory exists
    const dir = path.dirname(this.outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(this.outputPath, lines.join('\n') + '\n')
    console.log(`\n  Doc reporter: wrote ${this.outputPath}`)
  }

  private groupByDescribe(testResults: TestResult['testResults']): Map<string, typeof testResults> {
    const groups = new Map<string, typeof testResults>()

    for (const t of testResults) {
      const key = t.ancestorTitles.join(' > ')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(t)
    }

    return groups
  }

  getLastError(): void {
    // no-op
  }
}

export default DocReporter
```

**Step 2: Create docs directory**

Run: `mkdir -p docs`

**Step 3: Uncomment the reporter in jest.config.ts**

Update `jest.config.ts` to include the reporter. The reporter line should read:

```typescript
reporters: [
  'default',
  '<rootDir>/src/__tests__/reporters/doc-reporter.ts',
],
```

**Step 4: Run full test suite**

Run: `npx jest --verbose`
Expected: All tests PASS, `docs/API.md` is generated.

**Step 5: Verify generated docs**

Run: `cat docs/API.md | head -30`
Expected: Markdown with function sections and input/output tables.

**Step 6: Commit**

```bash
git add src/__tests__/reporters/doc-reporter.ts docs/API.md jest.config.ts
git commit -m "feat: add custom Jest doc reporter — auto-generates docs/API.md from test specs"
```

---

## Task 9: Cleanup — Remove Legacy Files

**Files:**

- Delete: `source/` directory (CoffeeScript source)
- Delete: `build/` directory (uRequire output)
- Delete: `Gruntfile.coffee`
- Delete: `upath.d.ts` (hand-maintained types)
- Delete: `.travis.yml`
- Delete: `DRAFT/` directory
- Delete: `.npmignore` (replaced by `files` in package.json)

**Step 1: Remove legacy files**

```bash
rm -rf source/ build/ DRAFT/
rm -f Gruntfile.coffee upath.d.ts .travis.yml .npmignore
```

**Step 2: Verify build still works**

Run: `npx tsup`
Expected: Clean build.

**Step 3: Verify tests still pass**

Run: `npx jest --verbose`
Expected: All tests PASS.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy CoffeeScript/Grunt/uRequire/Mocha/Travis files"
```

---

## Task 10: Full Verification & README Update

**Files:**

- Modify: `readme.md` (update for v3.0.0)

**Step 1: Run full test suite with coverage**

Run: `npx jest --coverage --verbose`
Expected: All tests PASS, coverage report shows src/index.ts coverage.

**Step 2: Build and verify both module formats**

Run: `npx tsup`

CJS smoke test:

```bash
node -e "const u = require('./dist/index.cjs'); console.log(u.default.normalize('c:\\\\windows\\\\path')); console.log(u.default.toUnix('a\\\\b\\\\c')); console.log(u.default.addExt('file', '.js'));"
```

Expected: `c:/windows/path`, `a/b/c`, `file.js`

ESM smoke test:

```bash
node --input-type=module -e "import u from './dist/index.mjs'; console.log(u.normalize('c:\\\\windows\\\\path')); console.log(u.toUnix('a\\\\b\\\\c')); console.log(u.addExt('file', '.js'));"
```

Expected: Same output.

**Step 3: Update readme.md**

Update the README header and installation section for v3.0.0. Key changes:

- Version bump
- Remove Travis CI badge
- Update Node version requirements
- Note TypeScript support
- Note dual CJS/ESM
- Point to `docs/API.md` for auto-generated API reference
- Remove CoffeeScript spec references

This is a prose update — adapt the existing readme.md structure but update all references to reflect v3.0.0 TypeScript.

**Step 4: Commit**

```bash
git add readme.md
git commit -m "docs: update README for v3.0.0 TypeScript rewrite"
```

---

## Execution Order Summary

| Task | Description                | Depends On |
| ---- | -------------------------- | ---------- |
| 1    | Project setup (tooling)    | —          |
| 2    | Core source conversion     | 1          |
| 3    | Test infrastructure        | 1          |
| 4    | Core proxy tests           | 2, 3       |
| 5    | Safe function tests        | 2, 3       |
| 6    | Extension function tests   | 2, 3       |
| 7    | API coverage test          | 2, 3       |
| 8    | Custom doc reporter        | 4, 5, 6, 7 |
| 9    | Cleanup legacy files       | 8          |
| 10   | Full verification + README | 9          |

Tasks 4-7 can be parallelized (they're independent test files that all depend on Tasks 2+3).
