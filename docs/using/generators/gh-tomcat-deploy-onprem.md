# gh-tomcat-deploy-onprem

> :warning: **Warning!** `gh-tomcat-deploy` is superseded by
> [`gh-oci-deploy-onprem`](gh-oci-deploy-onprem.md).
>
> `gh-tomcat-deploy` is only compatible with versions of the
> [nr-repository-composer](https://github.com/bcgov/nr-repository-composer) ≤ v4.2.0.

This generates the deploy workflow and NR Broker intention files for deploying
Java/Tomcat applications to on-premises infrastructure via GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This
generator also writes the matching Ansible playbook configuration.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it. Run the `gh-maven-build`
generator first to set up the build workflow.

## Usage

```bash
./nr-repository-composer.sh . gh-tomcat-deploy-onprem
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the deploy; `Service` names the generated workflow. |
| **Client ID** | Broker client ID; becomes the `BROKER_JWT` secret name. Blank falls back to the `BROKER_JWT` secret. |
| **POM root** | Path to `pom.xml` relative to the component root (default `./`). |
| **Java version** | `8`, `11`, `17`, or `21` — JDK image for the Tomcat runtime. |
| **Post deploy tests path** | Path to a post-deploy test workflow to invoke after deployment. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Artifact repository type / path** | `GitHubPackages` (default) or `JFrogArtifactory`; the path defaults from the slug/type. |
| **Deployment config paths** | Comma-separated deployment configuration paths (default `playbooks`); see [Deployment Configuration](../oci-artifacts.md#deployment-configuration). |
| **Tomcat context** | Context path (for example `ext#results`). |
| **Use alternative webapp directory / name** | Whether the webapp uses a non-default directory name, and that name. |
| **Add Webade configuration** | Adds Webade configuration to the playbook. |
| **Deploy Jasper Reports** | When enabled, deploys Jasper Reports; the Jasper prompts below then appear. |
| **Jasper project / service name, source path, server instance, additional data sources, pause seconds** *(Jasper only)* | Configure the Jasper Reports deployment (server instance defaults to `JCRS`, source path to `{{ playbook_dir }}/../src`, pause to `30` seconds). |

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-tomcat-deploy-onprem](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-tomcat-deploy-onprem)
