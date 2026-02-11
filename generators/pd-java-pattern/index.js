'use strict';
import BaseGenerator from '../pd-base-playbook/index.js';

/**
 * Generate the files needed for Java development patterns
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  // Generate files
  writing() {
    // this.log('Generating files: ' + this.args);
    // this.fs.copyTpl(
    //   this.templatePath('mvnw.cmd'),
    //   destinationGitPath('mvnw.cmd'),
    //   {},
    //   { mode: 0o755 },
    // );
  }
}
