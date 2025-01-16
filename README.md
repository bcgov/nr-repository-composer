# NR Repository Composer

The NR Repository Composer is a suite of generators for installing and updating NRIDS tooling. It can scaffold NRIDS applications using GitHub Actions for building and deploying them, add catalog files (Backstage), and more.

The generators are created using [Yeoman](http://yeoman.io). For distribution, it is packaged into a container image for running on a developer's machine using Docker or Podman.

# Prerequisites

There are two ways to run the composer.

## Run using a container image

You will need to install one of the following. Either can run the composer using the prebuilt container (ghcr.io/bcgov-nr/nr-repository-composer).

* [Podman](https://podman.io)
* [Docker](https://www.docker.com)

It is recommended that Windows users install and run the command using Node.js or Podman. Docker has a known issue with correctly modifying file permissions on mounted volumes. Since the tool needs to set permissions for files like bash scripts, commands will not execute properly on Windows when using Docker.

## Run using a local install

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
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov-nr/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```
```
docker run --rm -it -v ${PWD}:/src ghcr.io/bcgov-nr/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```

The examples map the current working directory to the '/src' directory inside of the container image. The generator container image uses '/src' as its working directory and will read and write files at that location.

### Local

```bash
npx yo nr-repository-composer:gh-maven-build
```

## Generator Library

All generators are built to be rerun multiple times.

### Backstage: backstage

The generator, backstage, generates a `catalog-info.yaml` catalogue file. It will prompt you for various information about your application.

Other generators will ask to read from this file to skip prompts that ask for information stored in this file.

### Github Maven Build: gh-maven-build

The generator, gh-maven-build, generates the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub.

The generated files will appear in your .github/workflows and .jenkins directories.

### Github Node.js Build: gh-nodejs-build

The generator, gh-nodejs-build, generates the CI workflow and NR Broker intention files for building Node.js in GitHub. The workflow assume that your `package.json` has a `build` command and your build places the files in `./dist`.

The generated files will appear in your .github/workflows and .jenkins directories.

## Command Options

### Skip prompts (--promptless)

The option `--promptless` can be used with a number of generators to attempt to run it without prompting for responses. It will attempt to only use information stored in your `catalog-info.yaml`.

### Force changes (--force)

The option `--force` will allow Yoeman to automatically overwrite any existing files. Yoeman's built-in file comparison is redundant if you are running the composer on a clean repository. You can review the changes using git and in a pull request.

# Developing Generators

## Requirements

The following are expected to be installed.

* node (v20)
* podman

## Building the image

The Dockerfile can be built by running './build.sh'. The local image will be tagged as 'nr-repository-composer'.

# License

See: [LICENSE](./LICENSE)
