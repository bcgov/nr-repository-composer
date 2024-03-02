# NR Pipeline Template

NR Pipeline Template provides convenient way to launch generators to scaffold applications using NRIDS tooling and deployment pipelines. The generators are created using [Yeoman](http://yeoman.io) and packaged into a docker container for running on a developer's machine.

# Prerequisites

## Podman or Docker

The generators are easiest to run by installing Podman or Docker so that you can use the prebuilt container (ghcr.io/bcgov-nr/nr-pipeline-template).

* [Podman](https://podman.io)
* [Docker](https://www.docker.com)

# Usage - Podman

First, open a terminal and change the current working directory to the root of the checked out repository that you wish to scaffold. The examples map the current working directory to the '/src' directory inside of the container which is the directory the generator outputs to.

It is recommended that you run the generators only on a clean repository.

The generator will output a file saving your answers. This is useful if you want to rerun the generator in the future to take advantage of any updated workflows.

This command will run the 'gh-maven-build' generator:

```
podman run --rm -it -v ${PWD}:/src --userns keep-id ghcr.io/bcgov-nr/nr-pipeline-template:latest -- nr-repository-composer:gh-maven-build
```

Note: You can run the command with or without the generator specified.

# Usage - Local

```bash
npm ci
npm link
```

Then, run a generator:

```bash
npx yo nr-repository-composer:gh-maven-build
```

## Generators

### Github Maven Build: gh-maven-build

The generator, gh-maven-build, generates the CI workflow and NR Broker intention files for building Java/Tomcat with Maven in GitHub.

Answer the prompts:

1. Project name (e.g. my-app)
2. Service name (e.g. my-app-war)
3. OpenShift Artifactory project (default: cc20)
4. Maven pom file root (default: repository root)

The generated files will appear in your .github/workflows and .jenkins directories.

# Developing Generators

## Requirements

The following are expected to be installed.

* node (v20)
* podman

## Building the image

The Dockerfile can be built by running './build.sh'. The image will be tagged as 'nr-repository-composer' locally.

# License

See: [LICENSE](./LICENSE)
