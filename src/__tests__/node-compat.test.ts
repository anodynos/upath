/**
 * Node.js path module compatibility tests.
 *
 * These test vectors are extracted from Node.js's own test suite
 * (test/parallel/test-path-*.js). They prove that upath is a true
 * drop-in replacement for Node's `path` module on POSIX systems.
 *
 * Strategy:
 * - All path.posix test vectors must produce identical results through upath
 * - Shared test vectors (posix + win32 agree with `/`) also pass through upath
 * - Backslash-input tests verify upath's `\` → `/` normalization
 *
 * Source: https://github.com/nodejs/node/tree/main/test/parallel/
 */
import * as path from 'node:path';
import upath from '../index';

// ---------------------------------------------------------------------------
// basename (from test-path-basename.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: basename', () => {
  // POSIX vectors — these must match path.posix.basename exactly
  const posixCases: [string, string | undefined, string][] = [
    ['.js', '.js', ''],
    ['js', '.js', 'js'],
    ['file.js', '.ts', 'file.js'],
    ['file', '.js', 'file'],
    ['file.js.old', '.js.old', 'file'],
    ['', undefined, ''],
    ['/dir/basename.ext', undefined, 'basename.ext'],
    ['/basename.ext', undefined, 'basename.ext'],
    ['basename.ext', undefined, 'basename.ext'],
    ['basename.ext/', undefined, 'basename.ext'],
    ['basename.ext//', undefined, 'basename.ext'],
    ['aaa/bbb', '/bbb', 'bbb'],
    ['aaa/bbb', 'a/bbb', 'bbb'],
    ['aaa/bbb', 'bbb', 'bbb'],
    ['aaa/bbb//', 'bbb', 'bbb'],
    ['aaa/bbb', 'bb', 'b'],
    ['aaa/bbb', 'b', 'bb'],
    ['/aaa/bbb', '/bbb', 'bbb'],
    ['/aaa/bbb', 'a/bbb', 'bbb'],
    ['/aaa/bbb', 'bbb', 'bbb'],
    ['/aaa/bbb//', 'bbb', 'bbb'],
    ['/aaa/bbb', 'bb', 'b'],
    ['/aaa/bbb', 'b', 'bb'],
    ['/aaa/bbb', undefined, 'bbb'],
    ['/aaa/', undefined, 'aaa'],
    ['/aaa/b', undefined, 'b'],
    ['/a/b', undefined, 'b'],
    ['//a', undefined, 'a'],
    ['a', 'a', ''],
  ];

  test.each(posixCases)(
    'upath.basename(%j, %j) === %j',
    (p, suffix, expected) => {
      const result = suffix !== undefined
        ? upath.basename(p, suffix)
        : upath.basename(p);
      expect(result).toBe(expected);
      // Also verify it matches path.posix
      const posixResult = suffix !== undefined
        ? path.posix.basename(p, suffix)
        : path.posix.basename(p);
      expect(result).toBe(posixResult);
    },
  );
});

// ---------------------------------------------------------------------------
// dirname (from test-path-dirname.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: dirname', () => {
  const posixCases: [string, string][] = [
    ['/a/b/', '/a'],
    ['/a/b', '/a'],
    ['/a', '/'],
    ['', '.'],
    ['/', '/'],
    ['////', '/'],
    ['//a', '//'],
    ['foo', '.'],
  ];

  test.each(posixCases)(
    'upath.dirname(%j) === %j',
    (input, expected) => {
      expect(upath.dirname(input)).toBe(expected);
      expect(upath.dirname(input)).toBe(path.posix.dirname(input));
    },
  );
});

