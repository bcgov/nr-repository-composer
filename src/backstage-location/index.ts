import * as fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import { destinationGitPath } from '../util/git.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_LOCATION } from '../util/yaml.js';
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
        'Create a `catalog-info.yaml` location file at the repository root so that automation can discover every component catalog in a multi-service monorepo',
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
    // save the location-specific path when answers are being written.
    if (!this.options[OPTION_SKIP_WRITE.name]) {
      this.backstageConfig.setPath(['spec', 'type'], 'path');
      // Persist the normalized targets (catalog file names appended) so that
      // the location actually points at the component catalog files.
      // 'locationTargets' is a csv field, so pass the prop key (not the path)
      // to store the result as a YAML sequence under spec.targets.
      const targets = this._normalizeTargets(this.answers?.locationTargets);
      if (targets.length > 0) {
        this.backstageConfig.setPath('locationTargets', targets.join(','));
      }
      this.backstageConfig.save();
    }
  }

  /**
   * Normalize the entered target paths, appending the catalog file name to any
   * path that does not already end with it, and warn for any target whose
   * catalog file does not exist on disk.
   * @param {string} rawTargets comma-separated list of target paths
   * @returns {string[]} the normalized target paths
   */
  _normalizeTargets(rawTargets) {
    const targets = String(rawTargets ?? '')
      .split(',')
      .map((target) => target.trim())
      .filter(Boolean);

    return targets.map((target) => {
      const normalized = target.endsWith(BACKSTAGE_FILENAME)
        ? target
        : path.join(target, BACKSTAGE_FILENAME);

      if (!fs.existsSync(destinationGitPath(normalized))) {
        this.log(
          chalk.yellow(
            `Warning: catalog file for target "${normalized}" not found.`,
          ),
        );
      }

      return normalized;
    });
  }
  end() {
    super.end();
  }
}
