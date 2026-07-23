---
name: polaris-pipeline-composer
description: "Use when staff need to apply latest Polaris Pipeline generator updates in this repository using direct-in-repo execution with consistent preflight checks and outcome tracking."
---

# Polaris Pipeline Composer Skill

## When To Use

Use this skill for staff-supervised updates that apply the latest Polaris Pipeline generated build and deploy workflows.

## Inputs

- Component path in repo (for monorepos).
- Service runtime (`nodejs` or `maven`).
- Whether run is single-repo or repeated across a list.

## Path A: Single Repository Run

1. Open target repository and move to component root.
2. Run preflight checks:
   - `command -v gh`
   - `gh auth status`
   - `command -v podman || command -v docker`
   - `test -f catalog-info.yaml`
   - `git status --porcelain` must be empty
3. Assume required prompt values are already configured.
4. Run matching build generator in headless mode:
   - Node.js: `./nr-repository-composer.sh . gh-nodejs-build --headless --force`
   - Java/Maven: `./nr-repository-composer.sh . gh-maven-build --headless --force`
5. Run deploy generator:
   - `./nr-repository-composer.sh . gh-oci-deploy-onprem --headless --force`
6. If prompt values must be reviewed or changed, rerun with `--ask-answered`.
7. Review changed files and ensure only expected generated Polaris Pipeline artifacts changed.
8. If there are changes, create a composer branch, commit, push, and open a pull request:
   - `git checkout -b feat/polaris-composer-<service>`
   - `git add <expected-generated-files>`
   - `git commit -m "chore: refresh Polaris Pipeline files"`
   - `git push -u origin feat/polaris-composer-<service>`
   - `gh pr create --fill`
9. If there are no changes, exit cleanly.

## Path B: Multi-Repo Staff Session

1. Prepare a repo list and process one repository at a time.
2. Apply Path A fully for each repository before moving to the next.
3. After each repository, record one outcome:
   - PR opened
   - No changes needed
   - Stopped with a terminal message and an error exit code

## Stop Conditions

Stop the run for a repository if:

- Required prompts cannot be resolved safely.
- `catalog-info.yaml` is missing or invalid for generator requirements.
- Diff includes unrelated churn outside expected generated artifacts.

Do not force completion. Stop with a terminal message and an error exit code.

## Validation Checklist

For each repository, confirm:

1. Build generator matches runtime.
2. Deploy generator is `gh-oci-deploy-onprem`.
3. No deprecated deploy generator was used.
4. Commit scope is limited to intended generated files.
5. Final state is PR, no-op, or a stop with a terminal message and an error exit code.
