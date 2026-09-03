import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';

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
