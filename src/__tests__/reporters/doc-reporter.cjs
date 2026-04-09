// @ts-check
const fs = require('node:fs')
const path = require('node:path')

/**
 * Custom Jest reporter that generates docs/API.md from test results.
 *
 * Parses test.each titles (e.g. `normalize("input") -> "expected"`)
 * and renders grouped markdown tables per function.
 */

/** Files to skip in documentation (meta-tests, not API demos). */
const SKIP_FILES = ['api-coverage.test.ts', 'node-compat.test.ts']

/**
 * Parse a test title that follows the `fn("input") -> "output"` pattern.
 * Returns null if the title does not match.
 *
 * @param {string} title
 * @returns {{ input: string, output: string } | null}
 */
function parseTestTitle(title) {
  const arrowMatch = title.match(/^.+?\((.+)\)\s*(?:→|->)\s*(.+)$/)
  if (!arrowMatch) return null

  const [, inputPart, outputPart] = arrowMatch
  return { input: inputPart.trim(), output: outputPart.trim() }
}

/**
 * Build the full markdown document from sections.
 * @param {{ heading: string, subHeading?: string, examples: { input: string, output: string }[] }[]} sections
 * @returns {string}
 */
function buildMarkdown(sections) {
  const lines = [
    '# upath API',
    '',
    '> Auto-generated from test results by `doc-reporter.ts`. Do not edit manually.',
    '>',
    '> **Note:** Node.js compatibility tests (200+ vectors in [`node-compat.test.ts`](../src/__tests__/node-compat.test.ts)) are excluded from this document for brevity. Those tests verify that every proxied `path` function produces identical results to Node.js built-in `path`.',
    '',
  ]

  const grouped = new Map()
  for (const section of sections) {
    const key = section.heading
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(section)
  }

  for (const [heading, subs] of grouped) {
    lines.push(`## \`${heading}\``, '')

    for (const sub of subs) {
      if (sub.subHeading) lines.push(`### ${sub.subHeading}`, '')

      if (sub.examples.length > 0) {
        lines.push('| Input | Output |', '|-------|--------|')
        for (const ex of sub.examples) {
          const input = ex.input.replace(/\|/g, '\\|')
          const output = ex.output.replace(/\|/g, '\\|')
          lines.push(`| \`${input}\` | \`${output}\` |`)
        }
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

class DocReporter {
  /** @type {Error | undefined} */
  _error

  getLastError() {
    return this._error
  }

  /**
   * @param {Set<unknown>} _testContexts
   * @param {import('@jest/test-result').AggregatedResult} results
   */
  onRunComplete(_testContexts, results) {
    const sections = []

    // Sort test files by name for deterministic doc output regardless of
    // Jest's parallel execution order.
    const sortedTestResults = [...results.testResults].sort((a, b) =>
      path.basename(a.testFilePath).localeCompare(path.basename(b.testFilePath)),
    )

    for (const testFile of sortedTestResults) {
      const fileName = path.basename(testFile.testFilePath)
      if (SKIP_FILES.includes(fileName)) continue

      const groups = new Map()
      for (const assertion of testFile.testResults) {
        const key = assertion.ancestorTitles.join(' > ')
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(assertion)
      }

      for (const [, assertions] of groups) {
        if (assertions.length === 0) continue

        const ancestors = assertions[0].ancestorTitles
        if (ancestors.length < 2) continue

        const heading = ancestors[1]
        const subHeading = ancestors.length >= 3 ? ancestors[2] : undefined

        const examples = []
        for (const assertion of assertions) {
          if (assertion.status !== 'passed') continue
          const parsed = parseTestTitle(assertion.title)
          if (parsed) examples.push(parsed)
        }

        if (examples.length > 0) {
          sections.push({ heading, subHeading, examples })
        }
      }
    }

    if (sections.length === 0) {
      console.log('Doc reporter: no documentable test results found.')
      return
    }

    const markdown = buildMarkdown(sections)
    const projectRoot = process.cwd()
    const outputDir = path.join(projectRoot, 'docs')
    const outputPath = path.join(outputDir, 'API.md')

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
    fs.writeFileSync(outputPath, markdown, 'utf-8')
    console.log(`Doc reporter: wrote ${outputPath}`)
  }
}

module.exports = DocReporter
