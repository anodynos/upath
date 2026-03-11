import path from 'node:path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

/**
 * Convert all backslashes to forward slashes and collapse duplicate slashes
 * (except a leading double-slash for UNC paths).
 */
function toUnix(p: string): string {
  p = p.replace(/\\/g, '/');
  p = p.replace(/(?<!^)\/+/g, '/'); // collapse duplicates, preserve leading // for UNC
  return p;
}

// ---------------------------------------------------------------------------
// Build the upath object via dynamic proxy over `path`
// ---------------------------------------------------------------------------

// The runtime object that collects everything. We type it loosely here and
// provide precise exported bindings below for IDE / consumer use.
const upath: Record<string, unknown> = {};

// Wrap every path function so its string arguments are unix-ified on the way
// in and the string result is unix-ified on the way out.  Non-function
// properties (sep, delimiter) are copied as-is, except `posix` and `win32`
// which are circular references and passed through without wrapping.
for (const [propName, propValue] of Object.entries(path)) {
  if (propName === 'posix' || propName === 'win32') {
    // Circular platform objects — pass through without wrapping
    upath[propName] = propValue;
  } else if (typeof propValue === 'function') {
    upath[propName] = (...args: unknown[]): unknown => {
      const mapped = args.map((a) => (isString(a) ? toUnix(a) : a));
      const result = (propValue as Function).apply(path, mapped);
      return isString(result) ? toUnix(result) : result;
    };
  } else {
    upath[propName] = propValue;
  }
}

// Force unix separator
upath.sep = '/';

// ---------------------------------------------------------------------------
// Extra functions (unique to upath, not in Node's path)
// ---------------------------------------------------------------------------

function isValidExt(
  ext: string,
  ignoreExts: string[] = [],
  maxSize: number,
): boolean {
  return (
    !!ext &&
    ext.length <= maxSize &&
    !ignoreExts
      .map((e) => (e && e[0] !== '.' ? '.' + e : e))
      .includes(ext)
  );
}

/**
 * Normalize a path, preserving a leading `./` if the original had one,
 * and preserving UNC `//` or `//./' prefixes.
 */
function normalizeSafe(p: string): string {
  p = toUnix(p);
  let result: string = (upath.normalize as (p: string) => string)(p);
  if (p.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')) {
    result = './' + result;
  } else if (p.startsWith('//') && !result.startsWith('//')) {
    if (p.startsWith('//./' )) {
      result = '//.' + result;
    } else {
      result = '/' + result;
    }
  }
  return result;
}

/**
 * Like `normalizeSafe` but also trims a trailing slash (unless the path is
 * root `/`).
 */
function normalizeTrim(p: string): string {
  p = normalizeSafe(p);
  if (p.endsWith('/') && p.length > 1) {
    return p.slice(0, -1);
  }
  return p;
}

/**
 * Like `path.join` but preserves a leading `./` from the first segment and
 * preserves UNC `//` or `//./' prefixes.
 */
function joinSafe(...segments: string[]): string {
  const result: string = (upath.join as (...p: string[]) => string)(...segments);
  if (segments.length > 0) {
    const p0 = toUnix(segments[0]);
    if (p0.startsWith('./') && !result.startsWith('./') && !result.startsWith('..')) {
      return './' + result;
    } else if (p0.startsWith('//') && !result.startsWith('//')) {
      if (p0.startsWith('//./' )) {
        return '//.' + result;
      } else {
        return '/' + result;
      }
    }
  }
  return result;
}

/**
 * Add an extension to `file` if it doesn't already end with it.
 */
function addExt(file: string, ext: string): string {
  if (!ext) return file;
  if (ext[0] !== '.') ext = '.' + ext;
  return file + (file.endsWith(ext) ? '' : ext);
}

/**
 * Trim the extension from `filename` if it's a valid extension (not in
 * `ignoreExts` and not longer than `maxSize`).
 */
function trimExt(filename: string, ignoreExts?: string[], maxSize?: number): string {
  const _maxSize = maxSize ?? 7;
  const _ignoreExts = ignoreExts ?? [];
  const oldExt = (upath.extname as (p: string) => string)(filename);
  if (isValidExt(oldExt, _ignoreExts, _maxSize)) {
    return filename.slice(0, filename.length - oldExt.length);
  }
  return filename;
}

/**
 * Remove a specific extension from `filename`.  If the file doesn't have
 * that extension, return it unchanged.
 */
