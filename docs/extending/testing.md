# Testing

The project uses [Jest](https://jestjs.io) with `@swc/jest` to run TypeScript
tests without a build step.

## Running tests

```bash
npm test              # run all tests
npm run test:watch    # run in watch mode
```

## How the test runner works

The project is ESM (`"type": "module"`) with NodeNext resolution, where imports
use `.js` extensions that map to `.ts` source files at build time (for example,
`import './git.js'` resolves to `git.ts`). To run tests without a build step, the
Jest configuration:

1. Transforms `.ts`/`.js` to CommonJS with `@swc/jest`.
2. Strips the `.js` extension from relative imports so they resolve to the
   corresponding `.ts` source files.

The config lives in `jest.config.cjs` (CommonJS, so it loads cleanly regardless of
the package's `"type": "module"` setting).

## Testing generators locally

The `test/` directory is a git-ignored local scratch repository (see the
`/test*` entry in `.gitignore`) used to run generators by hand. It is not
committed to source control and is not used by the automated Jest suite
described above. It holds example `catalog-info.yaml` files to exercise a
generator manually:

- `test/catalog-info.yaml` — Location entity for a monorepo
- `test/mod1/catalog-info.yaml` — Component entity example
- `test/mod2/catalog-info.yaml` — Component entity example
- `test/mod3/catalog-info.yaml` — Java/Maven component entity example

Run a generator against one of these example directories:

```bash
./nr-repository-composer.sh ./test/mod1 backstage --ask-answered
```

## Writing a test

Test files use the `*.test.ts` naming convention and are matched by
`testMatch: ['**/*.test.ts']`. Use `yeoman-test` and `yeoman-assert` to run a
generator and assert on its output:

```ts
import { create } from 'yeoman-test';
import assert from 'yeoman-assert';

describe('backstage', () => {
  it('creates catalog-info.yaml', async () => {
    await create('backstage')
      .withPrompts({ projectName: 'test', serviceName: 'test-service' })
      .run();
    assert.file('catalog-info.yaml');
   });
});
```

## Linting

Lint the TypeScript source with:

```bash
npm run lint
```
