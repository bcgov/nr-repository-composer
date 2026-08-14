# gh-polaris-composer-agent

This optional generator adds a target-repository guidance pack and chat command
for staff-run Polaris Pipeline composer updates.

It creates the following files:

- `AGENTS.md`
- `.github/instructions/polaris-composer.instructions.md`
- `.github/prompts/refresh-polaris-pipeline.prompt.md`
- `.github/skills/polaris-pipeline-composer/SKILL.md`

Use `/refresh-polaris-pipeline` in Copilot Chat when you want a chat-driven run.
Use this generator when you want a repository to be ready for direct-in-repo,
headless-first, agent-assisted execution without manually copying guidance files.

**Suggested Next Steps:**

- [`gh-maven-build`](gh-maven-build.md), [`gh-nodejs-build`](gh-nodejs-build.md) — Set up build pipeline
- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up Polaris deployment workflow
