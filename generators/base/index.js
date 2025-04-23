'use strict';
import Generator from 'yeoman-generator';
// eslint-disable-next-line no-unused-vars
import yosay from 'yosay';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import * as fs from 'node:fs';

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

    this.config.save();
  }
}
