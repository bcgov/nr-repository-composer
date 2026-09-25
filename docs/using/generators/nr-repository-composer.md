# nr-repository-composer

This is a utility generator that makes it easier for developers to run the NR
Repository Composer in their repository.

This generator copies `nr-repository-composer.sh` to the root of the repository.
This script provides a containerized way to run other generators without
requiring local Node.js or Yeoman installation.

## Usage

Run once at the repository root to install the runner script:

```bash
./nr-repository-composer.sh . nr-repository-composer
```

This generator takes no prompts; it copies `nr-repository-composer.sh` into the
repository root.

**Suggested Next Steps:**

- [`backstage`](backstage.md) — Create Backstage component catalog file
- [`backstage-location`](backstage-location.md) — Create Backstage location catalog for monorepos
- [`gh-maven-build`](gh-maven-build.md), [`gh-nodejs-build`](gh-nodejs-build.md) — Set up build pipeline

## Generator source

[bcgov/nr-repository-composer/tree/main/src/nr-repository-composer](https://github.com/bcgov/nr-repository-composer/tree/main/src/nr-repository-composer)
