---
name: polaris-pipeline-composer
description: "Use when staff need to apply latest Polaris Pipeline generator updates in this repository using direct-in-repo execution with consistent preflight checks and outcome tracking."
---

# Polaris Pipeline Composer Skill

## When To Use

Use this skill for staff-supervised updates that apply the latest Polaris Pipeline generated build and deploy workflows. For a chat-driven entry point, use the `/refresh-polaris-pipeline` prompt that this generator also installs.

## Inputs

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
4. For Java/Maven apps, check POM prerequisites before running generators:
   - `<version>${revision}</version>` — dynamic versioning used by the pipeline
   - `version-from-env` profile — activates `${revision}` from `VERSION` env var
   - `flatten-maven-plugin` — resolves `${revision}` in the published POM
   - `nr-artifactory` repository entry — access to NR Artifactory dependencies
   - Check each pattern with `grep` against `pom.xml`. For each missing pattern:
     - Apply the change to `pom.xml` using the `java-maven-pipeline-example` POM as a reference.
     - Summarize changes in chat before continuing.
     - If the POM structure is unusual and the change cannot be applied safely, stop and ask the developer to make the change manually.
5. Run matching build generator in headless mode:
   - Node.js: `./nr-repository-composer.sh . gh-nodejs-build --headless --force`
   - Java/Maven: `./nr-repository-composer.sh . gh-maven-build --headless --force`
6. If a headless run fails on missing prompt values:
   - Inspect `catalog-info.yaml` and nearby generated config to infer any missing values you can justify confidently.
   - Summarize any values you add before rerunning.
   - Ask the user for any remaining value you cannot deduce confidently.
   - If prompt values must be reviewed or changed, rerun with `--ask-answered`.
7. Run deploy generator:
   - `./nr-repository-composer.sh . gh-oci-deploy-onprem --headless --force`
8. If a headless run fails on missing prompt values:
   - Inspect `catalog-info.yaml` and nearby generated config to infer any missing values you can justify confidently.
   - Summarize any values you add before rerunning.
   - Ask the user for any remaining value you cannot deduce confidently.
   - If prompt values must be reviewed or changed, rerun with `--ask-answered`.
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
