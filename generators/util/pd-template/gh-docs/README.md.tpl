<!-- README.md.tpl:START -->

## Working With the Polaris Pipeline

This repository uses the Polaris Pipeline to build and deploy.

Refer to [nr-polaris-docs](https://github.com/bcgov/nr-polaris-docs) for more information about how to use the Polaris Pipeline.

### Setting Up Your Build Environment

Use the `env.sh` script to initialize your build environment. This script validates your service configuration (catalog-info.yaml), authenticates with Knox Vault, and loads build-specific environment variables.

#### Usage

```bash
source env.sh [mode] [path] [--skip-vault]
```

**Parameters:**
- `mode`: `tools` (default) or `local`
  - `tools` mode: Setup for CI/CD tool builds (uses Polaris tools environment)
  - `local` mode: Setup for local development (uses local environment)
- `path`: Directory containing catalog-info.yaml (default: current directory)
- `--skip-vault`: Skip Vault authentication (for offline/CI scenarios)

#### Examples

<% if (isSingleServiceAtRoot) { -%>
**Single Service Repository**
```bash
# Load from current directory with tools environment
source env.sh

# Load with local development environment (for running local builds)
source env.sh local

# Skip Vault authentication (for CI/CD)
source env.sh tools --skip-vault
```
<% } else if (isMonorepo) { -%>
**Monorepo Repository (Location with Components)**

Services in this repository:
<% services.forEach(service => { -%>
- `<%= service.name %>` (<%= service.path.replace(/\/catalog-info\.yaml$/, '') %>)<% if (service.hasMaven) { %> - Maven build<% } %>
<% }); -%>

```bash
<% services.forEach((service, index) => { -%>
# Load settings for <%= service.name %>
source env.sh tools ./<%= service.path.replace(/\/catalog-info\.yaml$/, '') %>
<% if (index < services.length - 1) { %>
<% } -%>
<% }); -%>

# Load with local development environment (for running local builds)
source env.sh local ./<%= services[0].path.replace(/\/catalog-info\.yaml$/, '') %>

# Load root location settings
source env.sh tools .
```
<% } else { -%>
**Repository Layout**

This repository is structured with services in subdirectories. Use the service path when sourcing the environment:

```bash
# Load settings for a service in a subdirectory (tools mode)
source env.sh tools ./service-name

# Load with local development environment (for running local builds)
source env.sh local ./service-name

# Load root location settings
source env.sh tools .
```
<% } -%>

#### Local Development Build Environment

The `local` mode is used to setup the environment to run your application locally on your development machine. When you run:

```bash
source env.sh local
```

This script:
1. Validates the service configuration (catalog-info.yaml)
2. Authenticates with Knox Vault (unless `--skip-vault` is specified)
3. Sources `.env-tools.sh` to load service identification, Maven configuration, and artifact repository credentials from Vault
4. Sources the `.env-local.sh` file to set additional development-specific environment variables

The `.env-tools.sh` file is auto-generated and handles:
- Service identification (PROJECT_NAME, SERVICE_NAME)
- Maven/build configuration (POM_ROOT, MAVEN_ARGS) if your service uses Maven
- Fetching read-only artifact repository credentials from Vault

The `.env-local.sh` file is where you can add application-specific settings for your local development environment:

```bash
#!/bin/bash

# .env-local.sh - Local development environment settings
# (.env-tools.sh is already sourced with auto-generated configuration)

# Application configuration
export APP_ENV=development
export LOG_LEVEL=debug

# Database connection (if your app needs a local database)
export DATABASE_URL=jdbc:postgresql://localhost:5432/myapp_dev

# Cache settings for development
export CACHE_ENABLED=false

# Any other development-specific settings
export DEV_FEATURE_FLAG=true

# Example: Fetch additional secrets from Vault if needed
# (Only fetch if Vault authentication is available)
if [[ "$SKIP_VAULT" != "true" ]]; then
  # Fetch a custom secret field from Vault
  export MY_CUSTOM_API_KEY=$(vault kv get -field=api_key "apps/tools/${PROJECT_NAME}/${SERVICE_NAME}")
fi
```

Add your custom settings to `.env-local.sh` to configure your local development environment. The artifact repository credentials are automatically provided via `.env-tools.sh` sourcing from Vault, keeping your workstation secure.

#### Build Secrets Configuration

The environment setup uses two different configurations for build secrets, depending on where the build runs:

**`toolsBuildSecrets`** - CI/CD Pipeline Secrets
- Default: `ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD`
- Used when running builds in the CI/CD pipeline (tools environment)
- These are the full credentials used by automated builds in GitHub Actions and other CI/CD systems
- Configured in your root catalog-info.yaml under `metadata.annotations.playbook.io.nrs.gov.bc.ca/toolsBuildSecrets`

**`toolsLocalBuildSecrets`** - Local Development Secrets
- Default: Same as toolsBuildSecrets
- Used when running builds locally with `source env.sh local`
- **Critical security note:** Should only contain **read-only credentials** for artifact repositories
- Used for downloading/reading artifacts during local development (e.g., `mvnw clean package`)
- Should NOT contain write/publish credentials to prevent accidental artifacts being published from your workstation
- Configured in your root catalog-info.yaml under `metadata.annotations.playbook.io.nrs.gov.bc.ca/toolsLocalBuildSecrets`

**Security Best Practice:** Keep your local credentials separate and read-only to prevent accidentally publishing artifacts or modifying production repositories from your development machine.

**Updating Build Secrets**

To change which secrets are loaded during builds:

1. Edit root `catalog-info.yaml`
2. Update the annotations:
   ```yaml
   metadata:
     annotations:
       playbook.io.nrs.gov.bc.ca/toolsBuildSecrets: "ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD"
       playbook.io.nrs.gov.bc.ca/toolsLocalBuildSecrets: "READ_ONLY_ARTIFACTORY_USERNAME,READ_ONLY_ARTIFACTORY_PASSWORD"
   ```
3. Regenerate the environment files using the pd-java-playbook or pd-oci-playbook generator
4. Re-source env.sh in your shell

<% if (hasMavenBuild) { -%>
#### Building with Maven

You can build locally using the Maven wrapper:

```bash
# From service directory, after sourcing env.sh
./mvnw clean package

# With specific profile (e.g., for GitHub Packages)
./mvnw clean deploy -Pgithub

# For artifactory
./mvnw clean deploy -Partifactory

# Run tests
./mvnw test

# Skip tests
./mvnw clean package -DskipTests
```

The maven-wrapper automatically uses the environment variables configured in env.sh.
<% } -%>

## Resources

[NRM Architecture Confluence: GitHub Repository Best Practices](https://apps.nrs.gov.bc.ca/int/confluence/x/TZ_9CQ)

<!-- README.md.tpl:END -->