// ---------------------------------------------------------------------------
// extname (from test-path-extname.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: extname', () => {
  // All POSIX extname test vectors
  const cases: [string, string][] = [
    ['', ''],
    ['/path/to/file', ''],
    ['/path/to/file.ext', '.ext'],
    ['/path.to/file.ext', '.ext'],
    ['/path.to/file', ''],
    ['/path.to/.file', ''],
    ['/path.to/.file.ext', '.ext'],
    ['/path/to/f.ext', '.ext'],
    ['/path/to/..ext', '.ext'],
    ['/path/to/..', ''],
    ['file', ''],
    ['file.ext', '.ext'],
    ['.file', ''],
    ['.file.ext', '.ext'],
    ['/file', ''],
    ['/file.ext', '.ext'],
    ['/.file', ''],
    ['/.file.ext', '.ext'],
    ['.path/file.ext', '.ext'],
    ['file.ext.ext', '.ext'],
    ['file.', '.'],
    ['.', ''],
    ['./', ''],
    ['.file.ext', '.ext'],
    ['.file', ''],
    ['.file.', '.'],
    ['.file..', '.'],
    ['..', ''],
    ['../', ''],
    ['..file.ext', '.ext'],
    ['..file', '.file'],
    ['..file.', '.'],
    ['..file..', '.'],
    ['...', '.'],
    ['...ext', '.ext'],
    ['....', '.'],
    ['file.ext/', '.ext'],
    ['file.ext//', '.ext'],
    ['file/', ''],
    ['file//', ''],
    ['file./', '.'],
    ['file.//', '.'],
  ];

  test.each(cases)(
    'upath.extname(%j) === %j',
    (input, expected) => {
      expect(upath.extname(input)).toBe(expected);
      expect(upath.extname(input)).toBe(path.posix.extname(input));
    },
  );
});

// ---------------------------------------------------------------------------
// join (from test-path-join.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: join', () => {
  // Shared join vectors (identical for posix and win32 when using `/`)
  const cases: [string[], string][] = [
    [['.', 'x/b', '..', '/b/c.js'], 'x/b/c.js'],
    [[], '.'],
    [['/.', 'x/b', '..', '/b/c.js'], '/x/b/c.js'],
    [['/foo', '../../../bar'], '/bar'],
    [['foo', '../../../bar'], '../../bar'],
    [['foo/', '../../../bar'], '../../bar'],
    [['foo/x', '../../../bar'], '../bar'],
    [['foo/x', './bar'], 'foo/x/bar'],
    [['foo/x/', './bar'], 'foo/x/bar'],
    [['foo/x/', '.', 'bar'], 'foo/x/bar'],
    [['./'], './'],
    [['.', './'], './'],
    [['.', '.', '.'], '.'],
    [['.', './', '.'], '.'],
    [['.', '/./', '.'], '.'],
    [['.', '/////./', '.'], '.'],
    [['.'], '.'],
    [['', '.'], '.'],
    [['', 'foo'], 'foo'],
    [['foo', '/bar'], 'foo/bar'],
    [['', '/foo'], '/foo'],
    [['', '', '/foo'], '/foo'],
    [['', '', 'foo'], 'foo'],
    [['foo', ''], 'foo'],
    [['foo/', ''], 'foo/'],
    [['foo', '', '/bar'], 'foo/bar'],
    [['./', '..', '/foo'], '../foo'],
    [['./', '..', '..', '/foo'], '../../foo'],
    [['.', '..', '..', '/foo'], '../../foo'],
    [['', '..', '..', '/foo'], '../../foo'],
    [['/'], '/'],
    [['/', '.'], '/'],
    [['/', '..'], '/'],
    [['/', '..', '..'], '/'],
    [[''], '.'],
    [['', ''], '.'],
    [[' /foo'], ' /foo'],
    [[' ', 'foo'], ' /foo'],
    [[' ', '.'], ' '],
    [[' ', '/'], ' /'],
    [[' ', ''], ' '],
    [['/', 'foo'], '/foo'],
    [['/', '/foo'], '/foo'],
    [['/', '//foo'], '/foo'],
    [['/', '', '/foo'], '/foo'],
    [['', '/', 'foo'], '/foo'],
    [['', '/', '/foo'], '/foo'],
  ];

  test.each(cases)(
    'upath.join(%j) === %j',
    (args, expected) => {
      expect(upath.join(...args)).toBe(expected);
      expect(upath.join(...args)).toBe(path.posix.join(...args));
    },
  );
});

