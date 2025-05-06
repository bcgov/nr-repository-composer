'use strict';
import * as fs from 'fs';
import chalk from 'chalk';
import Generator from 'yeoman-generator';
import { Document, parseDocument } from 'yaml';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  addGeneratorToDoc,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
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

  writingBackstage() {
    writePropToPath(this.backstageDoc, pathToProps, this.answers);

    this.backstageDoc.setIn(['apiVersion'], 'backstage.io/v1alpha1');
    this.backstageDoc.setIn(['kind'], 'Component');
    addGeneratorToDoc(this.backstageDoc, 'backstage');

    this.fs.write(
      this.destinationPath(BACKSTAGE_FILENAME),
      this.backstageDoc.toString(),
    );
  }
}
