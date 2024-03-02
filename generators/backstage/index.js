'use strict';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';

/**
 * Generate a basic backstage file
 */
export default class extends Generator {
  async prompting() {
    this.log(yosay('Welcome to the backstage file generator!'));

    this.log(chalk.bold('Usage'));
    this.log('');
    this.log(
      '  ' +
        chalk.bold('Project:     ') +
        chalk.dim(
          'Lowercase kebab-case name that uniquely identifies the project',
        ),
    );
    this.log('               ' + chalk.dim('Example: super-project'));
    this.log(
      '  ' +
        chalk.bold('Service:     ') +
        chalk.dim(
          'Lowercase kebab-case name that uniquely indentifies the service',
        ),
    );
    this.log(
      '               ' +
        chalk.dim(
          'Should start with project, have an optional descriptor and end with an artifact identifier',
        ),
    );
    this.log(
      '               ' + chalk.dim('Example: super-project-backend-war'),
    );
    this.log('');

    this.log(chalk.bold('Prompts'));
    this.log('');

    const prompts = [
      {
        type: 'input',
        name: 'projectName',
        message: 'Project:',
        store: true,
      },
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service:',
        store: true,
      },
    ];

    const props = await this.prompt(prompts);
    this.props = props;
  }

  // Generate GitHub workflows and NR Broker intention files
  writing() {
    this.fs.copyTpl(
      this.templatePath('app-config.yaml'),
      this.destinationPath('app-config.yaml'),
      {
        projectName: this.props.projectName,
        serviceName: this.props.serviceName,
      },
    );

    this.config.save();
  }
}
