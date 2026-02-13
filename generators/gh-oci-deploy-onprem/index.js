'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import { destinationGitPath } from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_PLAYBOOK_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  copyCommonDeployWorkflows,
} from '../util/copyworkflows.js';
import { makeWorkflowDeployPath } from '../util/github.js';
import { outputReport } from '../util/report.js';

/**
 * Deploy type prompt - determines which playbook to use
 */
const PROMPT_DEPLOY_TYPE = {
  type: 'list',
  name: 'deployType',
  message: 'Deployment type',
  description: 'Select the type of application being deployed',
  choices: [
    { name: 'Node.js application', value: 'nodejs' },
    { name: 'Java/Tomcat application', value: 'tomcat' },
  ],
  default: 'nodejs',
  store: true,
};

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOY_TYPE,
  PROMPT_PLAYBOOK_PATH,
];

/**
 * Generate the deploy workflow and NR Broker intention files for on-prem OCI artifact deployments in GitHub
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
          'NR GitHub OCI On-Prem Deploy Generator',
          'Create deploy workflow for on-prem OCI artifact deployments (Node.js or Tomcat)',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-oci-on-prem-deploy-gh-oci-deploy-onprem',
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
    this.answers = await this.prompt(questions, 'config');
  }

  // Generate GitHub deploy workflow and NR Broker intention files
  writingWorkflow() {
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
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        postDeployTestsPath: this.answers.postDeployTestsPath,
      },
    );

    copyCommonDeployWorkflows(this, this.answers);

    // Compose with OCI playbook generator
    const playbook_args = [
      this.answers.projectName,
      this.answers.serviceName,
      this.answers.playbookPath,
    ];

    const playbook_options = {
      deployType: this.answers.deployType,
    };
    this.composeWith(
      'nr-repository-composer:pd-oci-playbook',
      playbook_args,
      playbook_options,
    );
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-oci-deploy-onprem');
    this.config.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-oci-deploy-onprem', this.answers);
    }
  }
}
