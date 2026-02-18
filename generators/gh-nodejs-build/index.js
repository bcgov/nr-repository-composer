'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
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
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_LICENSE,
  PROMPT_NODE_PATTERN,
  PROMPT_NODE_VERSION,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  PROMPT_UNIT_TESTS_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  copyCommonBuildWorkflows,
  rmIfExists,
  updateReadmeWithPipelineGuide,
} from '../util/copyworkflows.js';
import { makeWorkflowBuildPublishPath } from '../util/github.js';
import { outputReport } from '../util/report.js';

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
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);
    this.option(OPTION_HELP_PROMPTS);
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options['ask-answered'];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = this.config.getAnswers();

    if (!headless) {
      this.log(
        nrsay(
          'NR GitHub NodeJS Build and Deploy Generator',
          'Create workflow and NR Broker intention files for GitHub NodeJS builds',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-nodejs-build-gh-nodejs-build',
          ],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
        ),
      );
    }

    if (helpPrompts) {
      this.log(chalk.bold('Prompts\n'));
      for (const question of questions) {
        this.log(getPromptToUsage(question));
      }
      this.log(
        `${chalk.bold.underline('                                       ')}\n`,
      );
    }

    bailOnUnansweredQuestions(questions, this.answers, headless, askAnswered);
    const removedProps = this.config.processDeprecated();
    this.showGeneratorDeprecationWarning =
      removedProps.indexOf('deployOnPrem') !== -1;

    this.answers = await this.prompt(questions, 'config');
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
    this.config.addGeneratorToDoc('gh-nodejs-build');
    this.config.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-nodejs-build', this.answers);
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
}
