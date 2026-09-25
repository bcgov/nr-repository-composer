# gh-docker-build

This generates the CI workflow and NR Broker intention files for building Docker
applications in GitHub. The workflow builds a container image using Docker Buildx
and publishes artifacts as [OCI artifacts](../oci-artifacts.md).

It also configures the repository to use `build-dc.yaml` for storing deployment
configurations (e.g. Helm charts).

The build can optionally pull
[OCI artifacts as static assets](../oci-artifacts.md#static-assets) from other
builds.

The generated files will appear in your `.github/workflows` and `.jenkins`
directories.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it.

**Suggested Next Steps:**

- [`gh-oci-deploy-ocp`](gh-oci-deploy-ocp.md) — Set up OpenShift (OCP) deployment workflow
- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises deployment workflow