function removeExt(filename: string, ext: string): string {
  if (!ext) return filename;
  ext = ext[0] === '.' ? ext : '.' + ext;
  if ((upath.extname as (p: string) => string)(filename) === ext) {
    return trimExt(filename, [], ext.length);
  }
  return filename;
}

/**
 * Change the extension of `filename`.  The old extension is trimmed first
 * (subject to `ignoreExts` / `maxSize`), then `ext` is appended.
 */
function changeExt(
  filename: string,
  ext: string,
  ignoreExts?: string[],
  maxSize?: number,
): string {
  const _maxSize = maxSize ?? 7;
  const _ignoreExts = ignoreExts ?? [];
  const trimmed = trimExt(filename, _ignoreExts, _maxSize);
  if (!ext) return trimmed;
  return trimmed + (ext[0] === '.' ? ext : '.' + ext);
}

/**
 * Add `ext` to `filename` only when it doesn't already have a valid
 * extension (not in `ignoreExts` and not longer than `maxSize`).
 */
function defaultExt(
  filename: string,
  ext: string,
  ignoreExts?: string[],
  maxSize?: number,
): string {
  const _maxSize = maxSize ?? 7;
  const _ignoreExts = ignoreExts ?? [];
  const oldExt = (upath.extname as (p: string) => string)(filename);
  if (isValidExt(oldExt, _ignoreExts, _maxSize)) {
    return filename;
  }
  return addExt(filename, ext);
}

// Register extra functions on the runtime object
const extraFunctions: Record<string, Function> = {
  toUnix,
  normalizeSafe,
  normalizeTrim,
  joinSafe,
  addExt,
  trimExt,
  removeExt,
  changeExt,
  defaultExt,
};

for (const [name, fn] of Object.entries(extraFunctions)) {
  if (upath[name] !== undefined) {
    throw new Error(`path.${name} already exists.`);
  }
  upath[name] = fn;
}

// ---------------------------------------------------------------------------
// Version
// ---------------------------------------------------------------------------

upath.VERSION = '3.0.0';

// ---------------------------------------------------------------------------
// Re-export path types for consumers
// ---------------------------------------------------------------------------

export type { ParsedPath, FormatInputPathObject, PlatformPath } from 'node:path';

// ---------------------------------------------------------------------------
// Typed named exports — gives consumers IDE autocompletion + type safety
// ---------------------------------------------------------------------------

// Proxied path functions
export const resolve = upath.resolve as (...paths: string[]) => string;
export const normalize = upath.normalize as (p: string) => string;
export const isAbsolute = upath.isAbsolute as (p: string) => boolean;
export const join = upath.join as (...paths: string[]) => string;
export const relative = upath.relative as (from: string, to: string) => string;
export const dirname = upath.dirname as (p: string) => string;
export const basename = upath.basename as (p: string, suffix?: string) => string;
export const extname = upath.extname as (p: string) => string;
export const format = upath.format as (pathObject: path.FormatInputPathObject) => string;
export const parse = upath.parse as (p: string) => path.ParsedPath;
export const toNamespacedPath = upath.toNamespacedPath as (p: string) => string;
export const matchesGlob = upath.matchesGlob as (
  p: string,
  pattern: string,
) => boolean;

// String properties
export const sep = upath.sep as '/';
export const delimiter = upath.delimiter as string;

// Platform objects (pass-through)
export const posix = upath.posix as path.PlatformPath;
export const win32 = upath.win32 as path.PlatformPath;

// Version
export const VERSION = upath.VERSION as string;

// Extra functions (upath-only)
export {
  toUnix,
  normalizeSafe,
  normalizeTrim,
  joinSafe,
  addExt,
  trimExt,
  removeExt,
  changeExt,
  defaultExt,
};

// ---------------------------------------------------------------------------
// Default export — the full upath object, typed as the union of path + extras
// ---------------------------------------------------------------------------

export interface UPath extends path.PlatformPath {
  VERSION: string;
  sep: '/';
  toUnix(p: string): string;
  normalizeSafe(p: string): string;
  normalizeTrim(p: string): string;
  joinSafe(...paths: string[]): string;
  addExt(file: string, ext: string): string;
  trimExt(filename: string, ignoreExts?: string[], maxSize?: number): string;
  removeExt(filename: string, ext: string): string;
  changeExt(filename: string, ext: string, ignoreExts?: string[], maxSize?: number): string;
  defaultExt(filename: string, ext: string, ignoreExts?: string[], maxSize?: number): string;
}

export default upath as unknown as UPath;
