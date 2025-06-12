'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnAnyQuestions } from '../util/process.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_LIFECYCLE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_PLAYBOOK_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import {
  BACKSTAGE_FILENAME,
  generateSetAnswerPropPredicate,
} from '../util/yaml.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_LIFECYCLE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_DEPLOY_ON_PREM,
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

    bailOnAnyQuestions(
      questions
        .filter(
          generateSetAnswerPropPredicate(
            this.answers,
            !headless && askAnswered,
          ),
        )
        .filter((question) => question.when && question.when(this.answers)),
      headless,
    );
    this.answers = await this.prompt(questions, 'config');
  }

  // Generate GitHub workflows and NR Broker intention files
  writingWorkflow() {
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      this.destinationPath('.github/workflows/build-release.yaml'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        brokerJwt,
        unitTestsPath: this.answers.unitTestsPath,
        publishArtifactSuffix: this.answers.publishArtifactSuffix,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.json'),
      this.destinationPath('.github/workflows/build-intention.json'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        license: this.answers.license,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.sh'),
      this.destinationPath('.github/workflows/build-intention.sh'),
    );
    this.fs.copyTpl(
      this.templatePath('check-token.yaml'),
      this.destinationPath('.github/workflows/check-token.yaml'),
    );
    if (this.answers.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deploy.yaml'),
        this.destinationPath('.github/workflows/deploy.yaml'),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
          brokerJwt,
        },
      );
      this.fs.copyTpl(
        this.templatePath('deployment-intention.json'),
        this.destinationPath(
          `.jenkins/${this.answers.serviceName}-deployment-intention.json`,
        ),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
        },
      );
      this.fs.copyTpl(
        this.templatePath('check-deploy-job-status.sh'),
        this.destinationPath('.github/workflows/check-deploy-job-status.sh'),
      );
      this.fs.copyTpl(
        this.templatePath('run-deploy.yaml'),
        this.destinationPath('.github/workflows/run-deploy.yaml'),
        {
          brokerJwt,
        },
      );
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
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-nodejs-build');
    this.config.save();
  }
}
