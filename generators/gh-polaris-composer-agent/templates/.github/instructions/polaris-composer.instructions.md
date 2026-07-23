---
description: "Use when updating Polaris Pipeline files in this repository; enforce preflight checks, generator selection, and safe commit scope for direct-in-repo execution."
applyTo: ".github/**"
---

# Polaris Pipeline Composer Instructions

## Purpose

Apply the latest Polaris Pipeline generator updates with a consistent, low-risk process.

## Mandatory Preflight

Before running generators:

1. Confirm `gh` is installed and available.
2. Confirm GitHub auth is active: `gh auth status`.
3. Confirm `podman` or `docker` is available.
4. Confirm `catalog-info.yaml` exists in the target component.
5. Confirm git working tree is clean.

If any preflight check fails, stop with a terminal message and an error exit code.

## Generator Path Requirements

- Build generator:
  - Use `gh-nodejs-build` for Node.js services.
  - Use `gh-maven-build` for Java services.
- Deploy generator:
  - Use `gh-oci-deploy-onprem`.
- Do not use deprecated deploy generator paths.

## Execution Rules

1. Run from the target component root.
2. Assume required prompt values are already configured.
3. Use `--headless --force` for non-interactive composer runs.
4. Use `--ask-answered` only when staff intentionally need to review or change prompt values.
5. If generated changes exist, create a branch, commit scoped files, push, and open a pull request with `gh`.
6. If no changes exist, exit cleanly.

## Safety Rules

- Never use destructive git commands.
- Keep commits scoped to generated Polaris Pipeline artifacts.
- Do not mix unrelated refactors with composer changes.
- If prompt/config data is missing, stop with a terminal message and an error exit code instead of forcing partial updates.

## Required Outcome

Each run must end as exactly one of:

1. Pull request opened.
2. No changes needed.
3. Stopped with a terminal message and an error exit code.
