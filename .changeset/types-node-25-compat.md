---
'upath': patch
---

Fix `@types/node` >= 25 compatibility. `PlatformPath` was removed from `@types/node` v25; upath now derives its `PlatformPath` type from `typeof path` instead of re-exporting the removed interface. Works with `@types/node` v20 through v25+.
