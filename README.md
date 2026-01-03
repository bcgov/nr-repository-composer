# NR Repository Composer

The NR Repository Composer populates repositories with files for building, deploying, and cataloging applications. Developers use its generators to both initially set up and then maintain their repository. Its primary purpose is to scaffold NRIDS applications.

We recommend using the [prebuilt container](#container) to run the generators using Podman or Docker. A Linux bash script is provided to simplify running the container. Please read the [container documentation](#container) for the details.

Developers wanting to add new generators or make changes to existing ones should clone this repository and run the tool using Node.js. The composer uses [catalog entities](https://backstage.io/docs/features/software-catalog/descriptor-format) from [Backstage Software Catalog](https://backstage.io/docs/features/software-catalog/) to catalog the repository based on prompts given when running a generator. The composer is built using [Yeoman](http://yeoman.io).

## Where to start

Developers interact with the tool by running generators that prompt for information and then output templated files. The composer's generators can be tested by creating a directory and initializing it as a Git repository. If you have multiple components (frontend, backend, and so on) in a single repository, this is considered a monorepo and you should start with the `backstage-location` generator to place a location catalog file at the root.

The `backstage` generator creates the catalog file and is the first step for most components. It is run at the root of the component within the repository. If you have multiple components, each should be placed in a directory off the root. Otherwise, the root of a non-monorepo should contain the component catalog file. From this point, the developer runs additional generators as required in the folder for each component.

## Generator Library

| Generator | Usage | Platform | Technologies |
| ----------- | ----------- | ----------- | ----------- |
| [backstage](#backstage-backstage) | Catalog service | All | Backstage (kind: component) |
| [backstage-location](#backstage-backstage-location) | Catalog monorepo | All | Backstage (kind: location) |
| [gh-common-mono-build](#github-gh-common-mono-build) | Pipeline orchestration | GitHub | GitHub Actions |
| [gh-docs-deploy](#github-docs-deploy-gh-docs-deploy) | Documentation | GitHub | GitHub Actions, GitHub Pages |
| [gh-maven-build](#github-maven-build-gh-maven-build) | Pipeline | GitHub | Java, GitHub Actions |
| [gh-tomcat-deploy-onprem](#github-tomcat-on-prem-deploy-gh-tomcat-deploy-onprem) | Deploy | GitHub | Java, Tomcat, GitHub Actions |
| [gh-nodejs-build](#github-nodejs-build-gh-nodejs-build) | Pipeline | GitHub | Node.js, GitHub Actions |
| [gh-oci-deploy-onprem](#github-oci-on-prem-deploy-gh-oci-deploy-onprem) | Deploy | GitHub | OCI artifacts, GitHub Actions |
| [migrations](#db-migrations-migrations) | Database | All | FlyWay, Liquibase |

### Backstage: `backstage`

This builds a [Backstage component entity](https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-component) and outputs it to the file `./catalog-info.yaml`. A Backstage component entity is equivalent to an NR Broker service. Automation and software catalogs will read this file to understand your component.

Single-component (service) repositories should run this generator at the root of the repository. If you have a monorepo (multiple components in a single repository), you should run the `backstage-location` generator at the root instead. This generator is then run in the individual directories for each component.

The generator will prompt you for various information about your component (service). Other generators will read from the catalog file and may store additional information in this file.

For each component entity, developers should manually define the relationships `subcomponentOf`, `consumesApis`, and `dependsOn`. The relationship `subcomponentOf` is used to determine build dependencies.

| Field | What it expresses / semantics | Use cases / when to use it | What it does *not* do  |
| ----------- | ----------- | ----------- | ----------- |
| **`spec.subcomponentOf`** | States that a component is part of a larger component. | Use when your software architecture has components that are “parts” of other components. For example: a mobile app component might have subcomponents (UI framework, plugin modules etc.), or a larger system composed of many smaller deployable pieces where you want to reflect that part-of hierarchy. It helps with determining build order, visualization, and understanding boundaries. | It does *not* imply API dependency, or runtime dependency necessarily. It’s about composition or structure (“this is part of that”) rather than “using”, “invoking”, or “depending on”. |
| **`spec.consumesApis`** | States that a component uses (calls) one or more APIs. | When your component needs to call external APIs (internal or third-party) and you want to document that dependency: e.g. “this service consumes the User API”, “this frontend calls the Payments API”. Good for tracking API dependencies, understanding coupling, impact analysis. If an API changes, you can trace what components will be impacted. | It does *not* capture all dependencies (for instance low-level infrastructure or resources) and doesn't imply subcomponent relationship. Also doesn’t capture “resource” dependencies like databases, storage, etc.—those are better done via `dependsOn`. Also, it’s not about “part of” structure but about “uses / invokes”. |
| **`spec.dependsOn`** | States that a component (or resource) depends on other components or resources. | Use this when your component needs something else to operate, but that thing is *not* necessarily an API: e.g. a database, a message queue, another service, infrastructural resource, or even another component for build-time or runtime dependency. It covers both resource kind entities and component kind entities. | It’s less specific: doesn’t distinguish *how* the dependency is used (“via API”, “via sharing library”, etc.). And doesn’t imply “is part of”. Also, if an API dependency is relevant, using `consumesApis` gives semantics that are more specific / meaningful in API-centric views. |

#### Example website with a dependent library component

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: artist-web
  description: The place to be, for great artists
spec:
  type: website
  lifecycle: production
  owner: artist-relations-team
  consumesApis:
    - component:artist-api
  dependsOn:
    - resource:artists-db
```

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: artist-common
  description: Common library for artist portal
spec:
  type: library
  lifecycle: production
  owner: artist-relations-team
  subcomponentOf:
    - component:artist-web
```

### Backstage: `backstage-location`

This builds a Backstage location entity and outputs it to the file `./catalog-info.yaml`. A location entity is necessary if you have a monorepo with more than one service (component entity) in the repository. This file should always be placed at the root of the repository to ensure that automation can locate and process information about all the components.

You will be asked to input the location of all component catalog files (targets) in your repository. All targets (spec.targets in the catalog-info.yaml) should be a relative path within the repository. Example: `./some-component/catalog-info.yaml`

You can rerun this composer to add additional targets or manually edit the file. Remember to use the flag `--ask-answered` if you are adding additional targets.

### GitHub Docs Deploy: `gh-docs-deploy`

This generates a GitHub Actions workflow for deploying static documentation to GitHub Pages. The workflow automatically deploys content from the `docs/` folder in your repository whenever changes are pushed to the main branch.

The generated workflow file appears at `.github/workflows/docs-deploy.yaml`.

**Setup:**
- Enable GitHub Pages in your repository settings
- Set the Pages source to "GitHub Actions" in repository Settings > Pages
- Create a `docs/` folder with your static documentation content

If the repository has multiple components, pick one in which to run the generator. This workflow only uploads documentation from a single docs folder in the repository.

### GitHub: `gh-common-mono-build`

This generates a unified build orchestration workflow for monorepos in GitHub. It reads all component catalog-info.yaml files defined in the root location entity and creates a single build workflow that coordinates the building of all components.

The generator automatically determines the correct build order by analyzing spec.subcomponentOf relationships between components. If a component is a subcomponent of another, it will be built first to satisfy the build dependency.

The generated workflow file appears in `.github/workflows/build-release.yaml` and delegates to each component's individual build workflow while managing job dependencies.

### GitHub Maven Build: `gh-maven-build`

This generates the CI workflow and NR Broker intention files for building a Java application using Maven in GitHub. The WAR artifact can then be used in a Tomcat deployment.

The generated files will appear in your `.github/workflows` and `.jenkins` directories.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it.

### GitHub Tomcat On-Prem Deploy: `gh-tomcat-deploy-onprem`

This generates the deploy workflow and NR Broker intention files for deploying Java/Tomcat applications to on-premises infrastructure via GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This generator also invokes the `pd-java-playbook` generator to create the Ansible playbook configuration.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it. Run the `gh-maven-build` generator first to set up the build workflow.

### GitHub Node.js Build: `gh-nodejs-build`

This generates the CI workflow and NR Broker intention files for building Node.js applications in GitHub. The workflow assumes that your `package.json` has a `build` command and that your build places the files in `./dist`. The built OCI artifact can be used in a Node.js deployment or as static assets.

The generated files will appear in your `.github/workflows` and `.jenkins` directories.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it.

### GitHub OCI On-Prem Deploy: `gh-oci-deploy-onprem`

This generates the deploy workflow and NR Broker intention files for deploying OCI artifacts (Node.js or Java/Tomcat applications) to on-premises infrastructure via GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This generator prompts you to select a deployment type (Node.js or Tomcat), and then invokes `pd-oci-playbook` to create the Ansible playbook configuration.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it. Run the appropriate build generator (`gh-nodejs-build` or `gh-maven-build`) first to set up the build workflow.

### DB Migrations: `migrations`

This assists in creating a standard layout of folders and files related to database migrations. This is a catch-all generator that supports manual and automated processes that incrementally alter your database.

## Command Options

### --ask-answered [Default: false]

If true, show prompts for already configured options. Generators read information stored in your `catalog-info.yaml` for previous prompt answers.

### --force [Default: false]

The `--force` option allows Yeoman to automatically overwrite any existing files. Yeoman's built-in file comparison is redundant if you are running the composer on a clean repository. You can review the changes using Git and in a pull request.

### --headless [Default: false]

If true, exit with an error if any prompt is required. Obviously, this will always exit with an error if you enable `--ask-answered`. This option is useful for scripting the generators.

### --help [Default: false]

If true, displays usage and options and exits.

### --help-prompts [Default: false]

If true, display description and prompt details. It is recommended that new users use this option.

# Usage Prerequisites

There are two ways to run the composer.

## Using a container image

You will need to install one of the following, either of which can run the composer using the prebuilt container (ghcr.io/bcgov/nr-repository-composer):

* [Podman](https://podman.io)
* [Docker](https://www.docker.com)

It is recommended that Windows users install and run the command using Node.js or Podman.

**Note:** Windows Docker has an architectural issue with correctly setting file permissions on mounted volumes.

## Using a local install

You will need to install Node.js and clone this repository. You can check out a version tag (vx.x.x) to run a specific release.

* [Node 24](https://nodejs.org/en)

The tool is built using [Yeoman](http://yeoman.io), which is a JavaScript library. You do not need to install Yeoman separately.

Install the dependencies with `npm ci` and link it with `npm link` so Yeoman can find the local installation. If you make code changes, you do not need to re-link it.

```bash
npm ci
npm link
```

# Usage

First, either initialize a new Git repository or clone an existing repository. It is recommended that you run the generators only on a clean repository.

The generators will save your answers and update any `catalog-info.yaml` catalog file. This is useful if you want to rerun the generator in the future to take advantage of any updates.

## Container

### Using the Shell Script (Recommended)

The `nr-repository-composer.sh` script is the easiest way to run the composer. It automatically detects whether you have Podman or Docker installed (preferring Podman) and handles all the container configuration for you.

You can clone this repository or download just the shell script from GitHub.

**Download the script:**

```bash
# Download to current directory
curl -o nr-repository-composer.sh https://raw.githubusercontent.com/bcgov-nr/nr-repository-composer/main/nr-repository-composer.sh
chmod +x nr-repository-composer.sh
```

You can optionally add the script to a directory in your PATH.

**Usage:**

```bash
# Syntax: nr-repository-composer.sh <working-directory> <generator> [options...]
#   <working-directory> - Path to your repository or subdirectory within it
#   <generator>         - Generator name (e.g., backstage, gh-maven-build)
#   [options...]        - Additional generator options (e.g., --help, --ask-answered)

# If script is in your PATH
cd /path/to/your/repo
nr-repository-composer.sh . backstage-location
nr-repository-composer.sh ./frontend backstage
nr-repository-composer.sh ./frontend gh-maven-build --help

# If running from the cloned repo or script in current directory
./nr-repository-composer.sh /path/to/your/repo gh-nodejs-build --ask-answered
```
Note: The script prefixes `nr-repository-composer:` automatically to the generator so you can omit it.

**How it works:**

The script:
- **Auto-detects container runtime** - Uses Podman if available, otherwise Docker
- **Finds the git repository root** from the working directory and validates it
- **Mounts the entire repository** as `/src` in the container
- **Sets the working directory** to match your relative location within the repo
- **Auto-prefixes generator names** - Adds `nr-repository-composer:` automatically (you can omit it)
- **Pulls latest image** by default - Set `PULL_IMAGE="false"` in the script to disable
- **Passes all options** to the generator

**Configuration:**

You can edit the script to customize behavior:

```bash
# Modify this to change the image version used
IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"

# Set to "false" to skip pulling the latest image (uses cached version)
PULL_IMAGE="true"
```

### Direct Container Commands

For manual control, you can run the container directly:

```bash
# Podman
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build

# Docker
docker run --rm -it -v ${PWD}:/src ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build
```

These examples map the current working directory to the `/src` directory inside the container image. The generator container image uses `/src` as its working directory and will read and write files at that location.

The mounted `/src` directory must always be the root of the repository. Use the "working directory" run argument (for example, `-w /src/mydir`) to alter the working directory if you want to run the generator somewhere other than the root of the repository. The generators always need to be able to locate the `.git` folder, as some files are output relative to it (not relative to the working directory).

## Local Install

For development or if you prefer not to use containers:

```bash
npx yo nr-repository-composer:gh-maven-build
```

# Developing Generators

## Requirements

The following are expected to be installed:

* Node.js (v24+)
* Podman

## Building the image

The Dockerfile can be built by running `./build.sh`. The local image will be tagged as `nr-repository-composer`.

# Assumptions and other errata

## Running a generator

The generators assume they are running inside a Git repository. They will search the current working directory and up the file system for the `.git` folder. All generators are designed to be rerun without re-asking prompts unless necessary. All information entered is stored in a Backstage catalog file.

## Standard file names and locations

The generators all assume that the root of a service (and the repository) will have a Backstage file named `catalog-info.yaml`.

## Services and Components

NR Broker and Backstage use the terms "service" and "component" for essentially the same concept, respectively.

NR Broker description:

> A service is a software component that runs in an environment.

Backstage description:

> A Component describes a software component. It is typically intimately linked to the source code that constitutes the component, and should be what a developer may regard a "unit of software", usually with a distinct deployable or linkable artifact

# Tools

See: [Tools](./tools)

# License

See: [LICENSE](./LICENSE)
