import chalk from 'chalk';
import type { PromptQuestion } from 'yeoman-generator';
import { BaseGenerator } from '../util/base-generator.js';
import { BackstageInstancesStorage } from './storage.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  YEOMAN_CONFIG_NAMESPACE,
  YEOMAN_OPTION_ASK_ANSWERED,
} from '../util/constants.js';
import { getInstanceName, type CatalogInstance } from '../util/instances.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import {
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
} from '../util/prompts.js';

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
    'Zero-based environment link to edit (default 0). Use the instance count or -1 to add. Not supported with --headless.',
};

const instanceKey = (instance: CatalogInstance) =>
  JSON.stringify([instance.env, getInstanceName(instance)]);

/**
 * Add or edit a component's deployed-environment links in `catalog-info.yaml`.
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

  override _getStorage(): BackstageInstancesStorage {
    return new BackstageInstancesStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  protected override get backstageConfig(): BackstageInstancesStorage {
    return this.config as unknown as BackstageInstancesStorage;
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name] === true;
    const askAnswered = this.options[YEOMAN_OPTION_ASK_ANSWERED] === true;

    this.backstageConfig.ensureKindExists(BACKSTAGE_KIND_COMPONENT);
    this._printIntro();

    const requestedIndex = this.options[OPTION_INDEX.name];
    if (headless && requestedIndex !== undefined) {
      throw new Error('--index cannot be used with --headless.');
    }
    const instanceCount = this.backstageConfig.getInstanceLinks().length;
    let index = Number(requestedIndex ?? 0);
    if (index === -1) {
      index = instanceCount;
    }
    if (!Number.isInteger(index) || index < 0 || index > instanceCount) {
      throw new Error(
        `Instance index ${index} is out of range: ${instanceCount} instance link(s) exist. Use -1 to add a new instance.`,
      );
    }
    const scanExistingInstances =
      headless || (requestedIndex === undefined && !askAnswered);
    const advanceToNextInstance = (storage: BackstageInstancesStorage) => {
      index += 1;
      return index < storage.getInstanceLinks().length;
    };

    for (;;) {
      const storage = this.backstageConfig;
      const instances = storage.getInstanceLinks();
      const isNew = index === instances.length;
      storage.selectInstanceLink(index);
      const otherKeys = new Set(
        instances
          .filter((_, instanceIndex) => instanceIndex !== index)
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
      if (headless || (answered && !askAnswered)) {
        if (scanExistingInstances && advanceToNextInstance(storage)) {
          continue;
        }
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

      if (scanExistingInstances && !headless && !isNew) {
        if (advanceToNextInstance(storage)) {
          continue;
        }
        return;
      }

      if (!isNew && !(askAnswered && requestedIndex === undefined)) {
        return;
      }
      const nextIndex = index + 1;
      const nextExists =
        nextIndex < this.backstageConfig.getInstanceLinks().length;
      index = nextIndex;
      if (nextExists) {
        continue;
      }
      const { next } = await this.prompt([
        {
          type: 'confirm',
          name: 'next',
          message: 'Add another instance?',
          default: false,
        },
      ]);
      if (!next) {
        return;
      }
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
