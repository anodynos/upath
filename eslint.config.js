import eslint from '@eslint/js'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    ignores: ['dist/', 'coverage/', 'node_modules/'],
  },
  // The proxy pattern intentionally uses Function type for dynamic wrapping
  {
    files: ['src/index.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
  // CJS reporter uses require/module/process/console
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  // Test files may use Function type for dynamic assertions
  {
    files: ['src/__tests__/**'],
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
