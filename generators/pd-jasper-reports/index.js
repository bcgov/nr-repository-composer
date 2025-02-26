'use strict';
import Generator from 'yeoman-generator';
// eslint-disable-next-line no-unused-vars
import yosay from 'yosay';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import * as fs from 'node:fs';

/**
 * Generate the Ansible playbook needed for Jasper Reports deployments
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('projectName', {
      type: String,
      required: true,
      description: 'Project Name',
    });
    this.argument('jasperServerInstance', {
      type: String,
      required: true,
      description: 'Jasper Server Instance',
    });
    this.argument('playbookPath', {
      type: String,
      required: true,
      description: 'Playbook Path',
    });
  }

  // Generate playbook file
  writing() {
    this.log('Generating playbook file');
    if (
      !fs.existsSync(
        this.destinationPath(`${this.options.playbookPath}/jasper-reports.yaml`),
      )
    ) {
      this.fs.copyTpl(
        this.templatePath('jasper-reports.yaml'),
        this.destinationPath(`${this.options.playbookPath}/jasper-reports.yaml`),
        {
          projectNameUpperCase: this.options.projectName.toUpperCase(),
          jasperServerInstanceUpperCase: this.options.jasperServerInstance.toUpperCase(),
        },
      );
    }

    this.config.save();
  }
}
