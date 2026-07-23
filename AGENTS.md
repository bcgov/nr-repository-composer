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
7. If composer execution cannot proceed safely, print the failure reason to the console and exit.

## Generator Selection Rules

- Use Polaris Pipeline path only:
  - Build: `gh-nodejs-build` or `gh-maven-build`
  - Deploy: `gh-oci-deploy-onprem`
- Do not use deprecated deploy generators.
- For monorepos, run generators in each component directory that has its own `catalog-info.yaml`.

## Command Guidance

- Preferred interactive refresh: `--ask-answered`
- Use `--force` only when overwrite is intentional and reviewed.
- Use `--headless` for scripted scenarios where all required prompt values are already present.

Example with a local wrapper copied into a target repository:

```bash
./nr-repository-composer.sh . gh-nodejs-build --ask-answered
./nr-repository-composer.sh . gh-oci-deploy-onprem --ask-answered
```

## Required Preflight Checks

- `gh` is installed and available.
- `gh auth status` is successful.
- `podman` or `docker` is installed and available.
- Target repository working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.

## Completion States Per Repo

Each run must end in one state:

1. PR opened with OCI/ORAS updates.
2. No changes needed.
3. Stopped with a clear console message and non-zero exit.

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
