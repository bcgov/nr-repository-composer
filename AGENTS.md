# NR Repository Composer Agent Guide

Use this file when planning or executing Polaris Pipeline refresh work across application repositories.

## Scope

- This repository is the canonical source for composer guidance, templates, and generator behavior.
- Staff and agents execute updates inside each target application repository.
- Keep changes focused on generated Polaris Pipeline artifacts.

## Direct-In-Target Execution Model

For each target repository:

1. Open the target repository and move to the component root (where `catalog-info.yaml` exists).
2. Run the build generator that matches the service runtime:
   - Node.js: `gh-nodejs-build`
   - Java/Maven: `gh-maven-build`
3. Run `gh-oci-deploy-onprem` for Polaris deploy workflow updates (OCI/ORAS under the hood).
4. Review the diff and ensure only expected generated files changed.
5. If there are changes, create a branch, commit, push, and open a pull request using `gh`.
6. If there are no changes, exit cleanly.
7. If composer execution cannot proceed safely, stop with a terminal message and an error exit code.

## Generator Selection Rules

- Use Polaris Pipeline path only:
  - Build: `gh-nodejs-build` or `gh-maven-build`
  - Deploy: `gh-oci-deploy-onprem`
- Do not use deprecated deploy generators.
- For monorepos, run generators in each component directory that has its own `catalog-info.yaml`.

## Command Guidance

- Default execution mode assumes required prompt values are already present.
- Use `--headless --force` for non-interactive composer runs.
- Use `--ask-answered` only when you intentionally need to review or change stored prompt values.

Example with a local wrapper copied into a target repository:

```bash
./nr-repository-composer.sh . gh-nodejs-build --headless --force
./nr-repository-composer.sh . gh-oci-deploy-onprem --headless --force
```

## Required Preflight Checks

- `gh` is installed and available.
- `gh auth status` is successful.
- `podman` or `docker` is installed and available.
- Target repository working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.

## Completion States Per Repo

Each run must end in one state:

1. PR opened with Polaris Pipeline updates.
2. No changes needed.
3. Stopped with a terminal message and an error exit code.

## Pull Request Flow

When generated changes exist:

1. Create a branch (example: `feat/polaris-composer-<service>`).
2. Commit only expected generated Polaris Pipeline files.
3. Push the branch to origin.
4. Open a pull request with `gh pr create`.

## Canonical References In This Repository

- `README.md`
- `.github/copilot-instructions.md`
- `.github/instructions/polaris-composer.instructions.md`
- `.github/skills/polaris-pipeline-composer/SKILL.md`
