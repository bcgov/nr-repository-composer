import chalk from 'chalk';
import type { PromptQuestion } from 'yeoman-generator';
import { BaseGenerator } from '../util/base-generator.js';
import {
  YEOMAN_CONFIG_NAMESPACE,
  YEOMAN_OPTION_ASK_ANSWERED,
} from '../util/constants.js';
import {
  getInstanceName,
  instanceFromDoc,
  type CatalogInstance,
} from '../util/instances.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import {
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
  PROMPT_SERVICE,
} from '../util/prompts.js';
import {
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_INSTANCE,
  updateInstanceName,
} from '../util/yaml.js';

const questions = [
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
];

const OPTION_INDEX = {
  name: 'index',
  type: Number,
  required: false,
  description:
    'Zero-based Instance document to add or edit. Use the current instance count to add a new one.',
  default: 0,
};

const instanceKey = (instance: CatalogInstance) =>
  JSON.stringify([instance.env, getInstanceName(instance)]);

/**
 * Add or edit the deployed instances (`kind: Instance` documents) of a
 * component in its `catalog-info.yaml`.
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_INDEX);
    this._nrsayConfig = {
      title: 'NR Backstage Instances Generator',
      subtitle:
        'Add or edit the deployed instances of a component in `catalog-info.yaml`',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#backstage-backstage-instances',
        ],
      ],
    };
    this._questions = questions;
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name] === true;
    const askAnswered = this.options[YEOMAN_OPTION_ASK_ANSWERED] === true;
    const { serviceName } = this.backstageConfig.extractPromptValues(
      BACKSTAGE_KIND_COMPONENT,
      PROMPT_SERVICE,
    );

    this._printIntro();

    let index = Number(this.options[OPTION_INDEX.name] ?? 0);
    for (;;) {
      const isNew =
        index === this.backstageConfig.kindDocs(BACKSTAGE_KIND_INSTANCE).length;
      // Prompts now read and write this Instance document.
      const storage = this.backstageConfig;
      const doc = storage.selectKindDoc(BACKSTAGE_KIND_INSTANCE, index);
      const otherKeys = new Set(
        this.backstageConfig
          .kindDocs(BACKSTAGE_KIND_INSTANCE)
          .filter((other) => other !== doc)
          .map(instanceFromDoc)
          .filter((instance) => instance !== undefined)
          .map(instanceKey),
      );

      bailOnUnansweredQuestions(
        this._questions,
        storage.getAnswers(),
        headless,
        askAnswered,
      );
      const answered = this._questions.every(
        (q) => storage.getPath(q.name) !== undefined,
      );
      if (answered && !askAnswered) {
        // Already set up: nothing to ask, so do not offer to continue either.
        return;
      }
      if (!headless) {
        this.log(
          chalk.bold(
            `\n${isNew ? 'Adding' : 'Editing'} instance ${index} (--index ${index})`,
          ),
        );
      }

      // Yeoman mutates prompt definitions, so pass fresh copies each pass.
      const instanceQuestions: PromptQuestion[] = this._questions.map((q) => ({
        ...q,
      }));
      const nameQuestion = instanceQuestions.find(
        (q) => q.name === PROMPT_INSTANCE_NAME.name,
      );
      if (nameQuestion) {
        // Reject an (env, name) pair already used by another instance; it
        // would produce a duplicate entity name.
        nameQuestion.validate = (input: string, answers) => {
          const env = String(
            answers?.[PROMPT_INSTANCE_ENV.name] ??
              storage.getPath(PROMPT_INSTANCE_ENV.name) ??
              '',
          ).trim();
          return (
            !otherKeys.has(instanceKey({ env, name: input?.trim() })) ||
            `An instance named "${input?.trim() || env}" already exists in environment "${env}"`
          );
        };
      }
      this.answers = await this.prompt(
        instanceQuestions,
        YEOMAN_CONFIG_NAMESPACE,
      );
      updateInstanceName(doc, serviceName);

      if (headless) {
        return;
      }
      const nextIndex = index + 1;
      const nextExists =
        nextIndex <
        this.backstageConfig.kindDocs(BACKSTAGE_KIND_INSTANCE).length;
      const { next } = await this.prompt([
        {
          type: 'confirm',
          name: 'next',
          message: nextExists
            ? `Edit the next instance (--index ${nextIndex})?`
            : 'Add another instance?',
          default: false,
        },
      ]);
      if (!next) {
        return;
      }
      index = nextIndex;
    }
  }

  end() {
    super.end();
  }

  // Yeoman only queues tasks declared on the generator's own class.
  writingBackstage() {
    super.writingBackstage();
  }
}
