# upath

A drop-in replacement for Node.js's built-in `path` module that normalizes all path separators to Unix-style forward slashes (`/`). It wraps every `path` function so that Windows backslashes are automatically converted in both inputs and outputs. Additionally, it provides file extension manipulation functions (`addExt`, `trimExt`, `removeExt`, `changeExt`, `defaultExt`) and safe normalization variants that preserve meaningful leading `./` and UNC path prefixes (`//`).

upath has zero runtime dependencies — it only requires Node's built-in `path` module. It supports Node.js >=4 and ships with hand-maintained TypeScript declarations.

## Key Technologies

- **Language:** CoffeeScript (source) compiled to JavaScript (CommonJS)
- **Build:** Grunt + uRequire
- **Testing:** Mocha + Chai
- **Types:** Hand-maintained `upath.d.ts`
- **Runtime deps:** None

## Directory Structure

```
source/code/upath.coffee       # Main source (single file)
source/spec/upath-spec.coffee  # Test specifications (also generate README)
source/spec/specHelpers.coffee # Custom test assertion helpers
build/code/upath.js            # Compiled output (entry point)
build/spec/                    # Compiled test files
upath.d.ts                     # TypeScript type declarations
Gruntfile.coffee               # Build configuration
readme.md                      # Auto-generated documentation
DRAFT/                         # Gitignored experimental code (unused)
```

## Important Commands

```bash
npm install       # Install dependencies
npm run dev       # Build library + watch and run specs
npm test          # Full build + run all specs
npm run build     # Build library only
```

## API Overview

**Proxied from path** (with `/` normalization): `normalize`, `join`, `resolve`, `isAbsolute`, `relative`, `dirname`, `basename`, `extname`, `parse`, `format`, `sep` (forced to `/`)

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
