'use strict';
import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import {
  destinationGitPath,
  isMonoRepo,
  relativeGitPath,
} from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_CLIENT_ID,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_LICENSE,
  PROMPT_NODE_PATTERN,
  PROMPT_NODE_VERSION,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  PROMPT_UNIT_TESTS_PATH,
} from '../util/prompts.js';
import {
  copyCommonBuildWorkflows,
  rmIfExists,
  updateReadmeWithPipelineGuide,
} from '../util/copyworkflows.js';
import { makeWorkflowBuildPublishPath } from '../util/github.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_NODE_VERSION,
  PROMPT_NODE_PATTERN,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
];

/**
 * Generate the CI workflow and NR Broker intention files needed for Node.js builds in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub NodeJS Build and Deploy Generator',
      subtitle:
        'Create workflow and NR Broker intention files for GitHub NodeJS builds',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-nodejs-build-gh-nodejs-build',
        ],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
      ],
    };
    this._questions = questions;
  }

  _prePrompt() {
    const removedProps = this.backstageConfig.processDeprecated();
    this.showGeneratorDeprecationWarning =
      removedProps.indexOf(PROMPT_DEPLOY_ON_PREM.name) !== -1;
  }

  async prompting() {
    return super.prompting();
  }

  // Generate GitHub workflows and NR Broker intention files
  writingWorkflow() {
    const relativePath = relativeGitPath();
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';
    const ociArtifacts = this.answers.ociArtifacts.trim()
      ? JSON.parse(this.answers.ociArtifacts.trim())
      : [];
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      destinationGitPath(
        makeWorkflowBuildPublishPath(this.answers.serviceName),
      ),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        type: this.answers.type,
        artifactRepositoryType: this.answers.artifactRepositoryType,
        artifactRepositoryPath: this.answers.artifactRepositoryPath,
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        license: this.answers.license,
        isMonoRepo: isMonoRepo(),
        unitTestsPath: this.answers.unitTestsPath,
        nodeVersion: this.answers.nodeVersion,
        publishArtifactSuffix: this.answers.publishArtifactSuffix,
        toolsBuildSecrets: this.answers.toolsBuildSecrets,
        toolsLocalBuildSecrets: this.answers.toolsLocalBuildSecrets,
        relativePath,
        ociArtifacts,
      },
    );
    copyCommonBuildWorkflows(this, {
      ...this.answers,
      packageArchitecture: 'nodejs',
      packageType: 'application/vnd.oci.image.layer.v1.tar+gzip',
    });

    updateReadmeWithPipelineGuide(this);

    // Clean up old files if they exist (may remove in future)
    if (!isMonoRepo()) {
      rmIfExists(
        this,
        destinationGitPath('.github/workflows/build-release.yaml'),
      );
    }
    rmIfExists(this, destinationGitPath('.github/workflows/deploy.yaml'));
    rmIfExists(this, destinationGitPath('.github/workflows/run-deploy.yaml'));
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
    if (this.showGeneratorDeprecationWarning) {
      this.log(
        chalk.yellow.bold('⚠️ Notice:') +
          chalk.yellow(
            ' This generator no longer handles deployments.\n' +
              '   Please use generator ' +
              chalk.cyan('gh-oci-deploy-onprem') +
              ' to update your deployment configuration.\n',
          ),
      );
    }
  }
}
