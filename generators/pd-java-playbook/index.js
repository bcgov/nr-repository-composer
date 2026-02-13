'use strict';
import path from 'path';
import * as fs from 'node:fs';
import Generator from 'yeoman-generator';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import { updateReadmeWithPipelineGuide } from '../util/copyworkflows.js';

/**
 * Generate Ansible playbook and variable files
 */
export default class extends Generator {
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
    this.option('javaVersion', {
      type: String,
      description: 'Java version',
    });
  }

  // Generate Ansible playbook and variable files
  writing() {
    this.log('Generating playbook files');

    // Initialize playbook variable files (copy vars/custom if they don't exist)
    const varsCustomPath = this.templatePath('./vars/custom');
    if (fs.existsSync(varsCustomPath)) {
      const varsFiles = fs.readdirSync(varsCustomPath);
      for (const file of varsFiles) {
        const destPath = this.destinationPath(
          `${this.options.playbookPath}/vars/custom/${file}`,
        );
        if (!fs.existsSync(destPath)) {
          this.fs.copyTpl(path.join(varsCustomPath, file), destPath, {});
        }
      }
    }

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
        javaVersion: this.options.javaVersion,
      },
    );

    // Update README with Polaris Pipeline guide
    updateReadmeWithPipelineGuide(this);
  }
}
