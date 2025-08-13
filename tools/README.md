# NR Repository Composer - Admin Tools

These tools are for admins to manage composer workflows across NR repositories.

# Prerequisites

* [Podman](https://podman.io) or [Docker](https://www.docker.com)
* yq
* gh
* Write access to repositories to scan

# Composer Scan

This will login to GitHub and scan the given organization for repositories that require updates to their composer files. If the update does not require user interaction, a pull request will be created. If updates require interaction, an issue is created for the developer to update the repository.

```
./composer-scan.sh <organization>
```

ex. `./composer-scan.sh bcgov-c`

## How to disable automated scanning

A repository may disable automated scanning of individual components by adding the 'composer.io.nrs.gov.bc.ca/skipAutomatedScan = true' annotation to the catalog-info.yaml with 'kind: Component'.