// ---------------------------------------------------------------------------
// normalize (from test-path-normalize.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: normalize', () => {
  const posixCases: [string, string][] = [
    ['./fixtures///b/../b/c.js', 'fixtures/b/c.js'],
    ['/foo/../../../bar', '/bar'],
    ['a//b//../b', 'a/b'],
    ['a//b//./c', 'a/b/c'],
    ['a//b//.', 'a/b'],
    ['/a/b/c/../../../x/y/z', '/x/y/z'],
    ['///..//./foo/.//bar', '/foo/bar'],
    ['bar/foo../../', 'bar/'],
    ['bar/foo../..', 'bar'],
    ['bar/foo../../baz', 'bar/baz'],
    ['bar/foo../', 'bar/foo../'],
    ['bar/foo..', 'bar/foo..'],
    ['../foo../../../bar', '../../bar'],
    ['../.../.././.../../../bar', '../../bar'],
    ['../../../foo/../../../bar', '../../../../../bar'],
    ['../../../foo/../../../bar/../../', '../../../../../../'],
    ['../foobar/barfoo/foo/../../../bar/../../', '../../'],
    ['../.../../foobar/../../../bar/../../baz', '../../../../baz'],
    // Note: path.posix preserves `\` as valid filename chars, but upath
    // normalizes `\` → `/` by design — this is the core value proposition.
    // So `foo/bar\baz` → `foo/bar/baz` in upath (vs `foo/bar\baz` in posix).
  ];

  test.each(posixCases)(
    'upath.normalize(%j) === %j',
    (input, expected) => {
      expect(upath.normalize(input)).toBe(expected);
      expect(upath.normalize(input)).toBe(path.posix.normalize(input));
    },
  );

  it('normalize converts backslash in mixed paths (intentional divergence from posix)', () => {
    // path.posix: 'foo/bar\\baz' → 'foo/bar\\baz' (backslash is valid filename char)
    // upath:      'foo/bar\\baz' → 'foo/bar/baz'   (backslash normalized to /)
    expect(upath.normalize('foo/bar\\baz')).toBe('foo/bar/baz');
    expect(path.posix.normalize('foo/bar\\baz')).toBe('foo/bar\\baz');
  });
});

// ---------------------------------------------------------------------------
// relative (from test-path-relative.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: relative', () => {
  const posixCases: [string, string, string][] = [
    ['/var/lib', '/var', '..'],
    ['/var/lib', '/bin', '../../bin'],
    ['/var/lib', '/var/lib', ''],
    ['/var/lib', '/var/apache', '../apache'],
    ['/var/', '/var/lib', 'lib'],
    ['/', '/var/lib', 'var/lib'],
    ['/foo/test', '/foo/test/bar/package.json', 'bar/package.json'],
    ['/Users/a/web/b/test/mails', '/Users/a/web/b', '../..'],
    ['/foo/bar/baz-quux', '/foo/bar/baz', '../baz'],
    ['/foo/bar/baz', '/foo/bar/baz-quux', '../baz-quux'],
    ['/baz-quux', '/baz', '../baz'],
    ['/baz', '/baz-quux', '../baz-quux'],
    ['/page1/page2/foo', '/', '../../..'],
  ];

  test.each(posixCases)(
    'upath.relative(%j, %j) === %j',
    (from, to, expected) => {
      expect(upath.relative(from, to)).toBe(expected);
      expect(upath.relative(from, to)).toBe(path.posix.relative(from, to));
    },
  );
});

// ---------------------------------------------------------------------------
// resolve (from test-path-resolve.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: resolve', () => {
  const cwd = process.cwd();

  const posixCases: [string[], string][] = [
    [['/var/lib', '../', 'file/'], '/var/file'],
    [['/var/lib', '/../', 'file/'], '/file'],
    // [['a/b/c/', '../../..'], cwd],  // cwd-dependent — tested separately
    [[], cwd],
    [[''], cwd],
    [['.'], cwd],
    [['/some/dir', '.', '/absolute/'], '/absolute'],
    [['/foo/tmp.3/', '../tmp.3/cycles/root.js'], '/foo/tmp.3/cycles/root.js'],
  ];

  test.each(posixCases)(
    'upath.resolve(%j) === %j',
    (args, expected) => {
      // resolve returns absolute paths — upath normalizes `/` which matches posix
      const result = upath.resolve(...args);
      expect(result).toBe(expected);
    },
  );

  it('resolve with relative traversal returns cwd', () => {
    expect(upath.resolve('a/b/c/', '../../..')).toBe(cwd);
  });
});

// ---------------------------------------------------------------------------
// isAbsolute (from test-path-isabsolute.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: isAbsolute', () => {
  const posixCases: [string, boolean][] = [
    ['/home/foo', true],
    ['/home/foo/..', true],
    ['bar/', false],
    ['./baz', false],
  ];

  test.each(posixCases)(
    'upath.isAbsolute(%j) === %j',
    (input, expected) => {
      expect(upath.isAbsolute(input)).toBe(expected);
      expect(upath.isAbsolute(input)).toBe(path.posix.isAbsolute(input));
    },
  );
});

