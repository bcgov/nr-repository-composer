# NR Repository Composer Agent Guide

Use this file when planning or executing Polaris Pipeline refresh work across application repositories.

## Scope

- This repository is the canonical source for composer guidance, templates, and generator behavior.
- Staff and agents execute updates inside each target application repository.
- Keep changes focused on generated Polaris Pipeline artifacts.

## Direct-In-Target Execution Model

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

## Generator Selection Rules

- Use Polaris Pipeline path only:
  - Build: `gh-nodejs-build` or `gh-maven-build`
  - Deploy: `gh-oci-deploy-onprem`
- Do not use deprecated deploy generators.
- For monorepos, run generators in each component directory that has its own `catalog-info.yaml`.

## Command Guidance

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

## Required Preflight Checks

- `gh` is installed and available.
- At least one GitHub auth check is successful:
  - `gh auth status`
  - `gh api user --jq .login`
- `podman` or `docker` is installed and available.
- Target repository working tree is clean before generation.
- `catalog-info.yaml` exists for the component being updated.
- Target branch is updated with remote using `git pull --ff-only`.
- No unresolved merge conflicts are present (`git diff --name-only --diff-filter=U` is empty).

When preflight runs, report results in chat as a pass/fail checklist and include a short reason for each failed check.
Use `✅` for pass items and `❌` for failed items.
If pull or conflict checks fail, stop and let a developer resolve branch state before running generators.

## Completion States Per Repo

Each run must end in one state:

1. PR opened with Polaris Pipeline updates.
2. No changes needed.
3. Stopped with a human-readable summary in chat.

## Pull Request Flow

When generated changes exist:

1. Create a branch (example: `feat/polaris-composer-<service>`).
2. Commit only expected generated Polaris Pipeline files.
3. Push the branch to origin.
4. Open a pull request with `gh pr create`.

## Documentation

The site in `docs/` is a [Docsify](https://docsify.js.org) static site. It is
organized around two personas, which the sidebar divides:

- **Using the Tool** (`docs/using/`) — for developers running the generators to
   scaffold or maintain a repository.
- **Extending the Tool** (`docs/extending/`) — for developers adding or changing
   generators.
- **Reference** (`docs/reference/`) — admin tools and license.

### How to update the docs

1. **Edit the Markdown.** Each page is a Markdown file under `docs/`. The home
   page is `docs/README.md`.
2. **Keep the sidebar in sync.** `docs/_sidebar.md` lists every page grouped by
   persona. When you add, rename, or remove a page, update `_sidebar.md` (and
   `docs/_navbar.md` if the top-level persona entry changes). A page that is not
   in the sidebar is unreachable.
3. **Keep the README in sync.** `README.md` is the canonical source of truth for
   generator descriptions. When a generator's behavior, output, or prompt changes,
   update `README.md` and the matching generator page. Each generator has its own
   page under `docs/using/generators/` (for example,
   `docs/using/generators/gh-nodejs-build.md`); `docs/using/generators.md` is the
   index (table plus the shared "OCI Artifacts" and "Deployment Configuration"
   concepts). Do not let the README, the index, and the per-generator page drift.
4. **Verify locally.** Serve the site and click through the sidebar:

   ```bash
   npm run docs:serve
   ```

   The site loads Docsify from a CDN, so no build step is required.
5. **Check links.** Confirm every sidebar entry resolves and that in-page
   anchors (for example, `generators.md#oci-artifacts`) point at a real heading.
6. **Commit and open a PR** following the standard Git workflow.

### Docsify conventions

- Pages are plain Markdown; Docsify renders them client-side.
- Cross-page links use relative paths (for example, `using/quick-start.md`).
- In-page anchors use the heading slug (for example, `#oci-artifacts`).
- The sidebar and navbar are Markdown files (`_sidebar.md`, `_navbar.md`); the
   site config lives in `docs/index.html` under `window.$docsify`.

## Canonical References In This Repository

- `README.md`
- `docs/` — Docsify documentation site (see [Documentation](#documentation))
- `.github/copilot-instructions.md`
- `.github/instructions/polaris-composer.instructions.md`
- `.github/skills/polaris-pipeline-composer/SKILL.md`
