# Workflow Templates

GitHub Actions workflows are generated from EJS templates located in each
generator's `templates/` folder. Templates are copied to the destination with
`this.fs.copyTpl`, substituting prompt answers and helper values.

## Template variables

Common template variables available in workflow templates:

- `serviceName` — service identifier
- `projectName` — project identifier
- `gitHubProjectSlug` — `org/repo` format
- `brokerJwt` — secret name for authentication
- `relativePath` — path for monorepo components
- `isMonoRepo` — whether the repository is a monorepo
- `unitTestsPath` — path to a unit test workflow, if configured

## Conditional blocks

Use EJS conditionals to emit different workflow shapes for monorepos versus
single-service repositories. For example, a top-level workflow triggers on
`push`/`pull_request`, while a monorepo component workflow is a `workflow_call`:

```yaml
on:
<% if (!isMonoRepo) { -%>
  push:
    tags:
      - 'v*'
    branches:
      - 'main'
<% if (relativePath) { -%>
    paths:
      - '<%= relativePath %>/**'
<% } -%>
  pull_request:
    branches:
      - main
<% } else { -%>
  workflow_call:
<% } -%>
```

## Reusable workflows

Build workflows delegate to reusable workflows via `uses: ./.github/workflows/...`.
For example, the preflight job calls `preflight.yaml`:

```yaml
jobs:
  preflight:
    name: Preflight
    uses: ./.github/workflows/preflight.yaml
    permissions:
      contents: read
      actions: read
    with:
      preflight_context: build
      catalog_info: <%= relativePath %><%= relativePath ? '/' : '' %>catalog-info.yaml
    secrets:
      token: ${{ secrets.<%= brokerJwt %> }}
```

## Common build workflows

Shared build workflows are copied by `copyCommonBuildWorkflows` in
`src/util/copyworkflows.js`. Use this helper when a new build generator needs the
same preflight, check-build-artifact, or deployment-config workflows.

## Modifying workflow parameters

1. Add the parameter to the workflow's `inputs:` section.
2. Pass it to the reusable workflow via `with:`.
3. Use it in the workflow with `${{ inputs.parameter }}`.

## Best practices

- Keep workflows reusable via `workflow_call`.
- Use relative paths for monorepo components.
- Always be able to locate the `.git` folder — some files are output relative to
   it, not the working directory.
