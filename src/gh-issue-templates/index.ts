import { BaseGenerator } from '../util/base-generator.js';
import { ensureGitRepositoryRoot } from '../util/git.js';
import { BACKSTAGE_KIND_NRCOMPOSER } from '../util/yaml.js';

/**
 * Add GitHub issue templates to a repository
 *
 * Copies the bundled issue templates into .github/ISSUE_TEMPLATE so the
 * repository gets a consistent issue workflow (bug, feature, task, epic,
 * question, documentation, UX, decision, security triage, and custom).
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'GitHub Issue Templates',
      subtitle: 'Add GitHub issue templates to the repository',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-issue-templates-gh-issue-templates',
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
    // Copy every bundled issue template into .github/ISSUE_TEMPLATE
    this.fs.copyTpl(
      this.templatePath('*.md'),
      this.destinationPath('.github/ISSUE_TEMPLATE'),
      {},
    );
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
