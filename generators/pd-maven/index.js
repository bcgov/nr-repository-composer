'use strict';
import BaseGenerator from '../pd-base-playbook/index.js';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import { destinationGitPath, relativeGitPath } from '../util/git.js';

/**
 * Generate the files needed for Maven
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  // Generate files
  writing() {
    this.log('Generating files');
    this.fs.copyTpl(
      this.templatePath('polaris-maven-settings.xml'),
      destinationGitPath('.github/polaris-maven-settings.xml'),
      {},
    );
  }
}
