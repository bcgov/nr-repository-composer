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
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    rules: {
      'no-extra-boolean-cast': 'off',
      'no-empty-function': 'off',
    },
  },
];
