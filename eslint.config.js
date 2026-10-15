// @ts-check
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // demo/video/ is its own package (React, Remotion) with its own tsc check
  { ignores: ['scripts/', 'node_modules/', 'gallery/dist/', 'demo/video/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // the house style: `${port}` in messages, `catch {}` where a failure just means "skip"
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // `a || b` on strings means "empty counts as missing" (hints, component names); keep it
      '@typescript-eslint/prefer-nullish-coalescing': ['error', { ignorePrimitives: { string: true } }],
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
    },
  },
  svelte.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: { parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] } },
    rules: {
      // svelte-check type-checks these, browser globals included
      'no-undef': 'off',
      // flags `x = $bindable()`, which is how Svelte declares a bindable prop
      '@typescript-eslint/no-useless-default-assignment': 'off',
    },
  },
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
);
