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
  description:
    'Zero-based API document to edit (default 0). Use the API count or -1 to add. Not supported with --headless.',
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
    const requestedIndex = this.options[OPTION_INDEX.name];
    if (headless && requestedIndex !== undefined) {
      throw new Error('--index cannot be used with --headless.');
    }
    const apiDocs = this.backstageConfig.kindDocs(BACKSTAGE_KIND_API);
    // Storage creates a header for the first API before prompting.
    const initialCount =
      apiDocs.length === 1 &&
      !apiDocs[0].has('metadata') &&
      !apiDocs[0].has('spec')
        ? 0
        : apiDocs.length;
    let index = Number(requestedIndex ?? 0);
    if (index === -1) {
      index = initialCount;
    }
    if (!Number.isInteger(index) || index < 0 || index > initialCount) {
      throw new Error(
        `API index ${index} is out of range: ${initialCount} API document(s) exist. Use -1 to add a new API.`,
      );
    }

    this._printIntro();

    for (;;) {
      const storage = this.backstageConfig;
      const apiCount = storage.kindDocs(BACKSTAGE_KIND_API).length;
      storage.selectKindDoc(BACKSTAGE_KIND_API, index);
      // Storage initializes an unnamed header when creating the first API.
      const isNew =
        index === apiCount || !storage.doc.getIn(['metadata', 'name']);

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
      if (headless || (answered && !askAnswered)) {
        if (headless) {
          index += 1;
          if (index < apiCount) {
            continue;
          }
        }
        return;
      }

      if (!headless) {
        this.log(
          chalk.bold(
            `\n${isNew ? 'Adding' : 'Editing'} API ${index} (--index ${index})`,
          ),
        );
      }

      const apiQuestions: PromptQuestion[] = this._questions.map((question) => {
        if (typeof question !== 'object' || question === null) {
          return question;
        }
        const apiQuestion = { ...question };
        if (apiQuestion.name === PROMPT_API_NAME.name) {
          apiQuestion.validate = (input: string) => {
            const syntaxValidation = PROMPT_API_NAME.validate?.(input);
            if (syntaxValidation !== true) {
              return syntaxValidation;
            }
            const namespace =
              storage.doc.getIn(['metadata', 'namespace']) ?? 'default';
            const duplicate = storage
              .kindDocs(BACKSTAGE_KIND_API)
              .some(
                (doc, docIndex) =>
                  docIndex !== index &&
                  doc.getIn(['metadata', 'name']) === input &&
                  (doc.getIn(['metadata', 'namespace']) ?? 'default') ===
                    namespace,
              );
            return duplicate
              ? `An API named "${input}" already exists in namespace "${namespace}".`
              : true;
          };
        }
        return apiQuestion;
      });
      this.answers = await this.prompt(apiQuestions, YEOMAN_CONFIG_NAMESPACE);
      this._postPrompt();

      if (!isNew && !(askAnswered && requestedIndex === undefined)) {
        return;
      }
      const nextIndex = index + 1;
      const nextExists =
        nextIndex < storage.kindDocs(BACKSTAGE_KIND_API).length;
      index = nextIndex;
      if (nextExists) {
        continue;
      }
      const { next } = await this.prompt([
        {
          type: 'confirm',
          name: 'next',
          message: 'Add another API?',
          default: false,
        },
      ]);
      if (!next) {
        return;
      }
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
