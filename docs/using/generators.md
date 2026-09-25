# Generators

The NR Repository Composer is meant to be used in a predictable sequence. First,
set up the service metadata and repo scaffolding. Next, add the build workflow.
Then add deploy automation. Finally, use the utility generators for docs,
project automation, and supporting configuration.

This keeps the work focused on the service lifecycle rather than on individual
technologies. Most repositories will use a small subset of the generators, but
the pattern is consistent: add the catalog metadata, generate the build pipeline,
then generate the deployment pipeline or supporting automation for the service.

## Setup

These generators establish the service record and repo-level tooling that the
rest of the workflow depends on.

| Generator | Purpose |
| --- | --- |
| **[nr-repository-composer](generators/nr-repository-composer.md)** | Initializes the Composer tooling and repo support files. |
| **[backstage](generators/backstage.md)** | Creates the service's Backstage component metadata. |
| [backstage-location](generators/backstage-location.md) | Adds the monorepo location record used to discover service components. |
| **[ocp-knox-provision](generators/ocp-knox-provision.md)** | Prepares application access to Knox Vault through the AppRole secret provisioning flow. |

## Setup - Monorepo

These generators help coordinate monorepos by describing the location of services
and orchestrating builds.

| Generator | Purpose |
| --- | --- |
| [backstage-location](generators/backstage-location.md) | Adds the monorepo location record used to discover service components. |
| [gh-common-mono-build](generators/gh-common-mono-build.md) | Orchestrates builds across a monorepo and coordinates component pipelines. |

## Build

These generators create the CI and build pipelines that produce deployable
artifacts.

| Generator | Purpose |
| --- | --- |
| **[gh-nodejs-build](generators/gh-nodejs-build.md)** | Builds Node.js services and produces the OCI artifact. |
| **[gh-maven-build](generators/gh-maven-build.md)** | Builds Java services and produces the OCI artifact. |
| **[gh-docker-build](generators/gh-docker-build.md)** | Builds Docker containers with Buildx and produces the OCI artifact. |

## Deploy

These generators create the deployment workflows and operational automation that
move built artifacts to the target environment.

| Generator | Purpose |
| --- | --- |
| **[gh-oci-deploy-onprem](generators/gh-oci-deploy-onprem.md)** | Deploys OCI artifacts to on-premises infrastructure with the standard broker workflow. |
| [gh-oci-deploy-ocp](generators/gh-oci-deploy-ocp.md) | Deploys OCI artifacts to OpenShift via Jenkins. |
| [gh-tomcat-deploy-onprem](generators/gh-tomcat-deploy-onprem.md) | Deploys Tomcat-based Java services to on-premises infrastructure. |
| [gh-docs-deploy](generators/gh-docs-deploy.md) | Publishes documentation to GitHub Pages. |

## Utility

These generators add supporting repo automation that is useful but not part of
the core build and deploy lifecycle for every service.

| Generator | Purpose |
| --- | --- |
| [gh-issue-templates](generators/gh-issue-templates.md) | Adds standard GitHub issue templates. |
| [gh-polaris-composer-agent](generators/gh-polaris-composer-agent.md) | Adds the Copilot agent and prompt guidance pack for Polaris work. |
| [migrations](generators/migrations.md) | Adds database migration scaffolding and related documentation. |

## Reference

This section is for implementation details and metadata that is useful when you
need to know what a generator targets or where it stores configuration.

The shared
concepts that several generators rely on (OCI artifacts, deployment
configurations) are documented on the [OCI Artifacts](oci-artifacts.md) page.

| Generator | Platform | Technologies | Stores metadata in |
| --- | --- | --- | --- |
| [nr-repository-composer](generators/nr-repository-composer.md) | Tool setup | All | Podman, Docker |
| [backstage](generators/backstage.md) | Catalog service | All | Backstage (kind: component) |
| [backstage-location](generators/backstage-location.md) | Catalog monorepo | All | Backstage (kind: location) |
| [gh-common-mono-build](generators/gh-common-mono-build.md) | Pipeline orchestration | GitHub | GitHub Actions |
| [gh-docs-deploy](generators/gh-docs-deploy.md) | Documentation | GitHub | GitHub Actions, GitHub Pages |
| [gh-issue-templates](generators/gh-issue-templates.md) | Issue templates | All | GitHub issue templates |
| [gh-maven-build](generators/gh-maven-build.md) | Pipeline | GitHub | Java, GitHub Actions |
| [gh-polaris-composer-agent](generators/gh-polaris-composer-agent.md) | Chat command and agent guidance pack | All | Copilot prompt, agent, and skill files |
| [gh-tomcat-deploy-onprem](generators/gh-tomcat-deploy-onprem.md) | Deploy (collection ≤ v4.2.0) | GitHub | Java, Tomcat, GitHub Actions |
| [gh-nodejs-build](generators/gh-nodejs-build.md) | Pipeline | GitHub | Node.js, GitHub Actions |
| [gh-docker-build](generators/gh-docker-build.md) | Pipeline | GitHub | Docker, Container Buildx, GitHub Actions |
| [gh-oci-deploy-onprem](generators/gh-oci-deploy-onprem.md) | Deploy | GitHub | OCI artifacts, GitHub Actions |
| [gh-oci-deploy-ocp](generators/gh-oci-deploy-ocp.md) | Deploy | GitHub | OpenShift, OCI, Jenkins, GitHub Actions |
| [ocp-knox-provision](generators/ocp-knox-provision.md) | Secret provisioning | GitHub | OpenShift, Helm, Vault |
| [migrations](generators/migrations.md) | Database | All | FlyWay, Liquibase |
