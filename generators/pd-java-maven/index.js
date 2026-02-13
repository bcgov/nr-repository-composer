'use strict';
import path from 'node:path';
import BaseGenerator from '../pd-base-playbook/index.js';
import { destinationGitPath } from '../util/git.js';

/**
 * Generate the files needed for Maven
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  // Generate files
  writing() {
    // Template path is "drop dot and underscores for folders"
    this.fs.copyTpl(
      this.templatePath('gitignore'),
      destinationGitPath(path.join(this.options.relativePath, '.gitignore')),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('mvn_maven.config'),
      destinationGitPath('.mvn/maven.config'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('mvn_settings.xml'),
      destinationGitPath('.mvn/settings.xml'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('mvn_wrapper_maven-wrapper.properties'),
      destinationGitPath('.mvn/wrapper/maven-wrapper.properties'),
      {},
    );

    this.fs.copyTpl(
      this.templatePath('mvnw'),
      destinationGitPath('mvnw'),
      {},
      { mode: 0o755 },
    );

    // Not supporting Windows shell scripts at this time
  }
}
