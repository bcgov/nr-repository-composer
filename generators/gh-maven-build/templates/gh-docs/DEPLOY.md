## How to build and deploy using the Polaris Pipeline

### Prerequisite: Link your NR Broker Account to GitHub

Refer to [How to Link Your Broker Account to GitHub](https://apps.nrs.gov.bc.ca/int/confluence/display/OSCAR/Linking+to+a+GitHub+account)

### 1. **Trigger a development build**

A development build is the first step before deploying code to production. The development build is based on a pseudo-merge of the target branch and `main`. Development builds are triggered automatically by opening a pull request with the `main` branch as the base. They can also be triggered manually when there is an open pull request with the `main` branch as the base. Do the following steps to trigger a development build manually:

**Prerequisites:**

- there exists an open pull request for the target branch to merge to `main`
- there are no merge conflicts

1. Go to the **Actions** tab in the GitHub repository.
2. Select the `Build and release` workflow.
3. Choose the target branch.
4. Click **"Run workflow"** to start the build.
  
After triggering a build, click the workflow run in the **Actions** tab to view logs and progress.

### 2. **Deploy a development build**

Development builds can only be deployed to the dev and test environments. Do the following steps to trigger a deployment of the target branch to the dev or test environments: 

**Prerequisites:**

- the build artifact has been built by the build-release workflow (see above: 1. Trigger a development build)
- there exists an open pull request for the target branch to merge to `main`
- there are no merge conflicts

**Trigger a deployment to the dev and test environments:**

1. Go to the **Actions** tab in your GitHub repository.
2. Select the Deploy workflow.
3. Select the branch to deploy.
4. Click **"Run workflow"** to start deployment.
5. Click the link to the deployment job in the workflow logs to view the deployment job progress.

### 3. **Trigger a release build**

When ready to deploy code to production, create a release:

  - Go to the [Releases](https://github.com/<%= gitHubOwnerPack %>/releases) page of your repository.
  - Click on **"Draft a new release"**.
  - Select the tag you just pushed, or create a new one.
  - Fill in the release title and description (e.g., changelog, highlights).
  - (Optional) Attach binaries or other assets.
  - Click **"Publish release"**.

The Build and release workflow will be triggered automatically to build the release. After it builds successfully, you may trigger a deployment of the release to production.

### 4. **Deploy a production build**

1. Go to the **Actions** tab in your GitHub repository.
2. Select the Deploy workflow.
3. Select the tag (release) to deploy.
4. Click **"Run workflow"** to start deployment.
5. Click the link to the deployment job in the workflow logs to view the deployment job progress.

## Configuring the Polaris Pipeline

Configuration values can be defined in `playbooks/vars/custom/<env>.yaml` files where `<env>` is one of (`dev`, `test`, `prod`, or `all`).

For example, the application may require a specific version of java (`jdk_major_version`), tomcat (`tomcat_major_version`), or a particular WebADE datastore (`webade_datastore`).

Refer to the documentation for the Ansible roles used in [bcgov/nr-polaris-collection](https://github.com/bcgov/nr-polaris-collection/blob/main/README.md) for a list of configurable variables and their behaviour.
