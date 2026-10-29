# Admin Tools

These tools are for admins to manage composer workflows across NR repositories.
See the [`tools/`](https://github.com/bcgov/nr-repository-composer/tree/main/tools)
directory for the source.

## Prerequisites

- [Podman](https://podman.io) or [Docker](https://www.docker.com)
- `yq`
- `gh`
- Write access to repositories to scan

## Composer Scan

This logs in to GitHub and scans the given organization for repositories that
require updates to their composer files. If the update does not require user
interaction, a pull request is created. If updates require interaction, an issue
is created for the developer to update the repository.

```bash
./composer-scan.sh <organization>
```

For example:

```bash
./composer-scan.sh bcgov-c
```

### How to disable automated scanning

A repository may disable automated scanning of individual components by setting
`spec.skipAutomatedScan: true` on the component's `NRComposer` document, which
lives in the sibling `catalog-composer.yaml` file. The legacy form — the
`composer.io.nrs.gov.bc.ca/skipAutomatedScan = true` annotation on the
`kind: Component` document in `catalog-info.yaml` — is still honoured as a
fallback for pre-migration repositories.
