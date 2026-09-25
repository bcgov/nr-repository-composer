# gh-oci-deploy-ocp

This generates the deployment workflow for OpenShift (OCP) applications triggered
via Jenkins. It supports triggering deployments for OCI container images and Helm charts stored
in `build-dc.yaml`.

Developers can choose whether to automatically deploy ephemeral environment instances
on feature pull requests targeting the `main` branch to the development environment.

The generated files will appear in your `.github/workflows` and `.jenkins`
directories.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it.
