import * as fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import type { PromptQuestion } from 'yeoman-generator';
import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_API } from '../util/yaml.js';
import {
  YEOMAN_CONFIG_NAMESPACE,
  YEOMAN_OPTION_ASK_ANSWERED,
} from '../util/constants.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import {
  PROMPT_API_DEFINITION,
  PROMPT_API_DESCRIPTION,
  PROMPT_API_LIFECYCLE,
  PROMPT_API_NAME,
  PROMPT_API_OWNER,
  PROMPT_API_SYSTEM,
  PROMPT_API_TYPE,
} from '../util/prompts.js';

const questions = [
  PROMPT_API_NAME,
  PROMPT_API_DESCRIPTION,
  PROMPT_API_TYPE,
  PROMPT_API_LIFECYCLE,
  PROMPT_API_OWNER,
  PROMPT_API_SYSTEM,
  PROMPT_API_DEFINITION,
];

const OPTION_INDEX = {
  name: 'index',
  type: Number,
  required: false,
  description: 'Zero-based API document to add or edit.',
  default: 0,
};

export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_INDEX);
    this._nrsayConfig = {
      title: 'NR Backstage API Generator',
      subtitle: 'Create or edit a Backstage API entity in catalog-info.yaml',
      links: [
        [
          'Documentation',
          'https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-api',
        ],
      ],
    };
    this._questions = questions;
  }

  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_API };
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name] === true;
    const askAnswered = this.options[YEOMAN_OPTION_ASK_ANSWERED] === true;
    let index = Number(this.options[OPTION_INDEX.name] ?? 0);

    this._printIntro();

    for (;;) {
      const storage = this.backstageConfig;
      const apiCount = storage.kindDocs(BACKSTAGE_KIND_API).length;
      const isNew = index === apiCount;
      storage.selectKindDoc(BACKSTAGE_KIND_API, index);

      const answers = storage.getAnswers();
      bailOnUnansweredQuestions(
        this._questions,
        answers,
        headless,
        askAnswered,
      );
      const answered = this._questions.every(
        (question) => storage.getPath(question.name) !== undefined,
      );
      if (answered && !askAnswered) {
        return;
      }

      if (!headless) {
        this.log(
          chalk.bold(
            `\n${isNew ? 'Adding' : 'Editing'} API ${index} (--index ${index})`,
          ),
        );
      }

      const apiQuestions: PromptQuestion[] = this._questions.map((question) =>
        typeof question === 'object' && question !== null
          ? { ...question }
          : question,
      );
      this.answers = await this.prompt(apiQuestions, YEOMAN_CONFIG_NAMESPACE);
      this._postPrompt();

      if (headless) {
        return;
      }
      const nextIndex = index + 1;
      const nextExists =
        nextIndex < storage.kindDocs(BACKSTAGE_KIND_API).length;
      const { next } = await this.prompt([
        {
          type: 'confirm',
          name: 'next',
          message: nextExists
            ? `Edit the next API (--index ${nextIndex})?`
            : 'Add another API?',
          default: false,
        },
      ]);
      if (!next) {
        return;
      }
      index = nextIndex;
    }
  }

  _postPrompt() {
    const definition = String(this.answers?.apiDefinition ?? '').trim();
    const definitionPath = path.isAbsolute(definition)
      ? definition
      : this.destinationPath(definition);
    if (fs.existsSync(definitionPath) && fs.statSync(definitionPath).isFile()) {
      this.backstageConfig.setPath(
        'apiDefinition',
        fs.readFileSync(definitionPath, 'utf8'),
      );
    }
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
