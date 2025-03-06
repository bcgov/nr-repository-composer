'use strict';
import Generator from 'yeoman-generator';
// eslint-disable-next-line no-unused-vars
import yosay from 'yosay';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';
import * as fs from 'node:fs';

/**
 * Generate the files needed for Jasper Reports deployments
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
    this.argument('jasperProjectName', {
      type: String,
      required: true,
      description: 'Jasper Project Name',
    });
    this.argument('jasperServerInstance', {
      type: String,
      required: true,
      description: 'Jasper Server Instance',
    });
    this.argument('brokerJwt', {
      type: String,
      required: true,
      description: 'Broker JWT',
    });
    this.argument('playbookPath', {
      type: String,
      required: true,
      description: 'Playbook Path',
    });
  }

  // Generate files
  writing() {
    this.log('Generating files');
    this.fs.copyTpl(
      this.templatePath('jasper-reports-workflow.yaml'),
      this.destinationPath('.github/workflows/jasper-reports.yaml'),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        brokerJwt: this.options.brokerJwt,
      },
    );
    this.fs.copyTpl(
      this.templatePath('jasper-reports-intention.json'),
      this.destinationPath('.jenkins/jasper-reports-intention.json'),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
      },
    );
    this.fs.copyTpl(
      this.templatePath('jasper-reports-playbook.yaml'),
      this.destinationPath(`${this.options.playbookPath}/jasper-reports.yaml`),
      {
        projectNameUpperCase: this.options.jasperProjectName.toUpperCase(),
        jasperServerInstanceUpperCase: this.options.jasperServerInstance.toUpperCase(),
      },
    );
    this.config.save();
  }
}
