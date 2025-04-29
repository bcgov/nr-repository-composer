'use strict';
import BaseGenerator from '../base/index.js';
// eslint-disable-next-line no-unused-vars
import yosay from 'yosay';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import * as fs from 'node:fs';

/**
 * Generate Ansible playbook and variable files
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.option('tomcatContext', {
      type: String,
      description: 'Tomcat Context',
    });
    this.option('altAppDirName', {
      type: String,
      description: 'Alternative webapp directory name',
    });
    this.option('addWebadeConfig', {
      type: String,
      description: 'Add Webade configuration',
    });
  }

  // Generate Ansible playbook and variable files
  writing() {
    this.log('Generating playbook files');
    const playbook_args = [
      this.options.projectName,
      this.options.serviceName,
      this.options.playbookPath,
    ];
    const playbook_options = {};
    this.composeWith(
      'nr-repository-composer:base',
      playbook_args,
      playbook_options,
    );
    this.fs.copyTpl(
      this.templatePath('playbook.yaml'),
      this.destinationPath(`${this.options.playbookPath}/playbook.yaml`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        addWebadeConfig: this.options.addWebadeConfig,
      },
    );
    this.fs.copyTpl(
      this.templatePath('vars/standard/**'),
      this.destinationPath(`${this.options.playbookPath}/vars/standard`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        projectNameUpperCase: this.options.projectName.toUpperCase(),
        tomcatContext: this.options.tomcatContext,
        altAppDirName: this.options.altAppDirName,
        addWebadeConfig: this.options.addWebadeConfig,
      },
    );

    this.config.save();
  }
}
