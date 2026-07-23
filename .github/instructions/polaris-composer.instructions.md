---
description: "Use when updating Polaris Pipeline files in target application repositories; enforce preflight checks, generator selection, and safe commit scope for staff-run direct-in-repo execution."
applyTo: ".github/**"
---

# Polaris Pipeline Composer Instructions

## Purpose

Apply the latest Polaris Pipeline generator updates in application repositories with a consistent, low-risk process.

## Mandatory Preflight

Before running generators in a target repository:

1. Confirm `gh` is installed and available.
2. Confirm GitHub auth is active: `gh auth status`.
3. Confirm `podman` or `docker` is available.
4. Confirm target component has `catalog-info.yaml`.
5. Confirm git working tree is clean.

If any preflight check fails, print the reason to the console and exit.

## Generator Path Requirements

- Build generator:
  - Use `gh-nodejs-build` for Node.js services.
  - Use `gh-maven-build` for Java services.
- Deploy generator:
  - Use `gh-oci-deploy-onprem`.
- Do not use deprecated deploy generator paths.

## Execution Rules

1. Run from the target component root.
2. Prefer `--ask-answered` for staff-supervised runs.
3. Use `--force` only when overwrite intent is explicit and reviewed.
4. Use `--headless` only when all required prompt values are already configured.
5. If generated changes exist, create a branch, commit scoped files, push, and open a pull request with `gh`.
6. If no changes exist, exit cleanly.

## Safety Rules

- Never use destructive git commands.
- Keep commits scoped to generated Polaris Pipeline artifacts.
- Do not mix unrelated refactors with composer changes.
- If prompt/config data is missing, print the reason to the console and exit instead of forcing partial updates.

## Required Outcome

Each repo run must end as exactly one of:

1. Pull request opened.
2. No-op (already up to date).
3. Stopped with a clear terminal message and an error exit code.
