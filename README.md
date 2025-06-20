# NR Repository Composer

The NR Repository Composer is a suite of generators for installing and updating NRIDS tooling. It can scaffold NRIDS applications using GitHub Actions for building and deploying them, add catalog files (Backstage), and more.

The generators are created using [Yeoman](http://yeoman.io). For distribution, it is packaged into a container image for running on a developer's machine using Docker or Podman.

## Generator Library

| Generator | Usage | Platform | Technologies |
| ----------- | ----------- | ----------- | ----------- |
| backstage | Catalog service | All | Backstage (kind: component) |
| backstage-location | Catalog monorepo | All | Backstage (kind: location) |
| gh-maven-build | Pipeline | GitHub | Java, GitHub Actions |
| gh-nodejs-build | Pipeline | GitHub | NodeJS, GitHub Actions |
| migrations | Database | All | FlyWay, Liquibase |

### Backstage: `backstage`

This builds a Backstage component entity and outputs it to the file `./catalog-info.yaml` so that your repository can be added to software catalogs. A Backstage component is equivalent to a NR Broker service.

All software should run this generator at the root folder of your service in your repository. The generator will prompt you for various information about your service. Other generators for your service will read from the catalog file and may store additional information in this file.

Single service repositories should run this (and create the file) at the root of the repository.If you have a component file not located at the root of the repository, you must use `backstage-location` which builds a file that describe where to look for the catalog data.

### Backstage: `backstage-location`

This builds a Backstage location entity and outputs it to the file `./catalog-info.yaml` so that your repository can be added to software catalogs.

This Backstage entity is necessary if you have a monorepo with more than one service in the repository or if you have a single service where you store the component entity file not at the repository root. This file should always be at the root of the repository.

You will be asked to input the location of all component catalog files (targets) in your repository. All targets (spec.targets in the catalog-info.yaml) should be a relative path within the repository. Example: `./some/catalog-info.yaml`

Remember to use the flag `--ask-answered` if you are adding additional targets.

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

The option `--force` will allow Yoeman to automatically overwrite any existing files. Yoeman's built-in file comparison is redundant if you are running the composer on a clean repository. You can review the changes using git and in a pull request.

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

It is recommended that Windows users install and run the command using Node.js or Podman. Docker has a known issue with correctly modifying file permissions on mounted volumes. Since the tool needs to set permissions for files like bash scripts, commands will not execute properly on Windows when using Docker.

## Using a local install

You will need to install node and clone this repository. You can checkout a version tag (vx.x.x) to run a specific release.

* [Node 22](https://nodejs.org/en)

The tool is build using [Yeoman](http://yeoman.io) which is a JavaScript library. You do not need to install Yoeman.

Install the dependencies with `npm ci` and link it with `npm link` so Yoeman can find the local installation. If you make code changes, you do not need the re-link it.

```bash
npm ci
npm link
```

# Usage

First, open a terminal and change the current working directory to the root of the checked out repository that you wish to scaffold. It is recommended that you run the generators only on a clean repository.

The generators will output a file to save your answers and will update any `catalog-info.yaml` catalogue file. This is useful if you want to rerun the generator in the future to take advantage of any updated workflows.

The example command will run the 'gh-maven-build' generator. This creates or updates the files for building and deploying a Maven (Java) application.

### Container

```
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build
```
```
docker run --rm -v ${PWD}:/src ghcr.io/bcgov/nr-repository-composer:latest nr-repository-composer:gh-maven-build
```

The examples map the current working directory to the '/src' directory inside of the container image. The generator container image uses '/src' as its working directory and will read and write files at that location.

The mounted `src` directory must always be the root of the repository. Use the "working directory" run argument (example: `-w /src/mydir`) to alter the working directory if you want to run the generator not at the root of the repository. The generators always need to be able to locate the `.git` folder as some files are output relative to it (not relative to the working directory).

### Local

```bash
npx yo nr-repository-composer:gh-maven-build
```

# Developing Generators

## Requirements

The following are expected to be installed.

* node (v22+)
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
