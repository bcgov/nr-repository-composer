import { BaseGenerator } from '../util/base-generator.js';
import { ensureGitRepositoryRoot } from '../util/git.js';
import { BACKSTAGE_KIND_NRCOMPOSER } from '../util/yaml.js';

/**
 * Add Polaris Pipeline Composer agent guidance files and refresh skill to a repository
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'Polaris Pipeline Composer Agent',
      subtitle:
        'Add agent guidance files for staff-run Polaris Pipeline composer updates',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#polaris-pipeline-composer-agent-gh-polaris-composer-agent',
        ],
      ],
    };
  }

  // No entity fields are read or written: target the composer document so
  // storage never adds a placeholder entity for a kind the catalog lacks.
  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_NRCOMPOSER };
  }

  async prompting() {
    ensureGitRepositoryRoot(this.destinationRoot(), this._getGeneratorName());
    return super.prompting();
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('AGENTS.md'),
      this.destinationPath('AGENTS.md'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath(
        '.github/instructions/polaris-composer.instructions.md',
      ),
      this.destinationPath(
        '.github/instructions/polaris-composer.instructions.md',
      ),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('.github/skills/polaris-pipeline-composer/SKILL.md'),
      this.destinationPath('.github/skills/polaris-pipeline-composer/SKILL.md'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('.github/skills/refresh-polaris-pipeline/SKILL.md'),
      this.destinationPath('.github/skills/refresh-polaris-pipeline/SKILL.md'),
      {},
    );

    const legacyPrompt = this.destinationPath(
      '.github/prompts/refresh-polaris-pipeline.prompt.md',
    );
    if (this.fs.exists(legacyPrompt)) {
      this.fs.delete(legacyPrompt);
    }
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
