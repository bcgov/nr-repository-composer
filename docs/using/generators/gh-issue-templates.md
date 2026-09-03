# gh-issue-templates

This generates a set of GitHub issue templates under
`.github/ISSUE_TEMPLATE/` so the repository has a consistent issue workflow.

The generated files are:

- `.github/ISSUE_TEMPLATE/bug.md`
- `.github/ISSUE_TEMPLATE/feature.md`
- `.github/ISSUE_TEMPLATE/task.md`
- `.github/ISSUE_TEMPLATE/epic.md`
- `.github/ISSUE_TEMPLATE/question.md`
- `.github/ISSUE_TEMPLATE/documentation.md`
- `.github/ISSUE_TEMPLATE/ux.md`
- `.github/ISSUE_TEMPLATE/decision.md`
- `.github/ISSUE_TEMPLATE/security-triage.md`
- `.github/ISSUE_TEMPLATE/custom.md`

**Usage:**

Run the generator in the repository root:

```bash
./nr-repository-composer.sh . gh-issue-templates
```

GitHub reads these files automatically when contributors open the "New issue"
dialog. If the repository already has files under `.github/ISSUE_TEMPLATE/`,
re-running the generator will overwrite the matching templates.

To enable the GitHub issue-templates chooser (the menu that lets users pick a
template), add a `.github/ISSUE_TEMPLATE/config.yml` file to the repository.

## Skipping the catalog write

By default the generator also records that it ran by adding itself to the
`composer.io.nrs.gov.bc.ca/generators` annotation in `catalog-info.yaml`. This
generator has no prompts, so that annotation is the only thing being persisted.

The composer scan (`tools/composer-update-repo.sh`) reads that annotation to
decide which generators to re-run against a repository. If a template is
recorded there, a later automated refresh will regenerate it from the default and
**overwrite any hand edits** you made.

If you intend to customize the issue templates yourself after scaffolding and
don't want them refreshed from the default later, pass `--skip-write` so the
generator is not registered in the catalog:

```bash
./nr-repository-composer.sh . gh-issue-templates --skip-write
```

The initial files are still created, but the composer will leave them alone. See
[Command Options](../command-options.md#--skip-write).
