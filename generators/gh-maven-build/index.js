'use strict';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import chalk from 'chalk';

/**
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
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
    this.log(
      '  ' +
        chalk.bold('GitHub Owner with repo path:    ') +
        chalk.dim('The Github owner with repo path (e.g. bcgov-nr/edqa-war) '),
    );
    this.log('');

    this.log(chalk.bold('Prompts'));
    this.log('');

    const answers = await this.prompt([
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
        message: 'Publish to GitHub Packages:',
        default: false,
        store: true,
      },
      {
        type: 'input',
        name: 'gitHubOwnerPack',
        message: 'GitHub Owner with repo path (e.g. bcgov-nr/results-war):',
        store: true,
        when: (answers) => answers.gitHubPackages,
      },
      {
        type: 'input',
        name: 'artifactoryProject',
        message: 'Artifactory:',
        default: 'cc20',
        store: true,
        when: (answers) => !answers.gitHubPackages,
      },
      {
        type: 'input',
        name: 'artifactoryPackageType',
        message: 'Artifactory Package Type (maven, ivy, npm):',
        default: 'maven',
        store: true,
        when: (answers) => !answers.gitHubPackages,
      },
      {
        type: 'confirm',
        name: 'deployOnPrem',
        message: 'Deploy on-prem:',
        default: false,
        store: true,
      },
      {
        type: 'input',
        name: 'playbookPath',
        message: 'Playbook path:',
        default: 'playbooks',
        store: true,
        when: (answers) => answers.deployOnPrem,
      },
      {
        type: 'input',
        name: 'tomcatContext',
        message: 'Tomcat Context (e.g. ext#results):',
        store: true,
        when: (answers) => answers.deployOnPrem,
      },
      {
        type: 'confirm',
        name: 'useAltAppDirName',
        message: 'Use alternative webapp directory:',
        default: false,
        store: true,
        when: (answers) => answers.deployOnPrem,
      },
      {
        type: 'input',
        name: 'altAppDirName',
        message: 'Alternative webapp directory name:',
        store: true,
        when: (answers) => answers.useAltAppDirName,
      },
      {
        type: 'confirm',
        name: 'addWebadeConfig',
        message: 'Add Webade configuration:',
        default: false,
        store: true,
        when: (answers) => answers.deployOnPrem,
      }
    ]);

    this.props = answers;
  }

  // Generate GitHub workflows and NR Broker intention files
  writing() {
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      this.destinationPath('.github/workflows/build-release.yaml'),
      {
        projectName: this.props.projectName,
        serviceName: this.props.serviceName,
        artifactoryProject: this.props.artifactoryProject,
        pomRoot: this.props.pomRoot,
        unitTestsPath: this.props.unitTestsPath,
        gitHubPackages: this.props.gitHubPackages,
        artifactoryPackageType: this.props.artifactoryPackageType,
        gitHubOwnerPack: this.props.gitHubOwnerPack,
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
    if (this.props.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deploy.yaml'),
        this.destinationPath('.github/workflows/deploy.yaml'),
        {
          projectName: this.props.projectName,
          serviceName: this.props.serviceName,
          artifactoryProject: this.props.artifactoryProject,
          pomRoot: this.props.pomRoot,
          gitHubPackages: this.props.gitHubPackages,
          artifactoryPackageType: this.props.artifactoryPackageType,
          gitHubOwnerPack: this.props.gitHubOwnerPack,
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
      const playbook_args = [this.props.projectName, this.props.serviceName, this.props.playbookPath,
        this.props.tomcatContext, this.props.altAppDirName
      ]
      const playbook_options = { addWebadeConfig: this.props.addWebadeConfig, altAppDirName: this.props.altAppDirName }
      this.composeWith('nr-repository-composer:pd-ansible-playbook', playbook_args, playbook_options)
    }

    this.config.save();
  }
}
