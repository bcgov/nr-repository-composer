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
described above, so it is **not present in a fresh clone** and you create it
yourself.

Because the composer requires a `.git` directory and walks up from the working
directory to find the repo root (it exits with an error otherwise), the scratch
directory must be its own git repository. Create it and initialize its git repo
once:

```bash
mkdir test
cd test
git init
```

`git init` gives the composer the `.git/config` it needs to locate the repo
root, but adds no `remote origin`, so any generator that derives a GitHub slug
from the remote will find none. Create a `catalog-info.yaml` in a subdirectory
(for example `test/mod1`) and add the `github.com/project-slug` annotation to
it, or configure a remote, before running a generator that needs the slug.

Run a generator against the example directory:

```bash
cd ..
./nr-repository-composer.sh ./test backstage --ask-answered
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
