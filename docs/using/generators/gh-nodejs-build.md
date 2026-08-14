# gh-nodejs-build

This generates the CI workflow and NR Broker intention files for building Node.js
applications in GitHub. The workflow assumes that your `package.json` has a
`build` command. The build is output as an [OCI artifact](../oci-artifacts.md).

The build can optionally pull
[OCI artifacts as static assets](../oci-artifacts.md#static-assets) from other
builds (e.g., frontend artifacts for a backend service).

The generated files will appear in your `.github/workflows` and `.jenkins`
directories.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it.

**Suggested Next Steps:**

- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises deployment workflow
