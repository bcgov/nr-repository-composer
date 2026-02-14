'use strict';
import Generator from 'yeoman-generator';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { BackstageStorage } from '../util/backstage.storage.js';
/**
 * Copy nr-repository-composer tool to the repository
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
      { ignoreKindMismatch: true },
    );
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];

    if (!headless) {
      this.log(
        nrsay(
          'NR Repository Composer',
          'Copy nr-repository-composer tool to repository',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#nr-repository-composer',
          ],
        ),
      );
    }
  }

  writing() {
    // Copy the main runner script
    this.fs.copyTpl(
      this.templatePath('nr-repository-composer.sh'),
      this.destinationPath('nr-repository-composer.sh'),
      {},
      { mode: 0o755 },
    );
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('nr-repository-composer');
    this.config.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      this.log('\n✔ nr-repository-composer tool copied to repository root');
      this.log(
        '  Run: ./nr-repository-composer.sh <working-dir> <generator> [options]',
      );
    }
  }
}
