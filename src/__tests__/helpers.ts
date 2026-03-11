/**
 * Port of the CoffeeScript runSpec pattern.
 * Uses Jest's test.each with inputToExpected tables.
 */
export function runSpec(
  fnName: string,
  fn: (...args: unknown[]) => unknown,
  cases: [input: string, expected: unknown][],
): void {
  test.each(cases)(`${fnName}(%s) → %j`, (input, expected) => {
    expect(fn(input)).toEqual(expected);
  });
}

/**
 * For functions that take comma-separated path arguments (join, joinSafe).
 * Splits "path1, path2" into ['path1', 'path2'] and calls fn(...paths).
 */
export function runMultiArgSpec(
  fnName: string,
  fn: (...args: string[]) => unknown,
  cases: [input: string, expected: unknown][],
): void {
  test.each(cases)(`${fnName}(%s) → %j`, (input, expected) => {
    const args = input.split(',').map((p) => p.trim());
    expect(fn(...args)).toEqual(expected);
  });
}
