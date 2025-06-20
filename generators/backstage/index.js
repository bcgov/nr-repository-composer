'use strict';
import chalk from 'chalk';
import Generator from 'yeoman-generator';
import { BackstageStorage } from '../util/backstage.storage.js';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_COMPONENT,
  generateSetAnswerPropPredicate,
} from '../util/yaml.js';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnAnyQuestions } from '../util/process.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_DESCRIPTION,
  PROMPT_TITLE,
  PROMPT_TYPE,
  PROMPT_LIFECYCLE,
  PROMPT_LICENSE,
  PROMPT_OWNER,
  PROMPT_GITHUB_PROJECT_SLUG,
  getPromptToUsage,
} from '../util/prompts.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_DESCRIPTION,
  PROMPT_TITLE,
  PROMPT_TYPE,
  PROMPT_LIFECYCLE,
  PROMPT_LICENSE,
  PROMPT_OWNER,
  PROMPT_GITHUB_PROJECT_SLUG,
];

/**
 * Generate a basic backstage file
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
          'NR Backstage Software Catalog Generator',
          'Create a `catalog-info.yaml` Backstage file',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#backstage-backstage',
          ],
          [
            'Documentation',
            'https://backstage.io/docs/features/software-catalog/',
          ],
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

  writingBackstage() {
    this.config.addGeneratorToDoc('backstage');
    this.config.save();
  }
}
