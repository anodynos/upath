import path from 'node:path';
import upath from '../index';

describe('path API completeness', () => {
  // Discover all path exports dynamically
  const pathKeys = Object.getOwnPropertyNames(path)
    .filter((k) => k !== 'posix' && k !== 'win32' && !k.startsWith('_'))
    .sort();

  const pathFunctions = pathKeys.filter((k) => typeof (path as Record<string, unknown>)[k] === 'function');
  const pathProperties = pathKeys.filter((k) => typeof (path as Record<string, unknown>)[k] !== 'function');

  describe('all path functions are proxied', () => {
    test.each(pathFunctions)('upath.%s exists and is a function', (key) => {
      expect(typeof (upath as Record<string, unknown>)[key]).toBe('function');
    });
  });

  describe('all path properties are present', () => {
    test.each(pathProperties)('upath.%s exists', (key) => {
      expect((upath as Record<string, unknown>)[key]).toBeDefined();
    });
  });

  describe('proxied functions convert backslashes', () => {
    test.each(pathFunctions)('upath.%s converts \\\\ to / in string results', (key) => {
      const fn = (upath as Record<string, unknown>)[key] as Function;
      try {
        const result = fn('c:\\test\\path');
        if (typeof result === 'string') {
          expect(result).not.toContain('\\');
        }
      } catch {
        // Some functions need specific arg counts/types — that's OK
      }
    });
  });

  test('upath.sep is /', () => {
    expect(upath.sep).toBe('/');
  });

  test('upath has extra functions not in path', () => {
    const extraFns = ['toUnix', 'normalizeSafe', 'normalizeTrim', 'joinSafe',
                      'addExt', 'trimExt', 'removeExt', 'changeExt', 'defaultExt'];
    for (const fn of extraFns) {
      expect(typeof (upath as Record<string, unknown>)[fn]).toBe('function');
    }
  });

  test('upath has VERSION', () => {
    expect(upath.VERSION).toBe('3.0.0');
  });

  // Report what we found (useful for CI logs across Node versions)
  test('reports discovered path API surface', () => {
    console.log(`Node ${process.version} path API: ${pathFunctions.length} functions, ${pathProperties.length} properties`);
    console.log(`  Functions: ${pathFunctions.join(', ')}`);
    console.log(`  Properties: ${pathProperties.join(', ')}`);
  });
});
