'use strict';
import Generator from 'yeoman-generator';
import { destinationGitPath } from '../util/git.js';
import { updateReadmeWithPipelineGuide, rmIfExists } from '../util/copyworkflows.js';

/**
 * Generate the files needed for Maven
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  // Generate files
  writing() {
    // Template path is "drop dot and underscores for folders"
    // TODO: Insert contents as part of existing .gitignore if it exists instead of overwriting
    // this.fs.copyTpl(
    //   this.templatePath('gitignore'),
    //   destinationGitPath(path.join(this.options.relativePath, '.gitignore')),
    //   {},
    // );

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

    // Update README with Polaris Pipeline guide
    updateReadmeWithPipelineGuide(this);

    // Clean up old files if they exist (may remove in future)
    rmIfExists(
      this,
      destinationGitPath('.github/polaris-maven-settings.xml'),
    );
  }
}