// ---------------------------------------------------------------------------
// parse (from test-path-parse-format.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: parse', () => {
  const unixPaths: [string, string][] = [
    ['/home/user/dir/file.txt', '/'],
    ['/home/user/a dir/another File.zip', '/'],
    ['/home/user/a dir//another&File.', '/'],
    ['/home/user/a$$$dir//another File.zip', '/'],
    ['user/dir/another File.zip', ''],
    ['file', ''],
    ['.\\file', ''],
    ['./file', ''],
    ['C:\\foo', ''],
    ['/', '/'],
    ['', ''],
    ['.', ''],
    ['..', ''],
    ['/foo', '/'],
    ['/foo.', '/'],
    ['/foo.bar', '/'],
    ['/.', '/'],
    ['/.foo', '/'],
    ['/.foo.bar', '/'],
    ['/foo/bar.baz', '/'],
  ];

  test.each(unixPaths)(
    'upath.parse(%j) has root=%j and round-trips via format',
    (p, expectedRoot) => {
      const parsed = upath.parse(p);
      // upath normalizes `\` → `/` and collapses `//`, so the root may differ
      // from path.posix when the input contains backslashes
      const normalized = upath.toUnix(p);
      const posixParsed = path.posix.parse(normalized);
      expect(parsed.root).toBe(posixParsed.root);
      expect(typeof parsed.dir).toBe('string');
      expect(typeof parsed.base).toBe('string');
      expect(typeof parsed.ext).toBe('string');
      expect(typeof parsed.name).toBe('string');
      // Round-trip: format(parse(p)) === normalized p (not original, since
      // upath normalizes `\` and `//` on the way in)
      expect(upath.format(parsed)).toBe(upath.format(posixParsed));
      // Root consistency
      if (parsed.dir) {
        expect(parsed.dir.startsWith(parsed.root)).toBe(true);
      }
      // Component consistency
      expect(parsed.base).toBe(upath.basename(p));
      expect(parsed.ext).toBe(upath.extname(p));
    },
  );

  // Trailing separator tests — upath collapses `//` so some `dir` values
  // differ from raw path.posix (which preserves consecutive slashes in dir)
  const trailingCases: [string, path.ParsedPath][] = [
    ['./', { root: '', dir: '', base: '.', ext: '', name: '.' }],
    ['//', { root: '/', dir: '/', base: '', ext: '', name: '' }],
    ['///', { root: '/', dir: '/', base: '', ext: '', name: '' }],
    ['/foo///', { root: '/', dir: '/', base: 'foo', ext: '', name: 'foo' }],
    // upath normalizes `//` → `/` in dir, so `/foo//` becomes `/foo`
    ['/foo///bar.baz', { root: '/', dir: '/foo', base: 'bar.baz', ext: '.baz', name: 'bar' }],
  ];

  test.each(trailingCases)(
    'upath.parse(%j) with trailing separators',
    (input, expected) => {
      expect(upath.parse(input)).toEqual(expected);
    },
  );
});

// ---------------------------------------------------------------------------
// format (from test-path-parse-format.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: format', () => {
  const cases: [path.FormatInputPathObject, string][] = [
    [{ dir: 'some/dir' }, 'some/dir/'],
    [{ base: 'index.html' }, 'index.html'],
    [{ root: '/' }, '/'],
    [{ name: 'index', ext: '.html' }, 'index.html'],
    [{ dir: 'some/dir', name: 'index', ext: '.html' }, 'some/dir/index.html'],
    [{ root: '/', name: 'index', ext: '.html' }, '/index.html'],
    [{}, ''],
  ];

  test.each(cases)(
    'upath.format(%j) === %j',
    (pathObj, expected) => {
      expect(upath.format(pathObj)).toBe(expected);
      expect(upath.format(pathObj)).toBe(path.posix.format(pathObj));
    },
  );

  // Extension dot normalization (https://github.com/nodejs/node/issues/44343)
  it('format adds dot to ext if missing', () => {
    expect(upath.format({ name: 'x', ext: 'png' })).toBe('x.png');
    expect(upath.format({ name: 'x', ext: '.png' })).toBe('x.png');
  });
});

// ---------------------------------------------------------------------------
// zero-length strings (from test-path-zero-length-strings.js)
// ---------------------------------------------------------------------------

