'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
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
  generateSetAnswerPropPredicate,
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
    this.config.addGeneratorToDoc('migrations');
    this.config.save();
  }
}
