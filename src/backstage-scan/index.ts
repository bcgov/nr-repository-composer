import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { OPTION_HEADLESS } from '../util/options.js';
import {
  formatScanRecordsHeadless,
  formatScanRecordsHuman,
  scanRepository,
} from '../util/scan.js';
import type { BaseOptions } from 'yeoman-generator';

/**
 * Summarize the composers (generators) recorded across a repository's
 * catalog-info.yaml files.
 *
 * Read-only: it never writes files and never records itself as a generator.
 * With --headless it emits tab-separated records for scripts to consume.
 */
export default class extends BaseGenerator {
  constructor(args: string | string[], opts: BaseOptions) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Backstage Scan',
      subtitle: 'Summarize the composers recorded in this repository',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/tree/main/src/backstage-scan',
        ],
      ],
    };
  }

  _getStorageOptions() {
    return {
      kind: BACKSTAGE_KIND_COMPONENT,
      storageOptions: { ignoreKindMismatch: true },
    };
  }

  async prompting() {
    return super.prompting();
  }

  // Read-only utility: never persist answers or the generator annotation.
  override writingBackstage() {}

  end() {
    const records = scanRepository();

    if (this.options[OPTION_HEADLESS.name]) {
      const output = formatScanRecordsHeadless(records);
      if (output) {
        // Write directly so records always land on stdout for piping.
        process.stdout.write(`${output}\n`);
      }
      return;
    }

    this.log(formatScanRecordsHuman(records));
  }
}
