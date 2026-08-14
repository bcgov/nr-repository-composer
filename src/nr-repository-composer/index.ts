'use strict';
import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { OPTION_HEADLESS } from '../util/options.js';
import type { BaseOptions } from 'yeoman-generator';

/**
 * Copy nr-repository-composer tool to the repository
 */
export default class extends BaseGenerator {
  constructor(args: string | string[], opts: BaseOptions) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Repository Composer',
      subtitle: 'Copy nr-repository-composer tool to repository',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#nr-repository-composer',
        ],
      ],
    };
  }

  async prompting() {
    return super.prompting();
  }

  _getStorageOptions() {
    return {
      kind: BACKSTAGE_KIND_COMPONENT,
      storageOptions: { ignoreKindMismatch: true },
    };
  }

  writing() {
    // Copy the main runner script
    this.fs.copyTpl(
      this.templatePath('nr-repository-composer.sh'),
      this.destinationPath('nr-repository-composer.sh'),
      {},
      { mode: 0o755 } as any,
    );
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
    if (!this.options[OPTION_HEADLESS.name]) {
      this.log('\n✔ nr-repository-composer tool copied to repository root');
      this.log(
        '  Run: ./nr-repository-composer.sh <working-dir> <generator> [options]',
      );
    }
  }
}
