# gh-jasper-deploy-onprem

This generates the deploy workflow and NR Broker intention files for deploying
Jasper Reports to on-premises infrastructure via GitHub Actions.

The generated files will appear in your `.github/workflows` directory. This
generator also writes the matching Ansible playbook configuration.

This generator should be run at the root directory of your component (service)
which should contain the `catalog-info.yaml` for it.

## Usage

```bash
./nr-repository-composer.sh . gh-jasper-deploy-onprem
```

## Key prompts

| Prompt | Affects |
| --- | --- |
| **Project / Service** | Identifiers for the deploy. |
| **Client ID** | Broker client ID; becomes the `BROKER_JWT` secret name. Blank falls back to the `BROKER_JWT` secret. |
| **GitHub Slug** | `<organization>/<repository>`; pre-filled from the git remote. |
| **Deploy Jasper Reports** | When enabled, deploys Jasper Reports; the Jasper prompts below then appear. |
| **Jasper project / service name, source path, server instance, additional data sources, pause seconds** | Configure the Jasper Reports deployment (server instance defaults to `JCRS`, source path to `{{ playbook_dir }}/../src`, pause to `30` seconds). |

## Generator source

[bcgov/nr-repository-composer/tree/main/src/gh-jasper-deploy-onprem](https://github.com/bcgov/nr-repository-composer/tree/main/src/gh-jasper-deploy-onprem)