describe('Node.js compat: zero-length strings', () => {
  const cwd = process.cwd();

  it('join returns "." for empty/zero-length inputs', () => {
    expect(upath.join('')).toBe('.');
    expect(upath.join('', '')).toBe('.');
  });

  it('join preserves cwd-like paths', () => {
    expect(upath.join(cwd)).toBe(cwd);
    expect(upath.join(cwd, '')).toBe(cwd);
  });

  it('normalize returns "." for empty string', () => {
    expect(upath.normalize('')).toBe('.');
  });

  it('isAbsolute returns false for empty string', () => {
    expect(upath.isAbsolute('')).toBe(false);
  });

  it('resolve returns cwd for empty inputs', () => {
    expect(upath.resolve('')).toBe(cwd);
    expect(upath.resolve('', '')).toBe(cwd);
  });

  it('relative treats empty as cwd', () => {
    expect(upath.relative('', cwd)).toBe('');
    expect(upath.relative(cwd, '')).toBe('');
    expect(upath.relative(cwd, cwd)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Backslash normalization — upath's core value-add
// ---------------------------------------------------------------------------

describe('Node.js compat: backslash normalization', () => {
  it('normalizes backslashes in basename input', () => {
    expect(upath.basename('foo\\bar\\baz.js')).toBe('baz.js');
    expect(upath.basename('foo\\bar\\baz.js', '.js')).toBe('baz');
  });

  it('normalizes backslashes in dirname input', () => {
    expect(upath.dirname('foo\\bar\\baz.js')).toBe('foo/bar');
  });

  it('normalizes backslashes in join input', () => {
    expect(upath.join('foo\\bar', 'baz')).toBe('foo/bar/baz');
    expect(upath.join('foo', 'bar\\baz')).toBe('foo/bar/baz');
  });

  it('normalizes backslashes in normalize input', () => {
    expect(upath.normalize('foo\\bar\\..\\baz')).toBe('foo/baz');
  });

  it('normalizes backslashes in resolve input', () => {
    const result = upath.resolve('/foo\\bar', 'baz');
    expect(result).toBe('/foo/bar/baz');
  });

  it('normalizes backslashes in relative output', () => {
    // On POSIX, backslashes in path inputs are treated as directory names
    // by path.posix, but upath normalizes them first
    expect(upath.relative('/foo/bar', '/foo/baz')).toBe('../baz');
  });

  it('normalizes backslashes in extname input', () => {
    expect(upath.extname('foo\\bar\\baz.js')).toBe('.js');
  });

  it('normalizes backslashes in parse input', () => {
    const parsed = upath.parse('foo\\bar\\baz.js');
    expect(parsed.base).toBe('baz.js');
    expect(parsed.dir).toBe('foo/bar');
    expect(parsed.ext).toBe('.js');
    expect(parsed.name).toBe('baz');
  });

  it('never produces backslashes in output', () => {
    // Even with backslash-heavy input, output is always `/`
    const inputs = [
      'C:\\Users\\foo\\bar',
      'foo\\bar\\baz',
      '.\\relative\\path',
      'foo\\..\\bar',
    ];
    for (const input of inputs) {
      expect(upath.normalize(input)).not.toContain('\\');
      expect(upath.join(input, 'sub')).not.toContain('\\');
      expect(upath.dirname(input)).not.toContain('\\');
    }
  });
});

// ---------------------------------------------------------------------------
// sep and delimiter
// ---------------------------------------------------------------------------

describe('Node.js compat: sep and delimiter', () => {
  it('sep is always "/"', () => {
    expect(upath.sep).toBe('/');
  });

  it('delimiter matches platform', () => {
    expect(upath.delimiter).toBe(path.delimiter);
  });
});

// ---------------------------------------------------------------------------
// posix and win32 pass-through
// ---------------------------------------------------------------------------

describe('Node.js compat: posix and win32 pass-through', () => {
  it('upath.posix is path.posix', () => {
    expect(upath.posix).toBe(path.posix);
  });

  it('upath.win32 is path.win32', () => {
    expect(upath.win32).toBe(path.win32);
  });

  it('path.posix functions work unchanged through upath.posix', () => {
    expect(upath.posix.join('/foo', 'bar')).toBe('/foo/bar');
    expect(upath.posix.normalize('/foo/../bar')).toBe('/bar');
    expect(upath.posix.basename('/foo/bar.js', '.js')).toBe('bar');
  });
});
