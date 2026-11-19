import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_SYSTEM } from '../util/yaml.js';
import {
  PROMPT_SYSTEM_DESCRIPTION,
  PROMPT_SYSTEM_DOMAIN,
  PROMPT_SYSTEM_NAME,
  PROMPT_SYSTEM_OWNER,
} from '../util/prompts.js';

export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Backstage System Generator',
      subtitle: 'Create or edit a Backstage System entity in catalog-info.yaml',
      links: [
        [
          'Documentation',
          'https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-system',
        ],
      ],
    };
    this._questions = [
      PROMPT_SYSTEM_NAME,
      PROMPT_SYSTEM_DESCRIPTION,
      PROMPT_SYSTEM_OWNER,
      PROMPT_SYSTEM_DOMAIN,
    ];
  }

  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_SYSTEM };
  }

  async prompting() {
    return super.prompting();
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
