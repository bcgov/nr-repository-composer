import * as fs from 'fs';
import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_LOCATION } from '../util/yaml.js';
import { normalizeCatalogTargets } from '../util/backstage.js';
import { OPTION_SKIP_WRITE } from '../util/options.js';
import { PROMPT_LOCATION_TARGETS } from '../util/prompts.js';

const questions = [PROMPT_LOCATION_TARGETS];

const DEFAULT_LOCATION_NAME = 'locations';

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
    return {
      kind: BACKSTAGE_KIND_LOCATION,
      metadataName: DEFAULT_LOCATION_NAME,
    };
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
    // The stored answer is a comma-separated string; spec.targets is the list.
    const locationTargets = this.backstageConfig.getPath(
      ['spec', 'targets'],
      'json',
    );

    if (Array.isArray(locationTargets)) {
      for (const normalized of locationTargets) {
        // Targets are relative to this Location's catalog file.
        if (!fs.existsSync(this.destinationPath(String(normalized)))) {
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
