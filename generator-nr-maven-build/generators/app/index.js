'use strict';
import Generator from "yeoman-generator";
import yosay from "yosay";

export default class extends Generator {
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
        message: 'What is your service name?',
        store: true
      },
      {
        type: 'input',
        name: 'artifactoryProject',
        message: 'What is your Artifactory project?',
        default: "cc20",
        store: true
      },
      {
        type: 'input',
        name: 'pomRoot',
        message: 'What is your Maven pom file root?',
        default: "./",
        store: true
      },
      {
        type: 'confirm',
        name: 'gitHubPackages',
        message: 'Publish to GitHub Packages?',
        default: false,
        store: true
      },
      {
        type: 'confirm',
        name: 'deployOnPrem',
        message: 'Will you be deploying to on-premise servers?',
        default: false,
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
        pomRoot: this.props.pomRoot, gitHubPackages: this.props.gitHubPackages, deployOnPrem: this.props.deployOnPrem }
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
    if (this.props.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deployment-intention.json'),
        this.destinationPath('.jenkins/deployment-intention.json'),
        { projectName: this.props.projectName, serviceName: this.props.serviceName }
      );
    }

    this.config.save();
  }
}
