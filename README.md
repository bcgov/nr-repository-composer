# NR Repository Composer

The NR Repository Composer templates repositories with files for building, deploying and cataloging applications. Developers use its generators to both initially generate and then maintain their repository. Its primary purpose is to scaffold NRIDS applications.

We recommend using the prebuilt container image to run the generators using Podman or Docker. Developers wanting to add new generators or make changes to existing ones should clone this repository and run the tool using NodeJS. The composer is built using [Yeoman](http://yeoman.io).

## Where to start

The composer's generators can be tested by creating a directory and initializing a Git repository. If you have multiple products (frontend, backend, and so on), in a single repository we consider that a monorepo and you should run the `backstage-location` generator to assist with placing a location catalog file at the root.

The `backstage` generator is first step for most applications and is run at the root of the product within the repository. From here, additional generators are used to scaffold the application's pipeline.

## Generator Library

| Generator | Usage | Platform | Technologies |
| ----------- | ----------- | ----------- | ----------- |
| backstage | Catalog service | All | Backstage (kind: component) |
| backstage-location | Catalog monorepo | All | Backstage (kind: location) |
| gh-common-mono-build | Pipeline orchestration | GitHub | GitHub Actions |
| gh-maven-build | Pipeline | GitHub | Java, GitHub Actions |
| gh-nodejs-build | Pipeline | GitHub | NodeJS, GitHub Actions |
| migrations | Database | All | FlyWay, Liquibase |

### Backstage: `backstage`

This builds a Backstage component entity and outputs it to the file `./catalog-info.yaml`. A Backstage component entity is equivalent to a NR Broker service. Automation and software catalogs will read this file to understand your component.

Single component (service) repositories should run this generator at the root of the repository. If you have monorepo (multiple components in a single repository), you should run the `backstage-location` generator at the root instead. This generator is then run in the individual directories for each component.

The generator will prompt you for various information about your component (service). Other generators will read from the catalog file and may store additional information in this file.

For each component entity, Developers should manually define the relationships `subcomponentOf`, `consumesApis` and `dependsOn`. The relationship `subcomponentOf` is used to determine build dependencies.

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

This builds a Backstage location entity and outputs it to the file `./catalog-info.yaml`. A location entity is necessary if you have a monorepo with more than one service (component entity) in the repository. This file should always be at the root of the repository. This ensures that automation can locate and process information about all the components in your repository.

You will be asked to input the location of all component catalog files (targets) in your repository. All targets (spec.targets in the catalog-info.yaml) should be a relative path within the repository. Example: `./some-component/catalog-info.yaml`

You can rerun this composer to add additional targets or manually edit the file. Remember to use the flag `--ask-answered` if you are adding additional targets.

### Backstage: `gh-common-mono-build`

This generates a unified build orchestration workflow for monorepos in GitHub. It reads all component catalog-info.yaml files defined in the root location entity and creates a single build workflow that coordinates the building of all components.

The generator automatically determines the correct build order by analyzing spec.subcomponentOf relationships between components. If a component is a subcomponent of another, it will be built first to satisfy the build dependency.

The generated workflow file appears in .github/workflows/build-release.yaml and delegates to each component's individual build workflow while managing job dependencies.

### Github Maven Build: `gh-maven-build`

This generates the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub.

The generated files will appear in your .github/workflows and .jenkins directories.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it.

### Github Node.js Build: `gh-nodejs-build`

This generates the CI workflow and NR Broker intention files for building Node.js in GitHub. The workflow assume that your `package.json` has a `build` command and your build places the files in `./dist`.

The generated files will appear in your .github/workflows and .jenkins directories.

This generator should be run at the root directory of your component (service) which should contain the `catalog-info.yaml` for it.

### DB Migrations: `migrations`

This assists in creating a standard layout of folders and files related to database migrations. This is a catch-all generator that supports manual and automated processes that incrementally alter your database.

## Command Options

### --ask-answered [Default: false]

If true, show prompts for already configured options. Generators read information stored in your `catalog-info.yaml` for previous prompt answers.

### --force [Default: false]

The option `--force` will allow Yeoman to automatically overwrite any existing files. Yeoman's built-in file comparison is redundant if you are running the composer on a clean repository. You can review the changes using git and in a pull request.

### --headless [Default: false]

If true, exit with error if any prompt is required. Obviously, this will always exit with an error if you enable `--ask-answered`. This is for scripting running the generators.

### --help [Default: false]

If true, displays usage and options and exits.

### --help-prompts [Default: false]

If true, display description and prompt details. It is recommended that new users use this option.

# Usage Prerequisites

There are two ways to run the composer.

## Using a container image

You will need to install one of the following. Either can run the composer using the prebuilt container (ghcr.io/bcgov/nr-repository-composer).

* [Podman](https://podman.io)
* [Docker](https://www.docker.com)

It is recommended that Windows users install and run the command using Node.js or Podman. Docker has a known issue with correctly modifying file permissions on mounted volumes.

**Note:** Windows Docker has an architectural issue with setting permissions for files mounted from volume.

## Using a local install

You will need to install node and clone this repository. You can checkout a version tag (vx.x.x) to run a specific release.

* [Node 24](https://nodejs.org/en)

The tool is build using [Yeoman](http://yeoman.io) which is a JavaScript library. You do not need to install Yeoman.

Install the dependencies with `npm ci` and link it with `npm link` so Yeoman can find the local installation. If you make code changes, you do not need to re-link it.

```bash
npm ci
npm link
```

# Usage

First, open a terminal and change the current working directory to the root of the checked out repository that you wish to scaffold. It is recommended that you run the generators only on a clean repository.

The generators will output a file to save your answers and will update any `catalog-info.yaml` catalogue file. This is useful if you want to rerun the generator in the future to take advantage of any updated workflows.

The example commands will run the 'gh-maven-build' generator. This creates or updates the files for building and deploying a Maven (Java) application.

## Container

### Using the Shell Script (Recommended)

The `nr-repository-composer.sh` script is the easiest way to run the composer. It automatically detects whether you have Podman or Docker installed (preferring Podman) and handles all the container configuration for you.

If you haven't cloned the repo, first download the shell script. As you may need to edit the image tag, you should save the file somewhere convenient.

**Download the script:**

```bash
# Download to current directory
curl -o nr-repository-composer.sh https://raw.githubusercontent.com/bcgov-nr/nr-repository-composer/main/nr-repository-composer.sh
chmod +x nr-repository-composer.sh
```

**Optional: Add to your PATH**

For easier access from anywhere, move the script to a directory in your PATH.

**Usage:**

```bash
# If script is in your PATH
cd /path/to/your/repo
nr-repository-composer.sh . backstage-location
nr-repository-composer.sh ./frontend backstage
nr-repository-composer.sh ./frontend gh-maven-build --help

# If running from the cloned repo or script in current directory
./nr-repository-composer.sh /path/to/your/repo gh-nodejs-build --ask-answered
```

**How it works:**

The script:
- **Auto-detects container runtime** - Uses Podman if available, otherwise Docker
- **Finds the git repository root** from your working directory and validates it
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

For manual control or CI/CD pipelines, you can run the container directly:

```bash
# Podman
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build

# Docker
docker run --rm -it -v ${PWD}:/src ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build
```

The examples map the current working directory to the '/src' directory inside of the container image. The generator container image uses '/src' as its working directory and will read and write files at that location.

The mounted `src` directory must always be the root of the repository. Use the "working directory" run argument (example: `-w /src/mydir`) to alter the working directory if you want to run the generator not at the root of the repository. The generators always need to be able to locate the `.git` folder as some files are output relative to it (not relative to the working directory).

## Local Install

For development or if you prefer not to use containers:

```bash
npx yo nr-repository-composer:gh-maven-build
```

# Developing Generators

## Requirements

The following are expected to be installed.

* node (v24+)
* podman

## Building the image

The Dockerfile can be built by running './build.sh'. The local image will be tagged as 'nr-repository-composer'.

# Assumptions and other errata

## Running a generator

The generators assume they are running inside of a git repository. It will search the current working directory and up the file system for the .git folder. All generators are built to be rerun and not re-ask prompts unless necessary. All information entered should be stored in a Backstage catalog file.

## Standard file names and locations

The generators all assume that the root of a service (and the repository) will have a Backstage file named `catalog-info.yaml`.

## Services and Components

The NR Broker and Backstage use the term service and component for the basically the same concept respectively.

NR Broker description:

> A service is a software component that runs in an environment.

Backstage description:

> A Component describes a software component. It is typically intimately linked to the source code that constitutes the component, and should be what a developer may regard a "unit of software", usually with a distinct deployable or linkable artifact

# Tools

See: [Tools](./tools)

# License

See: [LICENSE](./LICENSE)
