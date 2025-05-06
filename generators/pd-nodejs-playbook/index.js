'use strict';
import BaseGenerator from '../pd-base-playbook/index.js';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';

/**
 * Generate Ansible playbook and variable files
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
  }

  writing() {
    this.log('Generating playbook files');

    const playbook_args = [
      this.options.projectName,
      this.options.serviceName,
      this.options.playbookPath,
    ];
    const playbook_options = {};
    this.composeWith(
      'nr-repository-composer:pd-base-playbook',
      playbook_args,
      playbook_options,
    );
    this.fs.copyTpl(
      this.templatePath('playbook.yaml'),
      this.destinationPath(`${this.options.playbookPath}/playbook.yaml`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
      },
    );
    this.fs.copyTpl(
      this.templatePath('vars/standard/**'),
      this.destinationPath(`${this.options.playbookPath}/vars/standard`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        projectNameUpperCase: this.options.projectName.toUpperCase(),
      },
    );

    this.config.save();
  }
}
