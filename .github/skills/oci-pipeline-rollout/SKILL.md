---
name: oci-pipeline-rollout
description: "Use when staff need to apply latest OCI/ORAS generator updates to one or more application repositories using direct-in-target-repo execution with consistent preflight checks and outcome tracking."
---

# OCI Pipeline Rollout Skill

## When To Use

Use this skill for staff-supervised updates that apply the latest OCI/ORAS generated build and deploy workflows in application repositories.

## Inputs

- Organization and repository name.
- Component path in repo (for monorepos).
- Service runtime (`nodejs` or `maven`).
- Whether run is single-repo or repeated across a list.

## Path A: Single Repository Run

1. Open target repository and move to component root.
2. Run preflight checks:
   - `gh auth status`
   - `command -v podman || command -v docker`
   - `test -f catalog-info.yaml`
   - `git status --porcelain` must be empty
3. Run matching build generator:
   - Node.js: `./nr-repository-composer.sh . gh-nodejs-build --ask-answered`
   - Java/Maven: `./nr-repository-composer.sh . gh-maven-build --ask-answered`
4. Run deploy generator:
   - `./nr-repository-composer.sh . gh-oci-deploy-onprem --ask-answered`
5. Review changed files and ensure only expected generated OCI/ORAS pipeline artifacts changed.
6. Commit and open pull request, or print the failure reason to the console and exit.

## Path B: Multi-Repo Staff Session

1. Prepare a repo list and process one repository at a time.
2. Apply Path A fully for each repository before moving to the next.
3. After each repository, record one outcome:
   - PR opened
   - No changes needed
   - Stopped with console output and non-zero exit

## Stop Conditions

Stop the run for a repository if:

- Required prompts cannot be resolved safely.
- `catalog-info.yaml` is missing or invalid for generator requirements.
- Diff includes unrelated churn outside expected generated artifacts.

Do not force completion. Print the reason to the console and exit.

## Validation Checklist

For each repository, confirm:

1. Build generator matches runtime.
2. Deploy generator is `gh-oci-deploy-onprem`.
3. No deprecated deploy generator was used.
4. Commit scope is limited to intended generated files.
5. Final state is PR, no-op, or clear console failure with non-zero exit.
