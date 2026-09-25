# gh-common-mono-build

This generates a unified build orchestration workflow for monorepos in GitHub. It
reads all component `catalog-info.yaml` files defined in the root location entity
and creates a single build workflow that coordinates the building of all
components.

The generator automatically determines the correct build order by analyzing
`spec.subcomponentOf` relationships between components. If a component is a
subcomponent of another, it will be built first to satisfy the build dependency.

The generated workflow file appears in `.github/workflows/build-release.yaml` and
delegates to each component's individual build workflow while managing job
dependencies.

## Usage

```bash
# Run at the monorepo root, after each component's catalog and build workflow exist
./nr-repository-composer.sh . gh-common-mono-build
```

## Inputs

This generator takes no prompts. It reads the root location entity created by
`backstage-location` and derives its workflow from:

- `spec.targets` — the list of component `catalog-info.yaml` files to build.
- `spec.subcomponentOf` — used to compute build order; a subcomponent is built
   before the component it belongs to.

If a component's `subcomponentOf` references a name not present in `spec.targets`,
the generator fails with a "not found in mono-repo" error.

**Suggested Next Steps:**

- [`gh-maven-build`](gh-maven-build.md), [`gh-nodejs-build`](gh-nodejs-build.md) — Run in each component directory to create individual build workflows

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-common-mono-build](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-common-mono-build)
