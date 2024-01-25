'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');

module.exports = class extends Generator {
  prompting() {
    this.log(
      yosay(
        'Welcome to the GitHub CI workflow and NR Broker intention file generator!'
      )
    );

    const prompts = [
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        store: true
      },
      {
        type: 'input',
        name: 'serviceName',
        message: 'what is your service name?',
        store: true
      },
      {
        type: 'input',
        name: 'artifactoryProject',
        message: 'what is your Artifactory project?',
        default: "cc20",
        store: true
      },
      {
        type: 'input',
        name: 'pomRoot',
        message: 'what is your Maven pom file root?',
        default: "./",
        store: true
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props = props;
    });
  }

  // Generate GitHub workflow and NR Broker intention files
  writing() {
    this.fs.copyTpl(
      this.templatePath('ci.yaml'),
      this.destinationPath('.github/workflows/ci.yaml'),
      { projectName: this.props.projectName, serviceName: this.props.serviceName, artifactoryProject: this.props.artifactoryProject,
        pomRoot: this.props.pomRoot }
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.json'),
      this.destinationPath('.github/workflows/build-intention.json'),
      { projectName: this.props.projectName, serviceName: this.props.serviceName }
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.sh'),
      this.destinationPath('.github/workflows/build-intention.sh')
    );
    this.fs.copyTpl(
      this.templatePath('deployment-intention.json'),
      this.destinationPath('.jenkins/deployment-intention.json'),
      { projectName: this.props.projectName, serviceName: this.props.serviceName }
    );
  }
};
