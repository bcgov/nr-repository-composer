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

## Usage

```bash
./nr-repository-composer.sh . gh-docker-build
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the build; `Service` names the generated workflow. |
| **Type** | `service`, `website`, or `library`. A `library` skips packaging/publishing (only `deploy` runs). |
| **License** | SPDX license (default `Apache-2.0`) embedded in the build. |
| **Client ID** | Broker client ID; becomes the `BROKER_JWT` secret name. Blank falls back to the `BROKER_JWT` secret. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **OCI Artifacts** | JSON array of `[{"artifact":...,"output":...}]` static assets pulled from other builds (see [OCI Artifacts](../oci-artifacts.md#static-assets)). |
| **Published files/folders** | Artifact contents to publish (default `dist`); skipped for `library` type. |
| **Unit tests path** | Path to a unit-test workflow to invoke from the build. |
| **Deployment config paths** | Comma-separated deployment configuration paths (default `charts`); see [Deployment Configuration](../oci-artifacts.md#deployment-configuration). |
| **Artifact repository type / path** | `GitHubPackages` (default) or `JFrogArtifactory`; the path defaults from the slug/type. |
| **Tools / local build secrets** | Comma-separated secret names the build needs; local secrets default to the tools list. |

**Suggested Next Steps:**

- [`gh-oci-deploy-ocp`](gh-oci-deploy-ocp.md) — Set up OpenShift (OCP) deployment workflow
- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises deployment workflow

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-docker-build](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-docker-build)
