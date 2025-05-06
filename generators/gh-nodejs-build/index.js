'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { Document, parseDocument } from 'yaml';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnAnyQuestions } from '../util/process.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
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
  pathToProps,
  addGeneratorToDoc,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
} from '../util/yaml.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LIFECYCLE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_DEPLOY_ON_PREM,
  {
    ...PROMPT_PLAYBOOK_PATH,
    when: (answers) => answers.deployOnPrem,
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

  async initializing() {
    const backstagePath = this.destinationPath(BACKSTAGE_FILENAME);
    if (fs.existsSync(backstagePath)) {
      const backstageYaml = fs.readFileSync(backstagePath, 'utf8');
      this.backstageDoc = parseDocument(backstageYaml);
    } else {
      this.backstageDoc = new Document();
    }
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options['ask-answered'];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = extractFromYaml(this.backstageDoc, pathToProps);

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

    this.answers = {
      ...this.answers,
      ...(await this.prompt(
        questions
          .filter(
            generateSetAnswerPropPredicate(
              this.answers,
              !headless && askAnswered,
            ),
          )
          .map((question) => {
            if (this.answers[question?.name]) {
              question.default = this.answers[question.name];
            }
            return question;
          })
          .map(bailOnAnyQuestions(headless)),
      )),
    };
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
        this.destinationPath('.jenkins/deployment-intention.json'),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
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
    writePropToPath(this.backstageDoc, pathToProps, this.answers);
    addGeneratorToDoc(this.backstageDoc, 'gh-nodejs-build');
    this.fs.write(
      this.destinationPath(BACKSTAGE_FILENAME),
      this.backstageDoc.toString(),
    );
  }
}
