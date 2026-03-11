import type {
  AggregatedResult,
  TestResult,
} from '@jest/test-result';
import type { Reporter } from '@jest/reporters';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Custom Jest reporter that generates docs/API.md from test results.
 *
 * Parses test.each titles (e.g. `normalize("input") -> "expected"`)
 * and renders grouped markdown tables per function.
 */

/** Represents a single input -> output example extracted from a test title. */
interface DocExample {
  input: string;
  output: string;
}

/** A group of examples under a describe block. */
interface DocSection {
  /** The describe block title (e.g. "upath.normalize(path)") */
  heading: string;
  /** Sub-describe label if present (e.g. "addExt(filename, 'js')") */
  subHeading?: string;
  /** Extracted input/output examples */
  examples: DocExample[];
}

/** Files to skip in documentation (meta-tests, not API demos). */
const SKIP_FILES = ['api-coverage.test.ts'];

/**
 * Parse a test title that follows the `fn("input") -> "output"` pattern.
 * Returns null if the title does not match.
 *
 * Handles patterns like:
 *   normalize("c:/windows") -> "c:/windows"
 *   addExt("file", 'js') -> "file.js"
 *   join(["a","b"]) -> "a/b"
 *   addExt("file") -> unchanged
 *   defaultExt("file") -> unchanged
 *   trimExt("input", ['min', '.dev'], 8) -> "output"
 */
function parseTestTitle(title: string): DocExample | null {
  // Match: fnName(args) → result
  // The arrow can be → or ->
  const arrowMatch = title.match(/^.+?\((.+)\)\s*(?:→|->)\s*(.+)$/);
  if (!arrowMatch) return null;

  const [, inputPart, outputPart] = arrowMatch;
  const input = inputPart.trim();
  const output = outputPart.trim();

  return { input, output };
}

/**
 * Build the full markdown document from sections.
 */
function buildMarkdown(sections: DocSection[]): string {
  const lines: string[] = [
    '# upath API',
    '',
    '> Auto-generated from test results by `doc-reporter.ts`. Do not edit manually.',
    '',
  ];

  // Group sections by top-level heading
  const grouped = new Map<string, DocSection[]>();
  for (const section of sections) {
    const key = section.heading;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(section);
  }

  for (const [heading, subs] of grouped) {
    lines.push(`## \`${heading}\``, '');

    for (const sub of subs) {
      if (sub.subHeading) {
        lines.push(`### ${sub.subHeading}`, '');
      }

      if (sub.examples.length > 0) {
        lines.push('| Input | Output |', '|-------|--------|');
        for (const ex of sub.examples) {
          // Escape pipe characters in values
          const input = ex.input.replace(/\|/g, '\\|');
          const output = ex.output.replace(/\|/g, '\\|');
          lines.push(`| \`${input}\` | \`${output}\` |`);
        }
        lines.push('');
      }
    }
  }

  return lines.join('\n');
}

class DocReporter implements Pick<Reporter, 'onRunComplete' | 'getLastError'> {
  private _error?: Error;

  getLastError(): Error | undefined {
    return this._error;
  }

  onRunComplete(
    _testContexts: Set<unknown>,
    results: AggregatedResult,
  ): void {
    const sections: DocSection[] = [];

    for (const testFile of results.testResults) {
      const fileName = path.basename(testFile.testFilePath);

      // Skip meta-tests
      if (SKIP_FILES.includes(fileName)) continue;

      // Group assertion results by their ancestor describe path
      const groups = new Map<string, typeof testFile.testResults>();
      for (const assertion of testFile.testResults) {
        const key = assertion.ancestorTitles.join(' > ');
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(assertion);
      }

      for (const [_groupKey, assertions] of groups) {
        if (assertions.length === 0) continue;

        const ancestors = assertions[0].ancestorTitles;

        // We need at least 2 levels: top describe + function describe
        // e.g. ["upath core proxy functions", "upath.normalize(path)"]
        if (ancestors.length < 2) continue;

        // The function heading is the second-level describe
        const heading = ancestors[1];

        // Sub-heading is the third level if present
        const subHeading = ancestors.length >= 3 ? ancestors[2] : undefined;

        const examples: DocExample[] = [];
        for (const assertion of assertions) {
          if (assertion.status !== 'passed') continue;
          const parsed = parseTestTitle(assertion.title);
          if (parsed) {
            examples.push(parsed);
          }
        }

        if (examples.length > 0) {
          sections.push({ heading, subHeading, examples });
        }
      }
    }

    if (sections.length === 0) {
      console.log('Doc reporter: no documentable test results found.');
      return;
    }

    const markdown = buildMarkdown(sections);

    // Resolve output path relative to the project root (where jest.config lives)
    const projectRoot = process.cwd();
    const outputDir = path.join(projectRoot, 'docs');
    const outputPath = path.join(outputDir, 'API.md');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`Doc reporter: wrote ${outputPath}`);
  }
}

export default DocReporter;
