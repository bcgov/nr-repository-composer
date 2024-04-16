'use strict';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';
import path from 'path';

/**
 * Generate the CI workflow and NR Broker intention files needed Java/Tomcat Maven builds in GitHub
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
      this.templatePath('vars/**'),
      this.destinationPath(`${this.options.playbookPath}/vars`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        projectNameUpperCase: this.options.projectName.toUpperCase(),
      },
    );
    this.config.save();
  }
}
