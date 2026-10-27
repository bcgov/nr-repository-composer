import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_NRCOMPOSER } from '../util/yaml.js';
import { destinationGitPath, ensureGitRepositoryRoot } from '../util/git.js';
import type { BaseOptions } from 'yeoman-generator';

/**
 * Generate the CI workflow and NR Broker intention files needed for Docs deployment in GitHub
 */
export default class extends BaseGenerator {
  constructor(args: string | string[], opts: BaseOptions) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub Docs Deploy Generator',
      subtitle: 'Create workflow for GitHub Docs deployment',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-docs-deploy-gh-docs-deploy',
        ],
      ],
    };
  }

  _getStorageOptions() {
    return { kind: BACKSTAGE_KIND_NRCOMPOSER };
  }

  async prompting() {
    ensureGitRepositoryRoot(this.destinationRoot(), this._getGeneratorName());
    return super.prompting();
  }

  // Generate GitHub workflows
  writingWorkflow() {
    this.fs.copyTpl(
      this.templatePath('docs-deploy.yaml'),
      destinationGitPath('.github/workflows/docs-deploy.yaml'),
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
