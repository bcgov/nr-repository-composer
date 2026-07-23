# NR Repository Composer Agent Guide

Use this file when planning or executing OCI/ORAS pipeline refresh work across application repositories.

## Scope

- This repository is the canonical source for rollout guidance, templates, and generator behavior.
- Staff and agents execute updates inside each target application repository.
- Keep changes focused on generated OCI/ORAS pipeline artifacts.

## Direct-In-Target Execution Model

For each target repository:

1. Open the target repository and move to the component root (where `catalog-info.yaml` exists).
2. Run the build generator that matches the service runtime:
   - Node.js: `gh-nodejs-build`
   - Java/Maven: `gh-maven-build`
3. Run `gh-oci-deploy-onprem` for deployment workflow updates.
4. Review the diff and ensure only expected generated files changed.
5. Commit and open a pull request, or print the failure reason to the console and exit.

## Generator Selection Rules

- Use OCI/ORAS path only:
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

- `gh auth status` is successful.
- `podman` or `docker` is installed and available.
- Target repository working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.

## Completion States Per Repo

Each run must end in one state:

1. PR opened with OCI/ORAS updates.
2. No changes needed.
3. Stopped with a clear console message and non-zero exit.

## Canonical References In This Repository

- `README.md`
- `.github/copilot-instructions.md`
- `.github/instructions/oci-rollout.instructions.md`
- `.github/skills/oci-pipeline-rollout/SKILL.md`
