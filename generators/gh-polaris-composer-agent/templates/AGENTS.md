# Target Repository Agent Guide

Use this file when running Polaris Pipeline composer updates in this repository.

## Scope

- Run Polaris Pipeline composer updates for this repository only.
- Keep changes focused on generated Polaris Pipeline artifacts.

## Direct-In-Repository Execution

1. Move to the component root where `catalog-info.yaml` exists.
2. Run the matching build generator:
   - Node.js: `gh-nodejs-build`
   - Java/Maven: `gh-maven-build`
3. Run `gh-oci-deploy-onprem` for Polaris deploy workflow updates (OCI/ORAS under the hood).
4. Review diff and confirm only expected generated Polaris Pipeline files changed.
5. If changes exist, create a branch, commit, push, and open a pull request with `gh`.
6. If there are no changes, exit cleanly.
7. If execution cannot proceed safely, stop with a terminal message and an error exit code.

## Command Guidance

- Default mode assumes required prompt values are already present.
- Use `--headless --force` for non-interactive composer runs.
- Use `--ask-answered` only when you intentionally need to review or change stored prompt values.

## Required Preflight Checks

- `gh` is installed and available.
- `gh auth status` is successful.
- `podman` or `docker` is installed and available.
- Git working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.

## Completion States

Each run must end in one state:

1. Pull request opened with Polaris Pipeline updates.
2. No changes needed.
3. Stopped with a terminal message and an error exit code.

## Pull Request Flow

When generated changes exist:

1. Create a branch (example: `feat/polaris-composer-<service>`).
2. Commit only expected generated Polaris Pipeline files.
3. Push the branch to origin.
4. Open a pull request with `gh pr create`.
