'use strict';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';
import path from 'path';
import * as fs from 'node:fs';

/**
 * Generate the Ansible playbook and variable files needed for Tomcat webapp deployments
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
      required: true,
      description: 'Playbook Path',
    });
    this.argument('tomcatContext', {
      type: String,
      required: true,
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

  // Generate GitHub workflows and NR Broker intention files
  writing() {
    this.log('Generating playbook files');
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
        tomcatContext: this.options.tomcatContext,
        altAppDirName: this.options.altAppDirName,
        addWebadeConfig: this.options.addWebadeConfig,
      },
    );
    // Initialize empty files that can be used for custom variables
    // Skip copying templates if any custom files already exist
    if (!fs.existsSync(this.destinationPath(`${this.options.playbookPath}/vars/custom`))) {
      this.fs.copyTpl(
        this.templatePath('vars/custom/**'),
        this.destinationPath(`${this.options.playbookPath}/vars/custom`),
        {},
      );
    }

    this.config.save();
  }
}
