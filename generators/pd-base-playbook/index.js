'use strict';
import Generator from 'yeoman-generator';
import * as fs from 'node:fs';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { BackstageStorage } from '../util/backstage.storage.js';

/**
 * Generate the Ansible playbook and variable files needed for a generic webapp deployments
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('projectName', {
      type: String,
      required: true,
      description: 'Project Name',
    });
    this.argument('serviceName', {
      type: String,
      required: true,
      description: 'Service Name',
    });
    this.argument('playbookPath', {
      type: String,
      required: false,
      description: 'Playbook Path',
      default: 'playbooks',
    });
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  // Generate Ansible variable files
  writing() {
    this.log('Generating variable files');
    // Initialize empty files that can be used for custom variables
    // Skip copying templates if any custom files already exist
    const varsFiles = fs.readdirSync(this.templatePath('vars/custom'));
    for (const file of varsFiles) {
      if (
        !fs.existsSync(
          this.destinationPath(
            `${this.options.playbookPath}/vars/custom/${file}`,
          ),
        )
      ) {
        this.fs.copyTpl(
          this.templatePath(`vars/custom/${file}`),
          this.destinationPath(
            `${this.options.playbookPath}/vars/custom/${file}`,
          ),
          {},
        );
      }
    }
    if (this.fs.exists(this.destinationPath('README.md'))) {
      var readmeContent = this.fs.read(this.destinationPath('README.md'));
      const readmeRegex = new RegExp(
        '<!-- README\\.md\\.tpl:START -->.*<!-- README\\.md\\.tpl:END -->',
        'gs',
      );
      if (!readmeRegex.test(readmeContent)) {
        this.fs.appendTpl(
          this.destinationPath('README.md'),
          '\n' + this.fs.read(this.templatePath('gh-docs/README.md.tpl')),
        );
      } else {
        readmeContent = readmeContent.replace(
          readmeRegex,
          this.fs.read(this.templatePath('gh-docs/README.md.tpl')).trim(),
        );
        this.fs.write(this.destinationPath('README.md'), readmeContent);
      }
    } else {
      this.fs.copyTpl(
        this.templatePath('gh-docs/README.md.tpl'),
        this.destinationPath('README.md'),
        {},
      );
    }
  }
}
