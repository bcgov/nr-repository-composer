import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import { destinationGitPath, relativeGitPath } from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_TYPE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
  PROMPT_ARTIFACT_SRC,
  PROMPT_DEPLOY_TYPE,
  PROMPT_AUTO_DEPLOY_EPHEMERAL,
} from '../util/prompts.js';
import { copyCommonDeployWorkflows } from '../util/copyworkflows.js';
import { makeWorkflowDeployPath } from '../util/github.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOY_TYPE,
  PROMPT_TYPE,
  PROMPT_ARTIFACT_SRC,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
  PROMPT_AUTO_DEPLOY_EPHEMERAL,
];

/**
 * Generate the deploy workflow and NR Broker intention files for OpenShift (OCP) deployments via Jenkins
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub OCI OCP Deploy Generator',
      subtitle:
        'Create deploy workflow for OpenShift (OCP) deployments via Jenkins (with optional ephemeral PR deployments)',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-oci-deploy-ocp-gh-oci-deploy-ocp',
        ],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
      ],
    };
    this._questions = questions;
  }

  _postPrompt() {
    if (
      this.answers.type &&
      typeof this.answers.type === 'string' &&
      this.answers.type.trim().toLowerCase() === 'library'
    ) {
      this.log(chalk.red.bold('\nERROR: Libraries cannot be deployed\n'));
      process.exit(1);
    }
  }

  async prompting() {
    return super.prompting();
  }

  // Generate GitHub deploy workflow and NR Broker intention files
  writingWorkflow() {
    const deployRoot = relativeGitPath();
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';

    this.fs.copyTpl(
      this.templatePath('deploy.yaml'),
      destinationGitPath(makeWorkflowDeployPath(this.answers.serviceName)),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        artifactSrc: this.answers.artifactSrc,
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        postDeployTestsPath: this.answers.postDeployTestsPath,
        deployType: this.answers.deployType,
        autoDeployEphemeral: this.answers.autoDeployEphemeral ?? false,
        existingConceptPath: this.answers.deploymentConfigPaths,
        deployRoot,
      },
    );

    copyCommonDeployWorkflows(this, this.answers);
  }

  writingBackstage() {
    super.writingBackstage();
  }
}
