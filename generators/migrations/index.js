'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';
import { Document, parseDocument } from 'yaml';
import { bailOnAnyQuestions } from '../util/process.js';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
  addGeneratorToDoc,
} from '../util/yaml.js';

/**
 * Generate a database directory
 */
export default class extends Generator {
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
    const headless = !!this.options.headless;
    this.answers = extractFromYaml(this.backstageDoc, pathToProps);

    if (!promptless) {
      this.log(yosay('Welcome to the database generator!'));

      this.log(chalk.bold('Usage'));
      this.log('');
      this.log(
        '  ' +
          chalk.bold('Schema(s):     ') +
          chalk.dim('Comma-separated list of schemas to manage in this repos'),
      );
      this.log(
        '  ' +
          chalk.bold('Tool:     ') +
          chalk.dim(
            'If a supported tool is choosen, additional guidelines provided',
          ),
      );
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
            name: 'schemaName',
            message: 'Schema(s):',
          },
          {
            type: 'input',
            name: 'schemaMigrationTool',
            default: 'flyway',
            message: 'Tool (manual, flyway, liquibase):',
          },
          {
            type: 'input',
            name: 'schemaMigrationType',
            default: '',
            message: 'Type (oracle, mongodb, postgressql, etc.):',
          },
          {
            type: 'input',
            name: 'schemaMigrationBasePath',
            default: '',
            message: 'Base path:',
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
          })
          .map(bailOnAnyQuestions(headless)),
      )),
    };
  }

  writingDatabase() {
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('migrations/README.md'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        schemaMigrationTool: this.answers.schemaMigrationTool,
      },
    );
    this.fs.copyTpl(
      this.templatePath('util/'),
      this.destinationPath('migrations/util/setenv-prod.sh'),
      {},
    );
  }

  writingBackstage() {
    writePropToPath(this.backstageDoc, pathToProps, this.answers);
    addGeneratorToDoc(this.backstageDoc, 'migrations');
    this.fs.write(
      this.destinationPath(BACKSTAGE_FILENAME),
      this.backstageDoc.toString(),
    );
  }
}
