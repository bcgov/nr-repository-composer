# gh-oci-deploy-ocp

This generates the deployment workflow for OpenShift (OCP) applications triggered
via Jenkins. It supports triggering deployments for OCI container images and Helm charts stored
in `build-dc.yaml`.

Developers can choose whether to automatically deploy ephemeral environment instances
on feature pull requests targeting the `main` branch to the development environment.

The generated files will appear in your `.github/workflows` and `.jenkins`
directories.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it. Run the
`gh-docker-build` generator first to set up the build workflow.

## Usage

```bash
./nr-repository-composer.sh . gh-oci-deploy-ocp
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the deploy; `Service` names the generated workflow. |
| **Client ID** | Broker client ID; becomes the `BROKER_JWT` secret name. Blank falls back to the `BROKER_JWT` secret. |
| **Post deploy tests path** | Path to a post-deploy test workflow to invoke after deployment. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Deployment type** | `Node.js application` or `Java/Tomcat application` — selects the generated playbook. |
| **Type** | `service`, `website`, or `library`. A `library` cannot be deployed and stops the generator. |
| **Artifact source** | `This repository` (default), `GitHub (public)`, or `Artifactory (private)` — where the deployed OCI artifact is pulled from. |
| **Deployment config paths** | Comma-separated deployment configuration paths (default `playbooks`); see [Deployment Configuration](../oci-artifacts.md#deployment-configuration). |
| **Automatically deploy ephemeral instance** | When enabled, an ephemeral environment instance is deployed on feature pull requests targeting `main`. |

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-oci-deploy-ocp](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-oci-deploy-ocp)
