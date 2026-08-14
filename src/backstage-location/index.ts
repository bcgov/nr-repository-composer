import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_LOCATION } from '../util/yaml.js';
import {
  PROMPT_LOCATION_NAME,
  PROMPT_LOCATION_TARGETS,
} from '../util/prompts.js';

const questions = [PROMPT_LOCATION_NAME, PROMPT_LOCATION_TARGETS];

/**
 * Generate a basic backstage location file
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Backstage Software Catalog Generator',
      subtitle: 'Create a `catalog-info.yaml` Backstage location file',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#backstage-backstage-location',
        ],
        [
          'Documentation',
          'https://backstage.io/docs/features/software-catalog/',
        ],
      ],
    };
    this._questions = questions;
  }

  async prompting() {
    return super.prompting();
  }

  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_LOCATION, storageOptions: {} };
  }

  writingBackstage() {
    super.writingBackstage();
    this.backstageConfig.setPath(['spec', 'type'], 'path');
    this.backstageConfig.save();
  }

  end() {
    super.end();
  }
}
