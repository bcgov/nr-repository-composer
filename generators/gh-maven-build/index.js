'use strict';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';

/**
 * Generate the CI workflow and NR Broker intention files needed Java/Tomcat Maven builds in GitHub
 */
export default class extends Generator {
  async prompting() {
    this.log(
      yosay(
        'Welcome to the GitHub workflow and NR Broker intention file generator!',
      ),
    );

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
    this.log(
      '  ' +
        chalk.bold('Artifactory: ') +
        chalk.dim('The OCP Artifactory namespace this will be published to'),
    );
    this.log(
      '  ' +
        chalk.bold('Pom root:    ') +
        chalk.dim(
          "The path to where your pom file is located relative to the repository's root",
        ),
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
      {
        type: 'input',
        name: 'artifactoryProject',
        message: 'Artifactory:',
        default: 'cc20',
        store: true,
      },
      {
        type: 'input',
        name: 'pomRoot',
        message: 'Pom root:',
        default: './',
        store: true,
      },
      {
        type: 'input',
        name: 'unitTestsPath',
        message: 'Path to unit tests (./.github/workflows/test.yaml):',
        default: '',
        store: true,
      },
      {
        type: 'confirm',
        name: 'gitHubPackages',
        message: 'Publish to GitHub Packages?',
        default: false,
        store: true,
      },
      {
        type: 'confirm',
        name: 'deployOnPrem',
        message: 'Deploy on-prem?',
        default: false,
        store: true,
      },
    ];

    const props = await this.prompt(prompts);
    this.props = props;
  }

  // Generate GitHub workflows and NR Broker intention files
  writing() {
    this.fs.copyTpl(
      this.templatePath('build.yaml'),
      this.destinationPath('.github/workflows/build.yaml'),
      {
        projectName: this.props.projectName,
        serviceName: this.props.serviceName,
        artifactoryProject: this.props.artifactoryProject,
        pomRoot: this.props.pomRoot,
        unitTestsPath: this.props.unitTestsPath,
        gitHubPackages: this.props.gitHubPackages,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.json'),
      this.destinationPath('.github/workflows/build-intention.json'),
      {
        projectName: this.props.projectName,
        serviceName: this.props.serviceName,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.sh'),
      this.destinationPath('.github/workflows/build-intention.sh'),
    );
    this.fs.copyTpl(
      this.templatePath('release.yaml'),
      this.destinationPath('.github/workflows/release.yaml'),
      {
        projectName: this.props.projectName,
        serviceName: this.props.serviceName,
        pomRoot: this.props.pomRoot,
      },
    );
    if (this.props.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deploy.yaml'),
        this.destinationPath('.github/workflows/deploy.yaml'),
        {
          projectName: this.props.projectName,
          serviceName: this.props.serviceName,
        },
      );
      this.fs.copyTpl(
        this.templatePath('deployment-intention.json'),
        this.destinationPath('.jenkins/deployment-intention.json'),
        {
          projectName: this.props.projectName,
          serviceName: this.props.serviceName,
        },
      );
    }

    this.config.save();
  }
}
