import * as fs from 'fs';
import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import { destinationGitPath } from '../util/git.js';
import { BACKSTAGE_KIND_LOCATION } from '../util/yaml.js';
import { normalizeCatalogTargets } from '../util/backstage.js';
import { OPTION_SKIP_WRITE } from '../util/options.js';
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
      subtitle:
        'Create a `catalog-info.yaml` location file at the repository root to describe a multi-service monorepo',
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

  _postPrompt() {
    this.backstageConfig.setPath(
      PROMPT_LOCATION_TARGETS.name,
      normalizeCatalogTargets(this.answers?.[PROMPT_LOCATION_TARGETS.name]),
    );
  }

  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_LOCATION, storageOptions: {} };
  }

  writingBackstage() {
    super.writingBackstage();
    // save the location-specific path when answers are being written.
    if (!this.options[OPTION_SKIP_WRITE.name]) {
      this.backstageConfig.setPath(['spec', 'type'], 'path');
      this.backstageConfig.save();
    }
  }

  end() {
    super.end();
    const locationTargets = this.backstageConfig.getPath(
      PROMPT_LOCATION_TARGETS.name,
    );

    if (Array.isArray(locationTargets)) {
      for (const normalized of locationTargets) {
        if (!fs.existsSync(destinationGitPath(normalized))) {
          this.log(
            chalk.yellow(
              `Warning: catalog file for target "${normalized}" not found.`,
            ),
          );
        }
      }
    }
  }
}
