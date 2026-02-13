'use strict';
import Generator from 'yeoman-generator';

/**
 * Generate the files needed for Java development patterns
 */
export default class extends Generator {
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
