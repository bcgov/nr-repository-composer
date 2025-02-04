'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';
import { Document, parseDocument } from 'yaml';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  addGeneratorToDoc,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
} from '../util/yaml.js';

/**
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('promptless', {
      type: String,
      required: false,
      description: 'Run headless with no user prompts',
    });
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
    const promptless = !!this.options.promptless;
    this.answers = extractFromYaml(this.backstageDoc, pathToProps);
    console.log(this.answers);

    if (!promptless) {
      this.log(
        yosay(
          'Welcome to the GitHub workflow and NR Broker intention file generator!',
        ),
      );

      this.log(chalk.bold('Usage'));
      this.log('');
      this.log(
        '  ' +
          chalk.bold('Project:     ') +
          chalk.dim(
            'Lowercase kebab-case name that uniquely identifies the project',
          ),
      );
      this.log('               ' + chalk.dim('Example: super-project'));
      this.log(
        '  ' +
          chalk.bold('Service:     ') +
          chalk.dim(
            'Lowercase kebab-case name that uniquely indentifies the service',
          ),
      );
      this.log(
        '               ' +
          chalk.dim(
            'Should start with project, have an optional descriptor and end with an artifact identifier',
          ),
      );
      this.log(
        '               ' + chalk.dim('Example: super-project-backend-war'),
      );
      this.log(
        '  ' +
          chalk.bold('Client ID:   ') +
          chalk.dim(
            'The client id of the Broker account to use. Leave blank to use manually set BROKER_JWT secret.',
          ),
      );
      this.log(
        '  ' +
          chalk.bold('Artifactory: ') +
          chalk.dim('The OCP Artifactory namespace this will be published to'),
      );
      this.log(
        '  ' +
          chalk.bold('Root:    ') +
          chalk.dim(
            "The path to where your build is located relative to the repository's root",
          ),
      );
      this.log(
        '  ' +
          chalk.bold('GitHub Owner with repo path:    ') +
          chalk.dim(
            'The Github owner with repo path (e.g. bcgov-nr/edqa-war) ',
          ),
      );
      this.log('');

      this.log(chalk.bold('Prompts'));
      this.log('');
    }

    const backstageAnswer = promptless
      ? { skip: true }
      : await this.prompt([
          {
            type: 'confirm',
            name: 'skip',
            message: `Skip prompts for values found in Backstage file (${BACKSTAGE_FILENAME}):`,
            default: true,
          },
        ]);

    this.answers = {
      ...this.answers,
      ...(await this.prompt(
        [
          {
            type: 'input',
            name: 'projectName',
            message: 'Project:',
          },
          {
            type: 'input',
            name: 'serviceName',
            message: 'Service:',
          },
          {
            type: 'input',
            name: 'license',
            default: 'Apache-2.0',
            message: 'License (SPDX):',
          },
          {
            type: 'input',
            name: 'clientId',
            message: 'Client ID:',
            default: '',
          },
          {
            type: 'input',
            name: 'unitTestsPath',
            message: 'Path to unit tests (./.github/workflows/test.yaml):',
            default: '',
          },
          {
            type: 'confirm',
            name: 'deployOnPrem',
            message: 'Deploy on-prem:',
            default: false,
          },
          {
            type: 'input',
            name: 'playbookPath',
            message: 'Playbook path:',
            default: 'playbooks',
            when: (answers) => answers.deployOnPrem,
          },
        ]
          .filter(
            generateSetAnswerPropPredicate(this.answers, !backstageAnswer.skip),
          )
          .map((question) => {
            if (this.answers[question?.name]) {
              question.default = this.answers[question.name];
            }
            return question;
          }),
      )),
    };
  }

  async configuring() {
    // this.config.save();
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
      // const playbook_args = [
      //   this.answers.projectName,
      //   this.answers.serviceName,
      //   this.answers.playbookPath,
      // ];
      // const playbook_options = {};
      // this.composeWith(
      //   'nr-repository-composer:pd-ansible-playbook',
      //   playbook_args,
      //   playbook_options,
      // );
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
