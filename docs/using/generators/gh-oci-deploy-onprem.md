# gh-oci-deploy-onprem

This generates the deploy workflow and NR Broker intention files for deploying OCI
artifacts (Node.js or Java/Tomcat applications) to on-premises infrastructure via
GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This
generator prompts you to select a deployment type (Node.js or Tomcat), and then
writes the matching Ansible playbook configuration.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it. Run the appropriate build
generator (`gh-nodejs-build` or `gh-maven-build`) first to set up the build
workflow.

## Usage

```bash
./nr-repository-composer.sh . gh-oci-deploy-onprem
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Deployment type** | `Node.js application` or `Java/Tomcat application` — selects the generated playbook. Tomcat prompts below appear only for the Tomcat type. |
| **Project / Service** | Identifiers for the deploy; `Service` names the generated workflow. |
| **Client ID** | Broker client ID; becomes the `BROKER_JWT` secret name. Blank falls back to the `BROKER_JWT` secret. |
| **Post deploy tests path** | Path to a post-deploy test workflow to invoke after deployment. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Artifact source** | `This repository` (default), `GitHub (public)`, or `Artifactory (private)` — where the deployed OCI artifact is pulled from. |
| **Deployment config paths** | Comma-separated deployment configuration paths (default `playbooks`); see [Deployment Configuration](../oci-artifacts.md#deployment-configuration). |
| **Java version** *(Tomcat only)* | `8`, `11`, `17`, or `21` — JDK image for the Tomcat runtime. |
| **Tomcat context** *(Tomcat only)* | Context path (for example `ext#results`). |
| **Use alternative webapp directory / name** *(Tomcat only)* | Whether the webapp uses a non-default directory name, and that name. |
| **Add log4j2 config / Add tomcat context** *(Tomcat only)* | Toggle inclusion of log4j2 and tomcat-context configuration. |
| **Create data temp dir** | Creates a data temp directory for the deployment. |
| **Add Webade configuration** *(Tomcat only)* | Adds Webade configuration to the playbook. |

## Timeout and Retry Handling

The generated deployment workflows include automatic retry logic and timeout
detection to handle transient network failures and slow broker/Jenkins responses:

**Token Validation** (`check-token.yaml`):

- Retry: 2 attempts
- Connection timeout: 10 seconds
- Total timeout: 30 seconds
- Timeout detection: recognizes curl exit code 28 (timeout) and reports a distinct error message

**Jenkins Deployment Submission**:

- Retry: 2 attempts with `--retry-all-errors` flag (retries on all error types)
- Retry delay: 2 seconds between attempts
- Connection timeout: 10 seconds
- Total timeout: 30 seconds
- Captures HTTP status code and curl exit code for diagnostics

**Broker Polling** (Two Phases):

- **Trigger Phase**: waits up to 5 minutes for broker to register the deployment intention
    - Retry: 1 attempt per poll iteration
    - Retry delay: 1 second
    - Connection timeout: 5 seconds
    - Per-request timeout: 15 seconds
- **Completion Phase**: waits up to 5 minutes for the deployment job to complete
    - Same retry and timeout settings as Trigger Phase
    - Timeouts are treated as distinct from failures; manual verification is required

Deployment summaries include submit duration and explicit timeout messaging to
distinguish between network timeouts (recoverable) and actual failures (requires
investigation).

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-oci-deploy-onprem](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-oci-deploy-onprem)
