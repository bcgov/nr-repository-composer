import { BaseGenerator } from '../util/base-generator.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_DESCRIPTION,
  PROMPT_TITLE,
  PROMPT_TYPE,
  PROMPT_TAGS,
  PROMPT_LIFECYCLE,
  PROMPT_LICENSE,
  PROMPT_OWNER,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_INSTANCES_ENVS,
  PROMPT_INSTANCE_URL,
  PROMPT_INSTANCES_CUSTOM,
} from '../util/prompts.js';
import {
  STANDARD_ENVIRONMENTS,
  shouldSkipInstancePrompts,
  getInstanceName,
  mergeInstances,
  parseInstances,
  prefillInstancePrompts,
} from '../util/instances.js';
import type { CatalogInstance } from '../util/instances.js';
import { YEOMAN_OPTION_ASK_ANSWERED } from '../util/constants.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_DESCRIPTION,
  PROMPT_TITLE,
  PROMPT_TYPE,
  PROMPT_TAGS,
  PROMPT_LIFECYCLE,
  PROMPT_LICENSE,
  PROMPT_OWNER,
  PROMPT_GITHUB_PROJECT_SLUG,
];

const INSTANCES_ANNOTATION_PATH = [
  'metadata',
  'annotations',
  'playbook.io.nrs.gov.bc.ca/instances',
];

/**
 * Generate a basic backstage file
 */
export default class extends BaseGenerator {
  private storedInstancesForRun: CatalogInstance[] = [];
  private skipInstancePrompts = false;

  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Backstage Software Catalog Generator',
      subtitle: 'Create a `catalog-info.yaml` Backstage file',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#backstage-backstage',
        ],
        [
          'Documentation',
          'https://backstage.io/docs/features/software-catalog/',
        ],
      ],
    };
    this._questions = [
      ...questions,
      { ...PROMPT_INSTANCES_ENVS },
      ...STANDARD_ENVIRONMENTS.map((env) => PROMPT_INSTANCE_URL(env)),
      { ...PROMPT_INSTANCES_CUSTOM },
    ];
  }

  async prompting() {
    return super.prompting();
  }

  _prePrompt() {
    const storedInstances = parseInstances(this.answers.instances);
    this.storedInstancesForRun = storedInstances;
    this.skipInstancePrompts = shouldSkipInstancePrompts(
      storedInstances,
      this.options[YEOMAN_OPTION_ASK_ANSWERED] === true,
    );

    if (this.skipInstancePrompts) {
      this._questions = this._questions.filter(
        (question) =>
          question.name !== 'instanceEnvs' &&
          question.name !== 'instancesCustom' &&
          !question.name.startsWith('instanceUrl:'),
      );
    }

    const { selectedEnvs, urlByEnv } = prefillInstancePrompts(storedInstances);
    const standardEnvs = new Set<string>(STANDARD_ENVIRONMENTS);
    const customInstances = storedInstances.filter(
      (instance) =>
        !standardEnvs.has(instance.env) ||
        getInstanceName(instance) !== instance.env,
    );
    const customValue = customInstances.length
      ? JSON.stringify(customInstances)
      : '';

    this.answers.instanceEnvs = selectedEnvs;
    this.answers.instancesCustom = customValue;

    for (const question of this._questions) {
      if (question.name === 'instanceEnvs') {
        question.default = selectedEnvs;
      } else if (question.name.startsWith('instanceUrl:')) {
        const env = question.name.slice('instanceUrl:'.length);
        const url = urlByEnv.get(env) ?? '';
        question.default = url;
        this.answers[question.name] = url;
      } else if (question.name === 'instancesCustom') {
        question.default = customValue;
      }
    }
  }

  _postPrompt() {
    if (!this.skipInstancePrompts) {
      return;
    }

    const standardEnvs = new Set<string>(STANDARD_ENVIRONMENTS);
    const customInstances = this.storedInstancesForRun.filter(
      (instance) =>
        !standardEnvs.has(instance.env) ||
        getInstanceName(instance) !== instance.env,
    );
    const { selectedEnvs, urlByEnv } = prefillInstancePrompts(
      this.storedInstancesForRun,
    );

    this.answers.instances = JSON.stringify(this.storedInstancesForRun);
    this.answers.instanceEnvs = selectedEnvs;
    this.answers.instancesCustom = JSON.stringify(customInstances);
    for (const env of STANDARD_ENVIRONMENTS) {
      this.answers[`instanceUrl:${env}`] = urlByEnv.get(env) ?? '';
    }
  }

  writingBackstage() {
    const storedInstances = parseInstances(this.answers.instances);
    const selectedEnvs = Array.isArray(this.answers.instanceEnvs)
      ? (this.answers.instanceEnvs as string[])
      : [];
    const instancesCustom = parseInstances(this.answers.instancesCustom);
    const instances = mergeInstances({
      stored: storedInstances,
      selectedEnvs,
      urlByEnv: Object.fromEntries(
        STANDARD_ENVIRONMENTS.map((env) => [
          env,
          String(this.answers[`instanceUrl:${env}`] ?? ''),
        ]),
      ),
      custom: instancesCustom,
    });

    if (instances.length > 0) {
      this.backstageConfig.setPath(
        INSTANCES_ANNOTATION_PATH,
        JSON.stringify(instances),
      );
    } else {
      this.backstageConfig.doc.deleteIn(INSTANCES_ANNOTATION_PATH);
    }
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
