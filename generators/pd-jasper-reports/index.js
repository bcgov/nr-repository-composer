'use strict';
import BaseGenerator from '../pd-base-playbook/index.js';
// eslint-disable-next-line no-unused-vars
import chalk from 'chalk';

/**
 * Generate the files needed for Jasper Reports deployments
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.option('jasperProjectName', {
      type: String,
      description: 'Jasper Project Name',
    });
    this.option('jasperServerInstance', {
      type: String,
      description: 'Jasper Server Instance',
    });
    this.option('jasperPauseSeconds', {
      type: String,
      description: 'Pause seconds for Jasper Reports deployment',
    });
    this.option('brokerJwt', {
      type: String,
      description: 'Broker JWT',
    });
  }

  // Generate files
  writing() {
    this.log('Generating files');
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
        jasperServerInstanceUpperCase:
          this.options.jasperServerInstance.toUpperCase(),
        jasperPauseSeconds: this.options.jasperPauseSeconds,
      },
    );
    this.fs.copyTpl(
      this.templatePath('jasper-reports-datasource.yaml'),
      this.destinationPath(
        `${this.options.playbookPath}/jasper-datasource.yaml`,
      ),
      {
        projectNameUpperCase: this.options.jasperProjectName.toUpperCase(),
        jasperServerInstanceUpperCase:
          this.options.jasperServerInstance.toUpperCase(),
      },
    );
  }
}
