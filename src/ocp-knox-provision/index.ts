'use strict';
import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { destinationGitPath } from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_INTENTION_USER,
} from '../util/prompts.js';

const questions = [PROMPT_PROJECT, PROMPT_SERVICE, PROMPT_INTENTION_USER];

/**
 * Generate the CI workflow and NR Broker intention files needed for OCP Knox Provision
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR OCP Knox Provision Generator',
      subtitle: 'Create workflow for OCP Knox Provision',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-docs-deploy-gh-docs-deploy',
        ],
      ],
    };
    this._questions = questions;
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

  // Generate GitHub workflows
  writingWorkflow() {
    const { projectName, serviceName, intentionUser } = this.answers;
    const envValues = {
      projectName,
      serviceName,
      intentionUser,
    };
    this.fs.copyTpl(
      this.templatePath('README.md'),
      destinationGitPath('provision-secret-cron/README.md'),
      {},
    );
    this.fs.copyTpl(
      this.templatePath('env-values.yaml'),
      destinationGitPath('provision-secret-cron/values/dev.yaml'),
      {
        ...envValues,
        environment: 'development',
      },
    );
    this.fs.copyTpl(
      this.templatePath('env-values.yaml'),
      destinationGitPath('provision-secret-cron/values/test.yaml'),
      {
        ...envValues,
        environment: 'test',
      },
    );
    this.fs.copyTpl(
      this.templatePath('env-values.yaml'),
      destinationGitPath('provision-secret-cron/values/prod.yaml'),
      {
        ...envValues,
        environment: 'production',
      },
    );
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
