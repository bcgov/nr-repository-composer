/**
 * Jest configuration for the TypeScript source tree.
 *
 * The project is ESM (`"type": "module"`) with NodeNext resolution, where
 * imports use `.js` extensions that map to `.ts` source files at build time
 * (e.g. `import './git.js'` resolves to `git.ts`). To run tests without a
 * build step, we:
 *   1. Transform `.ts`/`.js` to CommonJS with @swc/jest.
 *   2. Strip the `.js` extension from relative imports so they resolve to the
 *      corresponding `.ts` source files.
 *
 * This file is CommonJS (`.cjs`) so it loads cleanly regardless of the
 * package's `"type": "module"` setting.
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          target: 'es2022',
        },
      },
    ],
  },
  // Map relative `.js` imports to their `.ts` source (NodeNext style).
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/*.test.ts'],
  // node_modules are CommonJS (chalk v4, yaml) and need no transformation.
  transformIgnorePatterns: ['/node_modules/'],
};
