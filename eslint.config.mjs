// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
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
