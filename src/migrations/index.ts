'use strict';
import { BaseGenerator } from '../util/base-generator.js';
import {
  PROMPT_SCHEMA_NAME,
  PROMPT_SCHEMA_MIGRATION_TOOL,
  PROMPT_SCHEMA_MIGRATION_TYPE,
  PROMPT_SCHEMA_MIGRATION_BASE_PATH,
} from '../util/prompts.js';

const questions = [
  PROMPT_SCHEMA_NAME,
  PROMPT_SCHEMA_MIGRATION_TOOL,
  PROMPT_SCHEMA_MIGRATION_TYPE,
  PROMPT_SCHEMA_MIGRATION_BASE_PATH,
];

/**
 * Generate a database directory
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR Database Generator',
      subtitle: 'Create standard database file layout',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#db-migrations-migrations',
        ],
      ],
    };
    this._questions = questions;
  }

  async prompting() {
    return super.prompting();
  }

  writingDatabase() {
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath('migrations/README.md'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        schemaMigrationTool: this.answers.schemaMigrationTool,
      },
    );
    this.fs.copyTpl(
      this.templatePath('util/'),
      this.destinationPath('migrations/util/setenv-prod.sh'),
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
