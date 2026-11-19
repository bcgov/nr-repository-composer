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

## Usage

```bash
./nr-repository-composer.sh . gh-maven-build
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the build; `Service` names the generated workflow. |
| **Type** | `service`, `website`, or `library`. A `library` skips packaging/publishing (only `deploy` runs). |
| **License** | SPDX license (default `Apache-2.0`) embedded in the build. |
| **Client ID** | Selects the Broker JWT secret. A blank Client ID supplies an empty token, just like an unset secret. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Java version** | `8`, `11`, `17`, or `21` (default `8`) — selects the JDK image. |
| **Java pattern** | `SpringBoot`, `Tomcat`, or `unknown` (default `SpringBoot`) — shapes the packaged artifact. |
| **POM root** | Path to `pom.xml` relative to the component root (default `./`). |
| **Published files/folders** | Artifact contents to publish (default `.`); skipped for `library` type. |
| **Base publish directory** | Directory under the component root where the package is staged (default `dist`); skipped for `library` type. |
| **OCI Artifacts** | JSON array of `[{"artifact":...,"output":...}]` static assets pulled from other builds (see [OCI Artifacts](../oci-artifacts.md#static-assets)). |
| **Unit tests path** | Path to a unit-test workflow to invoke from the build. |
| **Artifact repository type / path** | `GitHubPackages` (default) or `JFrogArtifactory`; the path defaults from the slug/type. |
| **Tools / local build secrets** | Comma-separated secret names the build needs; local secrets default to the tools list. |
| **Maven build arguments** | Maven CLI args; defaults to `--batch-mode -Dmaven.test.skip=true -Pgithub clean package` (`deploy` for libraries). |

At runtime, the workflow validates the Broker token. A missing, invalid, expired, or revoked token, a connection error/timeout, or an unsuccessful HTTP response emits a warning and allows an untracked build on `ubuntu-latest`. Only the token-validation step tolerates failure for builds; failed tests and cancellations still block the build. Successful validation retains Broker release checks, intention recording, and the configured custom runner. Deployment runner settings are unchanged, and deployment requires successful Broker token validation.

Without successful Broker token validation, tagged builds skip the check for an already-recorded release, so a version may be rebuilt and republished. No new build intention ID is produced.

**Suggested Next Steps:**

- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises OCI deployment workflow

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-maven-build](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-maven-build)
