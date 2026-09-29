# Command Options

Generators accept a small set of command-line options that control how prompts
are handled and how files are written.

## `--ask-answered`

**Default:** `false`

If `true`, show prompts for already configured options. Generators read
information stored in your `catalog-info.yaml` for previous prompt answers. Use
this when you intentionally want to review or change stored values.

## `--force`

**Default:** `false`

The `--force` option allows Yeoman to automatically overwrite any existing files.
Yeoman's built-in file comparison is redundant if you are running the composer on
a clean repository. You can review the changes using Git and in a pull request.

## `--headless`

**Default:** `false`

If `true`, exit with an error if any prompt is required. Obviously, this will
always exit with an error if you enable `--ask-answered`. This option is useful
for scripting the generators.

## `--all`

**Script option** (not passed to a generator)

`--all` is accepted by `nr-repository-composer.sh` itself. It discovers every
generator recorded in the repository's `catalog-info.yaml` (the
`composer.io.nrs.gov.bc.ca/generators` annotation — the same value the automated
scan, `tools/composer-update-repo.sh`, reads) and re-runs each one locally, in
the directory that owns the catalog file.

- A `Location` catalog is processed along with each `spec.targets[]` entry.
- Catalog files without a `generators` annotation are skipped.
- It performs **no git or GitHub side effects** — it does not branch, commit,
   push, or open pull requests. Review the resulting changes with your own git
   workflow. This is the manual, in-repo counterpart to the automated scan.

By default `--all` runs each generator interactively. To run non-interactively,
pass generator options through to every generator:

```bash
# Re-run every recorded generator, interactively
./nr-repository-composer.sh . --all

# Re-run every recorded generator, non-interactively
./nr-repository-composer.sh . --all --headless --force
```

> **Note:** `--all` runs discovery inside the container via the `backstage-scan`
> generator.

## `--help`

**Default:** `false`

If `true`, displays usage and options and exits.

## `--help-prompts`

**Default:** `false`

If `true`, display description and prompt details. It is recommended that new
users use this option.

## `--skip-write`

**Default:** `false`

If `true`, the generator runs and writes its output files but does **not** write
the prompt answers or the `composer.io.nrs.gov.bc.ca/generators` ("generators run")
annotation back to `catalog-info.yaml`.

Use this when you intend to **modify the generated files by hand** and do not
want them refreshed from the default by a later automated run. The composer scan
(`tools/composer-update-repo.sh`) reads the `generators` annotation to decide
which generators to re-run against a repository; if the generator is not recorded,
the scan will not regenerate (and overwrite) that file. Skipping the
write therefore lets you own the template content going forward, while still
scaffolding the initial version from the generator.

## Common combinations

| Goal | Command |
| --- | --- |
| First run, see what each prompt means | `--help-prompts` |
| Rerun and review stored answers | `--ask-answered` |
| Non-interactive / scripted run | `--headless --force` |
| Overwrite existing files without prompting | `--force` |
| Scaffold a file you'll edit by hand, out of the composer refresh cycle | `--skip-write` |
| Re-run every recorded generator in the repo, interactively | `--all` |
| Re-run every recorded generator in the repo, non-interactively | `--all --headless --force` |

> **Note:** `--headless` and `--ask-answered` are mutually exclusive. Enabling
> both will always exit with an error, because headless mode refuses to prompt.
