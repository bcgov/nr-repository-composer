---
name: polaris-pipeline-composer
description: "Use when staff need to apply latest Polaris Pipeline generator updates to one or more application repositories using direct-in-target-repo execution with consistent preflight checks and outcome tracking."
---

# Polaris Pipeline Composer Skill

## When To Use

Use this skill for staff-supervised updates that apply the latest Polaris Pipeline generated build and deploy workflows in application repositories.

## Inputs

- Organization and repository name.
- Component path in repo (for monorepos).
- Service runtime (`nodejs` or `maven`).
- Whether run is single-repo or repeated across a list.

## Path A: Single Repository Run

1. Open target repository and move to component root.
2. Run preflight checks:
   - `command -v gh`
   - `gh auth status || gh api user --jq .login`
   - `command -v podman || command -v docker`
   - `test -f catalog-info.yaml`
   - `git status --porcelain` must be empty
   - `git pull --ff-only`
   - `git diff --name-only --diff-filter=U` must be empty
   - Report a chat checklist with pass/fail status for each preflight check
   - Use `✅` for pass items and `❌` for failed items
   - If `git pull --ff-only` fails or merge conflicts are present, stop and hand off to a developer before running generators
3. Assume required prompt values are already configured.
4. Run matching build generator in headless mode:
   - Node.js: `./nr-repository-composer.sh . gh-nodejs-build --headless --force`
   - Java/Maven: `./nr-repository-composer.sh . gh-maven-build --headless --force`
5. If a headless run fails on missing prompt values:
   - Inspect `catalog-info.yaml` and nearby generated config to infer any missing values you can justify confidently.
   - Summarize any values you add before rerunning.
   - Ask the user for any remaining value you cannot deduce confidently.
6. Run deploy generator:
   - `./nr-repository-composer.sh . gh-oci-deploy-onprem --headless --force`
7. If a headless run fails on missing prompt values:
   - Inspect `catalog-info.yaml` and nearby generated config to infer any missing values you can justify confidently.
   - Summarize any values you add before rerunning.
   - Ask the user for any remaining value you cannot deduce confidently.
8. After generator runs, verify execute permissions on generated scripts:
   - `test -x nr-repository-composer.sh || chmod +x nr-repository-composer.sh`
   - For Java/Maven apps: `test -x mvnw || chmod +x mvnw`
9. Review changed files and ensure only expected generated Polaris Pipeline artifacts changed.
10. If there are changes, create a composer branch, commit, push, and open a pull request:
   - `git checkout -b feat/polaris-composer-<service>`
   - `git add <expected-generated-files>`
   - `git commit -m "chore: refresh Polaris Pipeline files"`
   - `git push -u origin feat/polaris-composer-<service>`
   - For multiline PR content, write the PR body to a temporary Markdown file and use `--body-file`.
   - Example:
     - `cat > /tmp/pr-body.md <<'EOF'`
     - `## Summary`
     - `- Describe generated changes.`
     - ``
     - `## Validation`
     - `- List checks performed.`
     - `EOF`
     - `gh pr create --base main --head feat/polaris-composer-<service> --title "chore: refresh Polaris Pipeline files" --body-file /tmp/pr-body.md`
   - Do not pass escaped newline sequences like `\n` to `--body`; GitHub will render them as literal text.
11. If there are no changes, exit cleanly.

## Path B: Multi-Repo Staff Session

1. Prepare a repo list and process one repository at a time.
2. Apply Path A fully for each repository before moving to the next.
3. After each repository, record one outcome:
   - PR opened
   - No changes needed
   - Stopped with a human-readable summary in chat

## Stop Conditions

Stop the run for a repository if:

- Required prompts cannot be resolved safely.
- `catalog-info.yaml` is missing or invalid for generator requirements.
- Diff includes unrelated churn outside expected generated artifacts.
- `git pull --ff-only` fails or unresolved merge conflicts are detected.

Do not force completion. Stop and provide a human-readable summary in chat.
Include the preflight pass/fail checklist and short failure reasons in the stop summary.
If missing prompt values remain after inspecting the catalog file and nearby repo context, ask the user only for those unresolved values.

## Validation Checklist

For each repository, confirm:

1. Build generator matches runtime.
2. Deploy generator is `gh-oci-deploy-onprem`.
3. No deprecated deploy generator was used.
4. Commit scope is limited to intended generated files.
5. Final state is PR, no-op, or a stop with a human-readable summary in chat.
