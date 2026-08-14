# gh-maven-build

This generates the CI workflow and NR Broker intention files for building a Java
application using Maven in GitHub. The WAR artifact is packaged into an
[OCI artifact](../oci-artifacts.md) which can then be used in a Tomcat
deployment.

The build can optionally pull additional
[OCI artifacts as static assets](../oci-artifacts.md#static-assets) from other
builds (e.g., frontend artifacts for a backend service).

The generated files will appear in your `.github/workflows` and `.jenkins`
directories.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it.

**Suggested Next Steps:**

- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises OCI deployment workflow
