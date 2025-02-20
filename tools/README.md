# NR Repository Composer - Admin Tools

These tools are for admins to manage composer workflows across NR repositories.

# Prerequisites

* [Podman](https://podman.io) or [Docker](https://www.docker.com)
* yq
* gh
* Write access to repositories to scan

# Composer Scan

This will login to GitHub and scan for repositories that require updates to their composer files. If the update does not require user interaction, a pull request will be created. If updates require interaction, an issue is created for the developer to update the repository.

```
./composer-scan.sh
```