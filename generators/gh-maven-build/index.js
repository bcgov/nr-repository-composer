'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import {
  destinationGitPath,
  isMonoRepo,
  relativeGitPath,
} from '../util/git.js';
import {
  makeWorkflowBuildPublishPath,
  makeWorkflowDeployPath,
} from '../util/github.js';

import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_ADD_WEBADE_CONFIG,
  PROMPT_ALT_APP_DIR_NAME,
  PROMPT_CLIENT_ID,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_CONFIGURE_NR_ARTIFACTORY,
  PROMPT_MAVEN_BUILD_COMMAND,
  PROMPT_POM_ROOT,
  PROMPT_GITHUB_PACKAGES,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACTORY_PROJECT,
  PROMPT_ARTIFACTORY_PACKAGE_TYPE,
  PROMPT_DEPLOY_JASPER_REPORTS,
  PROMPT_JASPER_PAUSE_SECONDS,
  PROMPT_JASPER_PROJECT_NAME,
  PROMPT_JASPER_SERVICE_NAME,
  PROMPT_JASPER_SOURCE_PATH,
  PROMPT_JASPER_ADDITIONAL_DATA_SOURCES,
  PROMPT_JASPER_SERVER_INSTANCE,
  PROMPT_LICENSE,
  PROMPT_PLAYBOOK_PATH,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_USE_ALT_APP_DIR_NAME,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  copyCommonBuildWorkflows,
  copyCommonDeployWorkflows,
  rmIfExists,
} from '../util/copyworkflows.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PACKAGES,
  PROMPT_OCI_ARTIFACTS,
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
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_CONFIGURE_NR_ARTIFACTORY,
  {
    ...PROMPT_MAVEN_BUILD_COMMAND,
    default: (answers) =>
      `--batch-mode -Dmaven.test.skip=true -P${answers.gitHubPackages ? 'github' : 'artifactory'} deploy${answers.configureNrArtifactory ? ` --settings ${relativeGitPath() ? '../'.repeat(relativeGitPath().split('/').length) : ''}.github/polaris-maven-settings.xml ` : ' '}--file ${answers.pomRoot}pom.xml`,
  },
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

    bailOnUnansweredQuestions(questions, this.answers, headless, askAnswered);
    this.answers = await this.prompt(questions, 'config');
  }
  // Generate GitHub workflows and NR Broker intention files
  writingWorkflow() {
    const relativePath = relativeGitPath();
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';
    const ociArtifacts = this.answers.ociArtifacts.trim()
      ? JSON.parse(this.answers.ociArtifacts.trim())
      : [];
    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      destinationGitPath(
        makeWorkflowBuildPublishPath(this.answers.serviceName),
      ),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
        brokerJwt,
        artifactoryProject: this.answers.artifactoryProject,
        pomRoot: this.answers.pomRoot,
        unitTestsPath: this.answers.unitTestsPath,
        gitHubPackages: this.answers.gitHubPackages,
        artifactoryPackageType: this.answers.artifactoryPackageType,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        relativePath,
        isMonoRepo: isMonoRepo(),
        configureNrArtifactory: this.answers.configureNrArtifactory,
        mavenBuildCommand: this.answers.mavenBuildCommand,
        ociArtifacts,
      },
    );
    copyCommonBuildWorkflows(this, {
      ...this.answers,
      packageArchitecture: 'jvm',
      packageType: 'war',
    });
    if (this.answers.deployOnPrem) {
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
    if (this.answers.configureNrArtifactory) {
      const maven_args = [this.answers.projectName, this.answers.serviceName];
      this.composeWith('nr-repository-composer:pd-maven', maven_args);
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

    // Clean up old files if they exist (may remove in future)
    if (!isMonoRepo()) {
      rmIfExists(
        this,
        destinationGitPath('.github/workflows/build-release.yaml'),
      );
    }
    rmIfExists(this, destinationGitPath('.github/workflows/deploy.yaml'));
    rmIfExists(this, destinationGitPath('.github/workflows/run-deploy.yaml'));
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-maven-build');
    this.config.save();
  }
}
