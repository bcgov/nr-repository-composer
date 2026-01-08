'use strict';
import BaseGenerator from '../pd-base-playbook/index.js';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';

/**
 * Generate Ansible playbook and variable files for OCI artifact deployments
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.option('deployType', {
      type: String,
      description: 'Deployment type (nodejs or tomcat)',
      default: 'nodejs',
    });
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

    const deployType = this.options.deployType || 'nodejs';
    const templateFile =
      deployType === 'tomcat' ? 'playbook-tomcat.yaml' : 'playbook-nodejs.yaml';

    this.fs.copyTpl(
      this.templatePath(templateFile),
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
        deployType: deployType,
        shutdownScript: this.options.shutdownScript || '',
      },
    );
  }
}
