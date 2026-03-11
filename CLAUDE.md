# upath

> A drop-in replacement / proxy to Node.js `path` that replaces `\` with `/` for all results, supports UNC paths, and adds file extension manipulation functions.

## Project Identity

- **Name:** upath
- **Task ID Prefix:** UP
- **Version:** 2.0.1
- **Author:** Angelos Pikoulas (anodynos)
- **License:** MIT
- **npm:** [upath](https://www.npmjs.com/package/upath)
- **GitHub:** [anodynos/upath](https://github.com/anodynos/upath)

## Tech Stack

- **Language:** CoffeeScript (source) → JavaScript (build output)
- **Build:** Grunt + uRequire (CoffeeScript → CommonJS)
- **Testing:** Mocha + Chai (via uRequire spec runner)
- **Runtime deps:** None (only built-in `path`)
- **Node support:** >=4 (tested 8–14)
- **Type declarations:** Hand-maintained `upath.d.ts`

## Development

```bash
npm install
npx grunt dev          # build + watch specs
npx grunt lib          # build library only
npx grunt spec         # run specs once
npx grunt specWatch    # watch + run specs
```

The Gruntfile uses uRequire to compile CoffeeScript from `source/` to `build/`.

## Testing

```bash
npm test               # runs `npx grunt` (builds lib + runs specs)
```

- Tests are CoffeeScript specs in `source/spec/upath-spec.coffee`
- Specs double as documentation — README examples are auto-generated from them
- Framework: Mocha + Chai assertions

## Build & Deploy

```bash
npm run build          # runs `npx grunt lib` — compiles source/code → build/code
```

- Published to npm as `upath`
- `build/code/upath.js` is the main entry point
- `upath.d.ts` provides TypeScript type declarations
- No CI beyond Travis CI (legacy `.travis.yml`)

## Code Conventions

- CoffeeScript source, compiled to JS — never edit `build/` directly
- Specs are the source of truth for behavior documentation
- No linter configured (CoffeeScript era project)
- `DRAFT/` directory is gitignored experimental code
