# backstage-location

This builds a Backstage location entity and outputs it to the file
`./catalog-info.yaml`. A location entity is necessary if you have a monorepo with
more than one service (component entity) in the repository. This file should
always be placed at the root of the repository to ensure that automation can
locate and process information about all the components.

You will be asked to input the location of all component catalog files (targets)
in your repository. All targets (`spec.targets` in the `catalog-info.yaml`)
should be a relative path within the repository. Example:
`./some-component/catalog-info.yaml`

You can rerun this composer to add additional targets or manually edit the file.
Remember to use the flag `--ask-answered` if you are adding additional targets.

## Usage

```bash
# Run at the monorepo root
./nr-repository-composer.sh . backstage-location

# Then run backstage in each component directory
./nr-repository-composer.sh ./frontend backstage
./nr-repository-composer.sh ./backend backstage
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Name** | Name of the location entity (default `components`). |
| **Targets** | Comma-separated relative paths to each component's `catalog-info.yaml` (for example `./frontend/catalog-info.yaml,./backend/catalog-info.yaml`). These become `spec.targets` and are what `gh-common-mono-build` discovers. Add more later by rerunning with `--ask-answered`. |

**Suggested Next Steps:**

- [`backstage`](backstage.md) — Run in each component directory to create component catalog files
- [`gh-common-mono-build`](gh-common-mono-build.md) — Set up unified build orchestration workflow (after component catalogs exist)
- [`gh-docs-deploy`](gh-docs-deploy.md) — Set up GitHub Pages documentation deployment

## Generator source

[bcgov/nr-repository-composer/tree/main/src/backstage-location](https://github.com/bcgov/nr-repository-composer/tree/main/src/backstage-location)
