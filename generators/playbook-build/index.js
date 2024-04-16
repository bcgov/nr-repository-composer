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
      //default: 'edqa',
      description: 'Project Name',
    });
    this.argument('servceName', {
      type: String,
      required: true,
      // default: 'edqa-war',
      description: 'Service Name',
    });
    this.argument('playbookPath', {
      type: String,
      required: true,
      //default: 'playbooks/',
      description: 'Playbook Path',
    });
  }

  // Generate GitHub workflows and NR Broker intention files
  writing() {
    this.log('writing - playbook files');
    this.fs.copyTpl(
      this.templatePath('playbook.yaml'),
      this.destinationPath('playbooks/playbook.yaml'),
      {
        projectName: 'edqa',
        serviceName: 'edqa-war',
      },
    );
    /*
    this.fs.copy(
      this.templatePath('templates/vars/**'),
      this.destinationPath('playbooks/vars'),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        projectCapName: this.options.projectName.toUpperCase(),
      },
    );
    */
    this.config.save();
  }
}
