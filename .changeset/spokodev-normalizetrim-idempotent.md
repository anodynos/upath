---
"upath": patch
---

Fix `normalizeTrim` to preserve the `//./` DOS-device/UNC root so it stays idempotent — `normalizeTrim('//.//')` now returns `'//./'` instead of the invalid `'//.'`. Thanks to @spokodev for the fix.
