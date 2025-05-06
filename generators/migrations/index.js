'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { Document, parseDocument } from 'yaml';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnAnyQuestions } from '../util/process.js';
import {
  PROMPT_SCHEMA_NAME,
  PROMPT_SCHEMA_MIGRATION_TOOL,
  PROMPT_SCHEMA_MIGRATION_TYPE,
  PROMPT_SCHEMA_MIGRATION_BASE_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
  addGeneratorToDoc,
} from '../util/yaml.js';

const questions = [
  PROMPT_SCHEMA_NAME,
  PROMPT_SCHEMA_MIGRATION_TOOL,
  PROMPT_SCHEMA_MIGRATION_TYPE,
  PROMPT_SCHEMA_MIGRATION_BASE_PATH,
];

/**
 * Generate a database directory
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
        nrsay('NR Database Generator', 'Create standard database file layout', [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#db-migrations-migrations',
        ]),
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
