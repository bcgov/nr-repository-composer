'use strict';
import chalk from 'chalk';
import Generator from 'yeoman-generator';
import { BackstageStorage } from '../util/backstage.storage.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_LOCATION } from '../util/yaml.js';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import {
  PROMPT_LOCATION_NAME,
  PROMPT_LOCATION_TARGETS,
  getPromptToUsage,
} from '../util/prompts.js';

const questions = [PROMPT_LOCATION_NAME, PROMPT_LOCATION_TARGETS];

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
      BACKSTAGE_KIND_LOCATION,
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
          'Create a `catalog-info.yaml` Backstage location file',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#backstage-backstage-location',
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

    bailOnUnansweredQuestions(questions, this.answers, headless, askAnswered);
    this.answers = await this.prompt(questions, 'config');
  }

  writingBackstage() {
    this.config.setPath(['spec', 'type'], 'path');
    this.config.save();
  }
}
