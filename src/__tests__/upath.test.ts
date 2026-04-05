import { readFileSync } from 'node:fs'
import path from 'node:path'
import upath from '../index'

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, '../../package.json'), 'utf-8'))

describe('upath core proxy functions', () => {
  test('VERSION is set', () => {
    expect(upath.VERSION).toBe(pkg.version)
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
      // Expanded vectors
      ['', ''],
      ['/', '/'],
      ['\\\\server\\share', '//server/share'],
      ['already/forward/slashes', 'already/forward/slashes'],
      ['\\', '/'],
      ['////multiple///slashes', '//multiple/slashes'],
      ['mixed\\back//and///slashes', 'mixed/back/and/slashes'],
      ['a\\b\\c', 'a/b/c'],
      ['C:\\Users\\test', 'C:/Users/test'],
    ]

    test.each(cases)('toUnix(%j) → %j', (input, expected) => {
      expect(upath.toUnix(input)).toBe(expected)
    })
  })

  describe('upath.isAbsolute(path) — backslash normalization', () => {
    // upath normalizes `\` → `/` before calling path.isAbsolute, so
    // `\foo` becomes `/foo` (absolute). This intentionally diverges from
    // path.posix.isAbsolute which treats `\` as a valid filename character.
    const cases: [string, boolean][] = [
      ['\\foo', true],
      ['\\\\server\\share', true],
      ['foo\\bar', false],
    ]

    test.each(cases)('isAbsolute(%j) → %j (backslash normalized)', (input, expected) => {
      expect(upath.isAbsolute(input)).toBe(expected)
    })
  })
})
