// Test ESM import against built output
// Note: static imports are hoisted — if dist/ is missing, Node will throw a clear
// MODULE_NOT_FOUND error before any code runs. Run `npm run build` first.
import assert from 'node:assert'

// Default import
import upath from '../../dist/index.js'

// Named imports
import {
  normalize,
  join,
  toUnix,
  addExt,
  changeExt,
  removeExt,
  trimExt,
  defaultExt,
  normalizeSafe,
  joinSafe,
  sep,
  VERSION,
} from '../../dist/index.js'

// Default export works
assert.strictEqual(typeof upath.normalize, 'function', 'default: normalize is function')
assert.strictEqual(upath.normalize('c:\\windows\\path'), 'c:/windows/path', 'default: normalize works')

// Named exports work
assert.strictEqual(typeof normalize, 'function', 'named: normalize is function')
assert.strictEqual(normalize('c:\\windows\\path'), 'c:/windows/path', 'named: normalize works')
assert.strictEqual(join('a\\b', 'c\\d'), 'a/b/c/d', 'named: join works')
assert.strictEqual(toUnix('\\\\server\\share'), '//server/share', 'named: toUnix works')

// Named extension functions
assert.strictEqual(addExt('file', '.js'), 'file.js', 'named: addExt')
assert.strictEqual(changeExt('file.coffee', '.js'), 'file.js', 'named: changeExt')
assert.strictEqual(removeExt('file.js', '.js'), 'file', 'named: removeExt')
assert.strictEqual(trimExt('file.min.js'), 'file.min', 'named: trimExt')
assert.strictEqual(defaultExt('file', '.js'), 'file.js', 'named: defaultExt')

// Named properties
assert.strictEqual(sep, '/', 'named: sep')
assert.strictEqual(typeof VERSION, 'string', 'named: VERSION is string')

// Named safe functions
assert.strictEqual(normalizeSafe('./path/../dep'), './dep', 'named: normalizeSafe')
assert.strictEqual(joinSafe('./a', 'b'), './a/b', 'named: joinSafe')

// Consistency: default and named should produce same results
assert.strictEqual(upath.normalize('a\\b'), normalize('a\\b'), 'default and named are consistent')

console.log('ESM integration tests passed ✓')
