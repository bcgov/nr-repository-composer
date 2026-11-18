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

## Usage

```bash
./nr-repository-composer.sh . gh-nodejs-build
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the build; `Service` names the generated workflow. |
| **License** | SPDX license (default `Apache-2.0`) embedded in the build. |
| **Client ID** | Selects the Broker JWT secret. A blank Client ID supplies an empty token, just like an unset secret. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Node.js version** | `22` or `24` (default `24`) — selects the Node runtime image. |
| **Node pattern** | `NPM` (default) or `unknown` — shapes the install/build steps. |
| **OCI Artifacts** | JSON array of `[{"artifact":...,"output":...}]` static assets pulled from other builds (see [OCI Artifacts](../oci-artifacts.md#static-assets)). |
| **Published files/folders** | Artifact contents to publish (default `dist`). |
| **Base publish directory** | Directory under the component root containing published files (default `.`). |
| **Unit tests path** | Path to a unit-test workflow to invoke from the build. |
| **Artifact repository type / path** | `GitHubPackages` (default) or `JFrogArtifactory`; the path defaults from the slug/type. |
| **Tools / local build secrets** | Comma-separated secret names the build needs; local secrets default to the tools list. |

At runtime, the workflow checks whether the Broker secret is empty. If empty, it emits a warning and continues the build without Broker checks or intention recording, using `ubuntu-latest`. A nonempty token retains Broker checks and the configured custom runner; invalid tokens still fail validation. Deployment runner settings are unchanged, and deployment still requires a Broker token.

Without a Broker token, tagged builds also skip the check for an already-recorded release, so a version may be rebuilt and republished. No new build intention ID is produced.

**Suggested Next Steps:**

- [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md) — Set up on-premises deployment workflow

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-nodejs-build](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-nodejs-build)
