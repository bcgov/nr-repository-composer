'use strict';
import Generator from 'yeoman-generator';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { outputReport } from '../util/report.js';

/**
 * Add Polaris Pipeline Composer agent guidance files to a repository
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
          'Polaris Pipeline Composer Agent',
          'Add agent guidance files for staff-run Polaris Pipeline composer updates',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#polaris-pipeline-composer-agent-gh-polaris-composer-agent',
          ],
        ),
      );
    }
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('AGENTS.md'),
      this.destinationPath('AGENTS.md'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('.github/instructions/polaris-composer.instructions.md'),
      this.destinationPath('.github/instructions/polaris-composer.instructions.md'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('.github/skills/polaris-pipeline-composer/SKILL.md'),
      this.destinationPath('.github/skills/polaris-pipeline-composer/SKILL.md'),
      {},
    );
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-polaris-composer-agent');
    this.config.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-polaris-composer-agent', {});
    }
  }
}
