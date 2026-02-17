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
