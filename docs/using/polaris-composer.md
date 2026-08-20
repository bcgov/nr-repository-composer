# Polaris Pipeline Composer (Agent-Assisted)

This repository includes guidance files to help staff run agent-assisted Polaris
Pipeline refresh work in target application repositories.

- `AGENTS.md` — Canonical composer runbook and generator selection rules.
- `.github/instructions/polaris-composer.instructions.md` — Machine-readable safety and preflight constraints.
- `.github/skills/polaris-pipeline-composer/SKILL.md` — Executable workflow for single-repo and multi-repo staff sessions.

Staff should run the composer against one repository at a time and confirm only
expected generated Polaris Pipeline artifacts changed. Each run should end with
either a pull request or no changes. If a headless run fails on missing prompt
values, inspect `catalog-info.yaml`, infer only well-supported values, summarize
any additions in chat, and ask the user only for unresolved values.

Before running generators, sync the branch using `git pull --ff-only`. If pull
fails or unresolved merge conflicts exist, stop and let a developer resolve
branch state first.

Default mode assumes required prompt values are preconfigured and runs with
`--headless --force`.

## Direct-in-target execution model

For each target repository:

1. Open the target repository and move to the component root (where `catalog-info.yaml` exists).
2. Run the build generator that matches the service runtime:
    - Node.js: `gh-nodejs-build`
    - Java/Maven: `gh-maven-build`
3. Run `gh-oci-deploy-onprem` for Polaris deploy workflow updates (OCI/ORAS under the hood).
4. Review the diff and ensure only expected generated files changed.
5. If there are changes, create a branch, commit, push, and open a pull request using `gh`.
6. If there are no changes, exit cleanly.
7. If composer execution cannot proceed safely, stop and provide a human-readable summary in chat.

## Generator selection rules

- Use the Polaris Pipeline path only:
    - Build: `gh-nodejs-build` or `gh-maven-build`
    - Deploy: `gh-oci-deploy-onprem`
- Do not use deprecated deploy generators.
- For monorepos, run generators in each component directory that has its own `catalog-info.yaml`.

## Command guidance

- Default execution mode assumes required prompt values are already present.
- Use `--headless --force` for non-interactive composer runs.
- If headless mode fails on missing prompt values, inspect `catalog-info.yaml` first, add only values you can justify confidently, and summarize those additions in chat.
- Ask the user for any remaining value you cannot deduce confidently.
- Use `--ask-answered` only when you intentionally need to review or change stored prompt values.

Example with a local wrapper copied into a target repository:

```bash
./nr-repository-composer.sh . gh-nodejs-build --headless --force
./nr-repository-composer.sh . gh-oci-deploy-onprem --headless --force
```

## Required preflight checks

- `gh` is installed and available.
- At least one GitHub auth check is successful:
    - `gh auth status`
    - `gh api user --jq .login`
- `podman` or `docker` is installed and available.
- Target repository working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.
- Target branch is updated with remote using `git pull --ff-only`.
- No unresolved merge conflicts are present (`git diff --name-only --diff-filter=U` is empty).

When preflight runs, report results in chat as a pass/fail checklist and include
a short reason for each failed check. Use `✅` for pass items and `❌` for failed
items. If pull or conflict checks fail, stop and let a developer resolve branch
state before running generators.

## Completion states per repo

Each run must end in one state:

1. PR opened with Polaris Pipeline updates.
2. No changes needed.
3. Stopped with a human-readable summary in chat.

## Pull request flow

When generated changes exist:

1. Create a branch (example: `feat/polaris-composer-<service>`).
2. Commit only expected generated Polaris Pipeline files.
3. Push the branch to origin.
4. Open a pull request with `gh pr create`.
