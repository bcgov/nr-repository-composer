<!-- README-buildenv.md.tpl:START -->

### Setting Up Your Build Environment

Use the `env.sh` script to initialize your build or development runtime environment.

Refer to [nr-polaris-docs](https://bcgov.github.io/nr-polaris-docs/#/BUILD) for more information on how `env.sh` sets up the build environment.

#### Usage

```bash
source env.sh [mode] [path] [--skip-vault]
```

**Parameters:**
- `mode`: `build` (default) or `local`
  - `build` mode: Setup for builds
  - `local` mode: Setup for local development runtime
- `path`: Directory containing catalog-info.yaml (default: current directory)
- `--skip-vault`: Skip Vault authentication (for offline/CI scenarios)

#### Examples

<% if (!isMonorepo) { -%>
<!-- Single Service Repository -->
```bash
# Load build environment
source env.sh

# Load local development runtime environment
source env.sh local

# Skip Vault authentication
source env.sh build --skip-vault
```


#### Setting the Artifact Version

The `pom.xml` uses a `VERSION` environment variable and the `${revision}` property for the project version (see https://maven.apache.org/guides/mini/guide-maven-ci-friendly.html).

A profile named `version-from-env` activates automatically when the `VERSION` environment variable is present and sets `${revision}` to its value.

When the environment variable is absent, the POM uses the hardcoded value in the properties section.

The Flatten Maven Plugin is used for install / deploy as described in the official Maven CI Friendly guide.

| Context | Version resolved |
|---|---|
| **Local build — no env var, no env.sh** | Maven builds with version `UNSET` (clearly invalid, won't be mistaken for a real release) |
| **Local build — after `source env.sh`** | `.env-build.sh` reads the base version from `VERSION` file (unless `VERSION` is already set in the shell) |
| **CI/CD — branch or PR** | "Set VERSION" step computes `<base>-<pr-or-branch>-SNAPSHOT` and writes it to `$GITHUB_ENV`; `env.sh` sees it already set and skips the fallback |
| **CI/CD — tag `v1.2.3`** | "Set VERSION" step strips the `v` prefix and writes `VERSION=1.2.3` to `$GITHUB_ENV` |

To build with a specific version locally:

```bash
export VERSION=1.2.0-SNAPSHOT
source env.sh build --skip-vault
./mvnw clean package
```

Or as a one-liner (no shell modification):

```bash
VERSION=1.2.0-SNAPSHOT ./mvnw clean package
```

To bump the base development version, update only the `VERSION` file — `.env-build.sh` and the pipeline both derive from it automatically.
<% } else if (isMonorepo) { -%>
<!-- Monorepo Repository (Location with Components) -->

```bash
<% services.forEach((service, index) => { -%>
# Load build environment for <%= service.name %>
source env.sh build ./<%= service.path.replace(/\/catalog-info\.yaml$/, '') %>
<% }); -%>
```
<% } -%>

<!-- Please add section showing how to build this application after the template marker -->

<!-- README-buildenv.md.tpl:END -->
