# Quick Start

This guide gets a repository scaffolded with the NR Repository Composer in a few
minutes. It assumes you have a Git repository you want to catalog.

## 1. Choose how you will run the composer

You have two options:

- **Container (recommended)** — no local Node.js or Yeoman install required. See
  [Running Generators](running-generators.md#container).
- **Local install** — clone this repository and run with Node.js. See
  [Running Generators](running-generators.md#local-install).

## 2. Add the runner script

The easiest way to run the composer is the `nr-repository-composer.sh` script.
Add it to your repository by running the `nr-repository-composer` generator:

```bash
# Using the container directly
podman run --rm -it -v ${PWD}:/src --userns keep-id \
  ghcr.io/bcgov/nr-repository-composer:latest \
  nr-repository-composer:nr-repository-composer
```

The script auto-detects Podman or Docker, finds the git root, mounts the
repository, and prefixes generator names for you. See
[Running Generators](running-generators.md) for the full details.

## 3. Create the catalog file

Run the `backstage` generator at the root of your component. It prompts for
information about your component and writes `./catalog-info.yaml`.

```bash
# Single-component repository
./nr-repository-composer.sh . backstage
```

If your repository is a **monorepo** (more than one component), run
`backstage-location` at the root first, then run `backstage` in each component
directory:

```bash
# Monorepo root
./nr-repository-composer.sh . backstage-location

# Each component directory
./nr-repository-composer.sh ./frontend backstage
./nr-repository-composer.sh ./backend  backstage
```

## 4. Add a build pipeline

Run the build generator that matches your runtime:

```bash
# Node.js
./nr-repository-composer.sh . gh-nodejs-build

# Java / Maven
./nr-repository-composer.sh . gh-maven-build
```

## 5. Add a deployment workflow

```bash
./nr-repository-composer.sh . gh-oci-deploy-onprem
```

## 6. Review and commit

The generators write files into your repository. Review the diff with Git, then
commit and open a pull request. Generators are safe to rerun — they read
previous answers from `catalog-info.yaml` and only re-prompt when necessary.

> **Tip:** New users should run any generator with `--help-prompts` to see a
> description of each prompt. See [Command Options](command-options.md).

## What's next

- Browse the full [Generators](generators.md) library.
- Learn about [Assumptions & Concepts](assumptions.md) such as services,
  components, OCI artifacts, and deployment configurations.
- If you are refreshing Polaris Pipeline files across repositories, see the
  [Polaris Pipeline Composer](polaris-composer.md).
