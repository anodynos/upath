import upath from '../index';

describe('upath extension functions', () => {

  describe('upath.addExt(filename, ext)', () => {
    describe("addExt(filename, 'js')", () => {
      const cases: [string, string][] = [
        ['myfile/addExt',       'myfile/addExt.js'],
        ['myfile/addExt.txt',   'myfile/addExt.txt.js'],
        ['myfile/addExt.js',    'myfile/addExt.js'],
        ['myfile/addExt.min.',  'myfile/addExt.min..js'],
      ];

      test.each(cases)("addExt(%j, 'js') → %j", (input, expected) => {
        expect(upath.addExt(input, 'js')).toBe(expected);
        expect(upath.addExt(input, '.js')).toBe(expected);
      });
    });

    describe('addExt(filename) — no ext param', () => {
      const cases: string[] = [
        'myfile/addExt',
        'myfile/addExt.txt',
        'myfile/addExt.js',
        'myfile/addExt.min.',
      ];

      test.each(cases)('addExt(%j) → unchanged', (input) => {
        // Cast to access the runtime behavior of calling with missing/empty ext
        const addExt = upath.addExt as (file: string, ext?: string) => string;
        expect(addExt(input)).toBe(input);
        expect(addExt(input, '')).toBe(input);
      });
    });
  });

  describe('upath.trimExt(filename, ignoreExts?, maxSize?)', () => {
    describe('trimExt(filename) — defaults', () => {
      const cases: [string, string][] = [
        ['my/trimedExt.txt',      'my/trimedExt'],
        ['my/trimedExt',          'my/trimedExt'],
        ['my/trimedExt.min',      'my/trimedExt'],
        ['my/trimedExt.min.js',   'my/trimedExt.min'],
        ['../my/trimedExt.longExt', '../my/trimedExt.longExt'],
      ];

      test.each(cases)('trimExt(%j) → %j', (input, expected) => {
        expect(upath.trimExt(input)).toBe(expected);
      });
    });

    describe("trimExt(filename, ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['my/trimedExt.txt',         'my/trimedExt'],
        ['my/trimedExt.min',         'my/trimedExt.min'],
        ['my/trimedExt.dev',         'my/trimedExt.dev'],
        ['../my/trimedExt.longExt',  '../my/trimedExt'],
        ['../my/trimedExt.longRExt', '../my/trimedExt.longRExt'],
      ];

      test.each(cases)("trimExt(%j, ['min', '.dev'], 8) → %j", (input, expected) => {
        expect(upath.trimExt(input, ['min', '.dev'], 8)).toBe(expected);
      });
    });
  });

  describe('upath.removeExt(filename, ext)', () => {
    describe("removeExt(filename, '.js')", () => {
      const cases: [string, string][] = [
        ['removedExt.js',       'removedExt'],
        ['removedExt.txt.js',   'removedExt.txt'],
        ['notRemoved.txt',      'notRemoved.txt'],
      ];

      test.each(cases)("removeExt(%j, '.js') → %j", (input, expected) => {
        expect(upath.removeExt(input, '.js')).toBe(expected);
        expect(upath.removeExt(input, 'js')).toBe(expected);
      });
    });

    describe("removeExt(filename, '.longExt')", () => {
      const cases: [string, string][] = [
        ['removedExt.longExt',      'removedExt'],
        ['removedExt.txt.longExt',  'removedExt.txt'],
        ['notRemoved.txt',          'notRemoved.txt'],
      ];

      test.each(cases)("removeExt(%j, '.longExt') → %j", (input, expected) => {
        expect(upath.removeExt(input, '.longExt')).toBe(expected);
        expect(upath.removeExt(input, 'longExt')).toBe(expected);
      });
    });
  });

  describe('upath.changeExt(filename, ext?, ignoreExts?, maxSize?)', () => {
    describe("changeExt(filename, '.js')", () => {
      const cases: [string, string][] = [
        ['my/module.min',          'my/module.js'],
        ['my/module.coffee',       'my/module.js'],
        ['my/module',              'my/module.js'],
        ['file/withDot.',          'file/withDot.js'],
        ['file/change.longExt',    'file/change.longExt.js'],
      ];

      test.each(cases)("changeExt(%j, '.js') → %j", (input, expected) => {
        expect(upath.changeExt(input, 'js')).toBe(expected);
        expect(upath.changeExt(input, '.js')).toBe(expected);
      });
    });

    describe('changeExt(filename) — trims extension', () => {
      const cases: [string, string][] = [
        ['my/module.min',       'my/module'],
        ['my/module.coffee',    'my/module'],
        ['my/module',           'my/module'],
        ['file/withDot.',       'file/withDot'],
        ['file/change.longExt', 'file/change.longExt'],
      ];

      // Cast to access runtime behavior with missing/empty ext
      const changeExt = upath.changeExt as (
        filename: string,
        ext?: string,
        ignoreExts?: string[],
        maxSize?: number,
      ) => string;

      test.each(cases)('changeExt(%j) → %j', (input, expected) => {
        expect(changeExt(input)).toBe(expected);
        expect(changeExt(input, '')).toBe(expected);
      });
    });

    describe("changeExt(filename, 'js', ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['my/module.coffee',       'my/module.js'],
        ['file/notValidExt.min',   'file/notValidExt.min.js'],
        ['file/notValidExt.dev',   'file/notValidExt.dev.js'],
        ['file/change.longExt',    'file/change.js'],
        ['file/change.longRExt',   'file/change.longRExt.js'],
      ];

      test.each(cases)("changeExt(%j, 'js', ['min', 'dev'], 8) → %j", (input, expected) => {
        expect(upath.changeExt(input, 'js', ['min', 'dev'], 8)).toBe(expected);
        expect(upath.changeExt(input, '.js', ['.min', '.dev'], 8)).toBe(expected);
      });
    });
  });

  describe('upath.defaultExt(filename, ext?, ignoreExts?, maxSize?)', () => {
    describe("defaultExt(filename, 'js')", () => {
      const cases: [string, string][] = [
        ['fileWith/defaultExt',          'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.js',       'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.min',      'fileWith/defaultExt.min'],
        ['fileWith/defaultExt.longExt',  'fileWith/defaultExt.longExt.js'],
      ];

      test.each(cases)("defaultExt(%j, 'js') → %j", (input, expected) => {
        expect(upath.defaultExt(input, 'js')).toBe(expected);
        expect(upath.defaultExt(input, '.js')).toBe(expected);
      });
    });

    describe('defaultExt(filename) — no ext param', () => {
      const inputs = [
        'fileWith/defaultExt',
        'fileWith/defaultExt.js',
        'fileWith/defaultExt.min',
        'fileWith/defaultExt.longExt',
      ];

      // Cast to access runtime behavior with missing ext
      const defaultExt = upath.defaultExt as (
        filename: string,
        ext?: string,
        ignoreExts?: string[],
        maxSize?: number,
      ) => string;

      test.each(inputs)('defaultExt(%j) → unchanged', (input) => {
        expect(defaultExt(input)).toBe(input);
      });
    });

    describe("defaultExt(filename, 'js', ['min', '.dev'], 8)", () => {
      const cases: [string, string][] = [
        ['fileWith/defaultExt',          'fileWith/defaultExt.js'],
        ['fileWith/defaultExt.min',      'fileWith/defaultExt.min.js'],
        ['fileWith/defaultExt.dev',      'fileWith/defaultExt.dev.js'],
        ['fileWith/defaultExt.longExt',  'fileWith/defaultExt.longExt'],
        ['fileWith/defaultExt.longRext', 'fileWith/defaultExt.longRext.js'],
      ];

      test.each(cases)("defaultExt(%j, 'js', ['min', '.dev'], 8) → %j", (input, expected) => {
        expect(upath.defaultExt(input, 'js', ['min', '.dev'], 8)).toBe(expected);
        expect(upath.defaultExt(input, '.js', ['.min', 'dev'], 8)).toBe(expected);
      });
    });
  });
});
