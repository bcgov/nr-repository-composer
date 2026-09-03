# Generators

The composer is a collection of Yeoman generators. Each generator prompts for
information and writes templated files into your repository. Generators are
designed to be rerun without re-asking prompts unless necessary — all information
is stored in a Backstage catalog file.

Each generator has its own page under [`generators/`](generators/). The table
below is the index. The shared concepts that several generators rely on
(OCI artifacts, deployment configurations) are documented on the
[OCI Artifacts](oci-artifacts.md) page.

| Generator | Usage | Platform | Technologies |
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
| [gh-oci-deploy-onprem](generators/gh-oci-deploy-onprem.md) | Deploy | GitHub | OCI artifacts, GitHub Actions |
| [migrations](generators/migrations.md) | Database | All | FlyWay, Liquibase |
