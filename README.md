# NR Repository Composer

NR Repository Composer provides convenient way to launch generators to scaffold applications using NRIDS tooling and deployment pipelines. The generators are created using [Yeoman](http://yeoman.io). For distribution, it is packaged into a docker container for running on a developer's machine.

# Prerequisites

There are two ways to run the composer.

## Run using a Container

You will need to install one of the following.

* [Podman](https://podman.io)
* [Docker](https://www.docker.com)

The generators are easiest to run by installing Podman or Docker so that you can use the prebuilt container (ghcr.io/bcgov-nr/nr-repository-composer).

It is recommended that users running Windows install the command locally or use Podman. Docker cannot modify the file permissions correctly on mounted volumes. As such, the example commands will not work.

## Run using a local install

You will need to install node and clone this repository.

* [Node 20](https://nodejs.org/en)

The tool is build using [Yeoman](http://yeoman.io) which is a JavaScript library. You do not need to install Yoeman.

Install the dependencies with `npm ci` and link it with `npm link` so Yoeman can find the local installation. If you make code changes, you do not need the re-link it.

```bash
npm ci
npm link
```

# Usage

First, open a terminal and change the current working directory to the root of the checked out repository that you wish to scaffold. It is recommended that you run the generators only on a clean repository.

The generators will output a file to save your answers and will update any `app-config.yaml` catalogue file. This is useful if you want to rerun the generator in the future to take advantage of any updated workflows.

The example command will run the 'gh-maven-build' generator.

### Container

```
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov-nr/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```
```
docker run --rm -it -v ${PWD}:/src ghcr.io/bcgov-nr/nr-repository-composer:latest -- nr-repository-composer:gh-maven-build
```

The examples map the current working directory to the '/src' directory inside of the container which is the directory the generator outputs to.

### Local

```bash
npx yo nr-repository-composer:gh-maven-build
```

## Generators

All generators are built to be rerun multiple times.

### Backstage: backstage

The generator, backstage, generates a app-config.yaml catelogue file.

### Github Maven Build: gh-maven-build

The generator, gh-maven-build, generates the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub.

The generated files will appear in your .github/workflows and .jenkins directories.

The option `--promptless` can be used with this command to attempt to run it without prompting for responses. It will attempt to only used information stored in your `app-config.yaml`. This option can be combined with `--force` which will let Yoeman automatically overwrite any existing files.

# Developing Generators

## Requirements

The following are expected to be installed.

* node (v20)
* podman

## Building the image

The Dockerfile can be built by running './build.sh'. The image will be tagged as 'nr-repository-composer' locally.

# License

See: [LICENSE](./LICENSE)
