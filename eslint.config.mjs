// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['generators/'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
    },
  },
  {
    files: ['**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-extra-boolean-cast': 'off',
      'no-empty-function': 'off',
    },
  },
];