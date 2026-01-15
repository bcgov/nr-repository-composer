'use strict';
import path from 'path';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import { destinationGitPath, relativeGitPath } from '../util/git.js';
import { makeWorkflowDeployPath } from '../util/github.js';

import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_ADD_WEBADE_CONFIG,
  PROMPT_ALT_APP_DIR_NAME,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_JAVA_VERSION,
  PROMPT_GITHUB_PACKAGES,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACTORY_PROJECT,
  PROMPT_ARTIFACTORY_PACKAGE_TYPE,
  PROMPT_PLAYBOOK_PATH,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_USE_ALT_APP_DIR_NAME,
  PROMPT_DEPLOY_JASPER_REPORTS,
  PROMPT_JASPER_PAUSE_SECONDS,
  PROMPT_JASPER_PROJECT_NAME,
  PROMPT_JASPER_SERVICE_NAME,
  PROMPT_JASPER_SOURCE_PATH,
  PROMPT_JASPER_ADDITIONAL_DATA_SOURCES,
  PROMPT_JASPER_SERVER_INSTANCE,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { copyCommonDeployWorkflows } from '../util/copyworkflows.js';
import { outputReport } from '../util/report.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_JAVA_VERSION,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PACKAGES,
  {
    ...PROMPT_GITHUB_PROJECT_SLUG,
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
  PROMPT_PLAYBOOK_PATH,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_USE_ALT_APP_DIR_NAME,
  {
    ...PROMPT_ALT_APP_DIR_NAME,
    when: (answers) => answers.useAltAppDirName,
  },
  PROMPT_ADD_WEBADE_CONFIG,
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
    ...PROMPT_JASPER_SOURCE_PATH,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_ADDITIONAL_DATA_SOURCES,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SERVER_INSTANCE,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_PAUSE_SECONDS,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_PLAYBOOK_PATH,
    when: (answers) => answers.deployJasperReports,
  },
];

/**
 * Generate the deploy workflow and NR Broker intention files for on-prem Java/Tomcat Maven deployments in GitHub
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);
    this.option(OPTION_HELP_PROMPTS);
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options['ask-answered'];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = this.config.getAnswers();

    if (!headless) {
      this.log(
        nrsay(
          'NR GitHub Tomcat On-Prem Deploy Generator',
          'Create deploy workflow and NR Broker intention files for on-prem Tomcat deployments',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-tomcat-on-prem-deploy-gh-tomcat-deploy-onprem',
          ],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
          ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
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

    bailOnUnansweredQuestions(questions, this.answers, headless, askAnswered);
    this.answers = await this.prompt(questions, 'config');
  }

  // Generate GitHub deploy workflow and NR Broker intention files
  writingWorkflow() {
    const relativePath = relativeGitPath();
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';

    this.fs.copyTpl(
      this.templatePath('deploy.yaml'),
      destinationGitPath(makeWorkflowDeployPath(this.answers.serviceName)),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        brokerJwt,
        artifactoryProject: this.answers.artifactoryProject,
        pomRoot: this.answers.pomRoot,
        gitHubPackages: this.answers.gitHubPackages,
        artifactoryPackageType: this.answers.artifactoryPackageType,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        relativePath,
        postDeployTestsPath: this.answers.postDeployTestsPath,
      },
    );

    copyCommonDeployWorkflows(this, this.answers);

    this.fs.copyTpl(
      this.templatePath('Dockerfile'),
      destinationGitPath(path.join(relativePath,'.docker/runtime/Dockerfile')),
    );
    
    this.fs.copyTpl(
      this.templatePath('deploy.sh'),
      destinationGitPath(`deploy-${this.answers.serviceName}.sh`),      
      {serviceName: this.answers.serviceName,}, {}, { mode: 0o755 }
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
      javaVersion: this.answers.javaVersion,
    };
    this.composeWith(
      'nr-repository-composer:pd-java-playbook',
      java_playbook_args,
      java_playbook_options,
    );

    if (this.answers.deployJasperReports) {
      const jasper_reports_args = [
        this.answers.projectName,
        this.answers.jasperServiceName,
        this.answers.playbookPath,
      ];
      const jasper_playbook_options = {
        jasperProjectName: this.answers.jasperProjectName,
        jasperServerInstance: this.answers.jasperServerInstance,
        jasperSourcePath: this.answers.jasperSourcePath,
        jasperPauseSeconds: this.answers.jasperPauseSeconds,
        jasperAdditionalDataSources: this.answers.jasperAdditionalDataSources,
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
    this.config.addGeneratorToDoc('gh-tomcat-deploy-onprem');
    this.config.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-tomcat-deploy-onprem', this.answers);
    }
  }
}
