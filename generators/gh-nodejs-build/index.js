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
  PROMPT_LICENSE,
  PROMPT_LIFECYCLE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_PLAYBOOK_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  copyCommonBuildWorkflows,
  copyCommonDeployWorkflows,
  rmIfExists,
} from '../util/copyworkflows.js';
import {
  makeWorkflowBuildPublishPath,
  makeWorkflowDeployPath,
} from '../util/github.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_LIFECYCLE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_GITHUB_PROJECT_SLUG,
  {
    ...PROMPT_PLAYBOOK_PATH,
    when: (answers) => {
      return answers.deployOnPrem;
    },
  },
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
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-maven-build-gh-nodejs-build',
          ],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
          ['Documentation', 'https://github.com/bcgov-nr/polaris-pipelines'],
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
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      destinationGitPath(
        makeWorkflowBuildPublishPath(this.answers.serviceName),
      ),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        unitTestsPath: this.answers.unitTestsPath,
        publishArtifactSuffix: this.answers.publishArtifactSuffix,
        relativePath,
        isMonoRepo: isMonoRepo(),
      },
    );
    copyCommonBuildWorkflows(this, {
      ...this.answers,
      packageArchitecture: 'nodejs',
      packageType: 'application/vnd.oci.image.layer.v1.tar+gzip',
    });
    if (this.answers.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deploy.yaml'),
        destinationGitPath(makeWorkflowDeployPath(this.answers.serviceName)),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
          brokerJwt,
          gitHubProjectSlug: this.answers.gitHubProjectSlug,
          postDeployTestsPath: this.answers.postDepoyTestsPath,
        },
      );
      copyCommonDeployWorkflows(this, this.answers);
      const playbook_args = [
        this.answers.projectName,
        this.answers.serviceName,
        this.answers.playbookPath,
      ];
      const playbook_options = {};
      this.composeWith(
        'nr-repository-composer:pd-nodejs-playbook',
        playbook_args,
        playbook_options,
      );
    }

    // Clean up old files if they exist (may remove in future)
    rmIfExists(this, destinationGitPath('build-release.yaml'));
    rmIfExists(this, destinationGitPath('deploy.yaml'));
    rmIfExists(this, destinationGitPath('run-deploy.yaml'));
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-nodejs-build');
    this.config.save();
  }
}
