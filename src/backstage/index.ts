'use strict';
import { BaseGenerator } from '../util/base-generator.js';
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
export default class extends BaseGenerator {
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
    this._questions = questions;
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
