---
name: refresh-polaris-pipeline
description: "Run the Polaris Pipeline refresh workflow in the current repository."
argument-hint: "Optional notes about repository scope or service runtime"
agent: "agent"
---

Refresh the Polaris Pipeline files in this repository.

Use the repo-local guidance files created by this generator:

- [AGENTS.md](../../AGENTS.md)
- [.github/instructions/polaris-composer.instructions.md](../instructions/polaris-composer.instructions.md)
- [.github/skills/polaris-pipeline-composer/SKILL.md](../skills/polaris-pipeline-composer/SKILL.md)

Follow the repository guidance to:

1. Run the required preflight checks.
2. Determine whether this repository is a Node.js or Maven service.
3. Run the matching build generator with `--headless --force`.
4. Run `gh-oci-deploy-onprem` with `--headless --force`.
5. Review the diff and keep changes limited to expected generated Polaris Pipeline artifacts.
6. Create a branch, commit, push, and open a pull request if changes exist.
7. Stop cleanly if preflight fails, required data is missing, or unrelated churn appears.

End in one of the allowed states: pull request opened, no changes needed, or a deliberate stop with a terminal error message.