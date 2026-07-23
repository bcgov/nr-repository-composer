---
description: "Use when updating OCI/ORAS pipeline files in target application repositories; enforce preflight checks, generator selection, and safe commit scope for staff-run direct-in-repo execution."
applyTo: ".github/**"
---

# OCI/ORAS Rollout Instructions

## Purpose

Apply the latest OCI/ORAS generator updates in application repositories with a consistent, low-risk process.

## Mandatory Preflight

Before running generators in a target repository:

1. Confirm GitHub auth is active: `gh auth status`.
2. Confirm `podman` or `docker` is available.
3. Confirm target component has `catalog-info.yaml`.
4. Confirm git working tree is clean.

If any preflight check fails, stop and record the blocker.

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

## Safety Rules

- Never use destructive git commands.
- Keep commits scoped to generated OCI/ORAS pipeline artifacts.
- Do not mix unrelated refactors with rollout changes.
- If prompt/config data is missing, stop and record remediation steps instead of forcing partial updates.

## Required Outcome

Each repo run must end as exactly one of:

1. Pull request opened.
2. No-op (already up to date).
3. Blocked with documented next action.
