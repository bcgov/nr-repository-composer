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

**Suggested Next Steps:**

- [`gh-maven-build`](gh-maven-build.md), [`gh-nodejs-build`](gh-nodejs-build.md) — Run in each component directory to create individual build workflows
