import upath from '../index'

describe('upath safe functions', () => {
  describe('upath.normalizeSafe(path)', () => {
    describe('equal to path.normalize', () => {
      const cases: [string, string][] = [
        ['', '.'],
        ['.', '.'],
        ['./', './'],
        ['.//', './'],
        ['.\\', './'],
        ['.\\//', './'],
        ['./..', '..'],
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
      // Root edge cases
      ['/', '/'],
      ['//', '/'],
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
      // Empty segment edge cases
      [['', ''], '.'],
      [['./foo', '', 'bar'], './foo/bar'],
    ]

    test.each(cases)('joinSafe(%j) → %j', (args, expected) => {
      expect(upath.joinSafe(...args)).toBe(expected)
    })
  })
})
