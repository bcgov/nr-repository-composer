'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { Document, parseDocument } from 'yaml';
import { nrsay } from '../util/nrsay.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnAnyQuestions } from '../util/process.js';

import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_POM_ROOT,
  PROMPT_GITHUB_PACKAGES,
  PROMPT_GITHUB_OWNER_PACK,
  PROMPT_ARTIFACTORY_PROJECT,
  PROMPT_ARTIFACTORY_PACKAGE_TYPE,
  PROMPT_DEPLOY_JASPER_REPORTS,
  PROMPT_JASPER_PROJECT_NAME,
  PROMPT_JASPER_SERVICE_NAME,
  PROMPT_JASPER_SERVER_INSTANCE,
  PROMPT_PLAYBOOK_PATH_DEPLOY,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_USE_ALT_APP_DIR_NAME,
  PROMPT_ALT_APP_DIR_NAME,
  PROMPT_ADD_WEBADE_CONFIG,
  getPromptToUsage,
} from '../util/prompts.js';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  addGeneratorToDoc,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
} from '../util/yaml.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_GITHUB_PACKAGES,
  {
    ...PROMPT_GITHUB_OWNER_PACK,
    when: (answers) => answers.gitHubPackages,
  },
  {
    ...PROMPT_ARTIFACTORY_PROJECT,
    when: (answers) => !answers.gitHubPackages,
  },
  {
    ...PROMPT_ARTIFACTORY_PACKAGE_TYPE,
    when: (answers) => !answers.gitHubPackages,
  },
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_DEPLOY_JASPER_REPORTS,
  {
    ...PROMPT_JASPER_PROJECT_NAME,
    default: (answers) => answers.projectName,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SERVICE_NAME,
    default: (answers) => `${answers.projectName}-jasper-reports`,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SERVER_INSTANCE,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_PLAYBOOK_PATH_DEPLOY,
    when: (answers) => answers.deployOnPrem || answers.deployJasperReports,
  },
  {
    ...PROMPT_TOMCAT_CONTEXT,
    when: (answers) => answers.deployOnPrem,
  },
  {
    ...PROMPT_USE_ALT_APP_DIR_NAME,
    when: (answers) => answers.deployOnPrem,
  },
  {
    ...PROMPT_ALT_APP_DIR_NAME,
    when: (answers) => answers.useAltAppDirName,
  },
  {
    ...PROMPT_ADD_WEBADE_CONFIG,
    when: (answers) => answers.deployOnPrem,
  },
];

/**
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);
    this.option(OPTION_HELP_PROMPTS);
  }

  async initializing() {
    const backstagePath = this.destinationPath(BACKSTAGE_FILENAME);
    if (fs.existsSync(backstagePath)) {
      const backstageYaml = fs.readFileSync(backstagePath, 'utf8');
      this.backstageDoc = parseDocument(backstageYaml);
    } else {
      this.backstageDoc = new Document();
    }
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options['ask-answered'];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = extractFromYaml(this.backstageDoc, pathToProps);

    if (!headless) {
      this.log(
        nrsay(
          'NR GitHub Maven Build and Deploy Generator',
          'Create workflow and NR Broker intention files for GitHub Maven builds',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-maven-build-gh-maven-build',
          ],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
          ['Documentation', 'https://github.com/bcgov-nr/polaris-pipelines'],
        ),
      );
    }

    if (helpPrompts) {
      this.log(chalk.bold('Prompts\n'));
      for (const question of questions) {
        this.log(getPromptToUsage(question));
      }
      this.log(
        `${chalk.bold.underline('                                       ')}\n`,
      );
    }

    this.answers = {
      ...this.answers,
      ...(await this.prompt(
        questions
          .filter(
            generateSetAnswerPropPredicate(
              this.answers,
              !headless && askAnswered,
            ),
          )
          .map((question) => {
            if (this.answers[question?.name]) {
              question.default = this.answers[question.name];
            }
            return question;
          })
          .map(bailOnAnyQuestions(headless)),
      )),
    };
  }
  // Generate GitHub workflows and NR Broker intention files
  writingWorkflow() {
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      this.destinationPath('.github/workflows/build-release.yaml'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        brokerJwt,
        artifactoryProject: this.answers.artifactoryProject,
        pomRoot: this.answers.pomRoot,
        unitTestsPath: this.answers.unitTestsPath,
        gitHubPackages: this.answers.gitHubPackages,
        artifactoryPackageType: this.answers.artifactoryPackageType,
        gitHubOwnerPack: this.answers.gitHubOwnerPack,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.json'),
      this.destinationPath('.github/workflows/build-intention.json'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        license: this.answers.license,
      },
    );
    this.fs.copyTpl(
      this.templatePath('build-intention.sh'),
      this.destinationPath('.github/workflows/build-intention.sh'),
    );
    this.fs.copyTpl(
      this.templatePath('check-token.yaml'),
      this.destinationPath('.github/workflows/check-token.yaml'),
    );
    if (this.answers.deployOnPrem) {
      this.fs.copyTpl(
        this.templatePath('deploy.yaml'),
        this.destinationPath('.github/workflows/deploy.yaml'),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
          brokerJwt,
          artifactoryProject: this.answers.artifactoryProject,
          pomRoot: this.answers.pomRoot,
          gitHubPackages: this.answers.gitHubPackages,
          artifactoryPackageType: this.answers.artifactoryPackageType,
          gitHubOwnerPack: this.answers.gitHubOwnerPack,
        },
      );
      this.fs.copyTpl(
        this.templatePath('deployment-intention.json'),
        this.destinationPath('.jenkins/deployment-intention.json'),
        {
          projectName: this.answers.projectName,
          serviceName: this.answers.serviceName,
        },
      );
      const java_playbook_args = [
        this.answers.projectName,
        this.answers.serviceName,
        this.answers.playbookPath,
      ];
      const java_playbook_options = {
        tomcatContext: this.answers.tomcatContext,
        addWebadeConfig: this.answers.addWebadeConfig,
        altAppDirName: this.answers.altAppDirName,
      };
      this.composeWith(
        'nr-repository-composer:pd-java-playbook',
        java_playbook_args,
        java_playbook_options,
      );
    }
    if (this.answers.deployJasperReports) {
      const jasper_reports_args = [
        this.answers.projectName,
        this.answers.jasperServiceName,
        this.answers.playbookPath,
      ];
      const jasper_playbook_options = {
        jasperProjectName: this.answers.jasperProjectName,
        jasperServerInstance: this.answers.jasperServerInstance,
        brokerJwt: brokerJwt,
      };
      this.composeWith(
        'nr-repository-composer:pd-jasper-reports',
        jasper_reports_args,
        jasper_playbook_options,
      );
    }
  }

  writingBackstage() {
    writePropToPath(this.backstageDoc, pathToProps, this.answers);
    addGeneratorToDoc(this.backstageDoc, 'gh-maven-build');
    this.fs.write(
      this.destinationPath(BACKSTAGE_FILENAME),
      this.backstageDoc.toString(),
    );
  }
}
