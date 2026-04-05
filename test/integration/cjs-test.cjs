// Test CJS require() against built output
'use strict'

const assert = require('node:assert')
const upath = require('../../dist/index.cjs')

// Default export has all functions
assert.strictEqual(typeof upath.normalize, 'function', 'normalize should be a function')
assert.strictEqual(typeof upath.join, 'function', 'join should be a function')
assert.strictEqual(typeof upath.toUnix, 'function', 'toUnix should be a function')
assert.strictEqual(typeof upath.addExt, 'function', 'addExt should be a function')
assert.strictEqual(typeof upath.normalizeSafe, 'function', 'normalizeSafe should be a function')
assert.strictEqual(typeof upath.joinSafe, 'function', 'joinSafe should be a function')

// Core behavior works
assert.strictEqual(upath.normalize('c:\\windows\\path'), 'c:/windows/path', 'normalize backslash conversion')
assert.strictEqual(upath.join('a\\b', 'c\\d'), 'a/b/c/d', 'join backslash conversion')
assert.strictEqual(upath.toUnix('\\\\server\\share'), '//server/share', 'toUnix UNC')

// Extension functions work
assert.strictEqual(upath.addExt('file', '.js'), 'file.js', 'addExt')
assert.strictEqual(upath.changeExt('file.coffee', '.js'), 'file.js', 'changeExt')
assert.strictEqual(upath.removeExt('file.js', '.js'), 'file', 'removeExt')
assert.strictEqual(upath.trimExt('file.min.js'), 'file.min', 'trimExt')
assert.strictEqual(upath.defaultExt('file', '.js'), 'file.js', 'defaultExt')

// Properties
assert.strictEqual(upath.sep, '/', 'sep should be /')
assert.strictEqual(typeof upath.VERSION, 'string', 'VERSION should be string')
assert.ok(upath.VERSION.match(/^\d+\.\d+\.\d+/), 'VERSION should be semver')

// Safe functions
assert.strictEqual(upath.normalizeSafe('./path/../dep'), './dep', 'normalizeSafe preserves ./')
assert.strictEqual(upath.joinSafe('./a', 'b'), './a/b', 'joinSafe preserves ./')

console.log('CJS integration tests passed ✓')
