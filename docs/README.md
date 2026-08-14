# NR Repository Composer

The **NR Repository Composer** populates repositories with the files needed to
build, deploy, and catalog applications. Developers use its generators to both
initially set up and then maintain their repository. Its primary purpose is to
scaffold [NRIDS](https://www2.gov.bc.ca/gov/content/data) applications.

The composer is built on [Yeoman](http://yeoman.io) and uses
[Backstage Software Catalog](https://backstage.io/docs/features/software-catalog/)
[catalog entities](https://backstage.io/docs/features/software-catalog/descriptor-format)
to describe each repository based on the answers you provide when running a
generator.

## Two ways to use this documentation

This site is organized around two personas. Pick the one that matches what you
are trying to do.

### Using the Tool

You are a developer who wants to scaffold or maintain an NRIDS application
repository. You run the prebuilt container (or a local install) and let the
generators prompt you for information and write templated files.

- [Quick Start](using/quick-start.md) — get a repository scaffolded in minutes
- [Running Generators](using/running-generators.md) — container vs. local install
- [Command Options](using/command-options.md) — `--ask-answered`, `--force`, `--headless`, and more
- [Generators](using/generators.md) — the full generator library
- [Polaris Pipeline Composer](using/polaris-composer.md) — agent-assisted refresh runs
- [Assumptions & Concepts](using/assumptions.md) — services, components, OCI artifacts, deployment configs

### Extending the Tool

You are a developer who wants to add a new generator or change the behavior of an
existing one. You clone this repository and run the tool with Node.js.

- [Architecture](extending/architecture.md) — how the generators and utilities fit together
- [Adding a New Prompt](extending/adding-a-prompt.md) — the four-step prompt workflow
- [Adding a New Generator](extending/adding-a-generator.md) — scaffold a generator from scratch
- [YAML Path Mappings](extending/yaml-mappings.md) — map prompt answers into `catalog-info.yaml`
- [Workflow Templates](extending/workflow-templates.md) — author GitHub Actions EJS templates
- [Development Workflow](extending/development.md) — build, lint, and package the image
- [Testing](extending/testing.md) — run generators against the test fixtures

## Where to start

Developers interact with the tool by running generators that prompt for
information and then output templated files. The generators can be tested by
creating a directory and initializing it as a Git repository.

If you have multiple components (frontend, backend, and so on) in a single
repository, this is considered a **monorepo** and you should start with the
`backstage-location` generator to place a location catalog file at the root.

The `backstage` generator creates the component catalog file and is the first
step for most components. It is run at the root of the component within the
repository. If you have multiple components, each should be placed in a
directory off the root. Otherwise, the root of a non-monorepo should contain the
component catalog file. From this point, the developer runs additional
generators as required in the folder for each component.

## Recommended setup

We recommend using the [prebuilt container](using/running-generators.md#container)
to run the generators using Podman or Docker. A Linux bash script is provided to
simplify running the container.

Developers wanting to add new generators or make changes to existing ones should
clone this repository and run the tool using Node.js. See
[Development Workflow](extending/development.md).
