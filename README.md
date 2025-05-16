# NR Repository Composer

The NR Repository Composer is a suite of generators for installing and updating NRIDS tooling. It can scaffold NRIDS applications using GitHub Actions for building and deploying them, add catalog files (Backstage), and more.

The generators are created using [Yeoman](http://yeoman.io). For distribution, it is packaged into a container image for running on a developer's machine using Docker or Podman.

## Generator Library

All generators are built to be rerun multiple times.

| Generator | Platform | Deploy to | Technologies |
| ----------- | ----------- | ----------- | ----------- |
| backstage | All | - | Backstage |
| gh-maven-build | GitHub | Bring your own or on-premise | Java, GitHub Actions |
| gh-nodejs-build | GitHub | Bring your own or on-premise | NodeJS, GitHub Actions |
| migrations | All | - | FlyWay, Liquibase |

### Backstage: backstage

This generates a `catalog-info.yaml` catalogue file. It will prompt you for various information about your application.

Other generators will read from the catalog file to skip prompts that ask for information stored in this file.

### Github Maven Build: gh-maven-build

This generates the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub.

The generated files will appear in your .github/workflows and .jenkins directories.

### Github Node.js Build: gh-nodejs-build

This generates the CI workflow and NR Broker intention files for building Node.js in GitHub. The workflow assume that your `package.json` has a `build` command and your build places the files in `./dist`.

The generated files will appear in your .github/workflows and .jenkins directories.

### DB Migrations: migrations

This assists in creating a standard layout of folders and files related to database migrations. This is a catch-all generator that supports manual and automated processes that incrementally alter your database.

## Command Options

### --ask-answered [Default: false]

If true, show prompts for already configured options. Generators read information stored in your `catalog-info.yaml` for previous prompt answers.

### --force [Default: false]

The option `--force` will allow Yoeman to automatically overwrite any existing files. Yoeman's built-in file comparison is redundant if you are running the composer on a clean repository. You can review the changes using git and in a pull request.

### --headless [Default: false]

If true, exit with error if any prompt is required. Obvisouly, this will always exit with an error if you enable `--ask-answers`. This is for scripting running the generators.

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
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```
```
docker run --rm -v ${PWD}:/src ghcr.io/bcgov/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```

The examples map the current working directory to the '/src' directory inside of the container image. The generator container image uses '/src' as its working directory and will read and write files at that location.

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

# Tools

See: [Tools](./tools)

# License

See: [LICENSE](./LICENSE)
