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
import { makeWorkflowBuildPublishPath } from '../util/github.js';

import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_CONFIGURE_NR_ARTIFACTORY,
  PROMPT_MAVEN_BUILD_COMMAND,
  PROMPT_POM_ROOT,
  PROMPT_JAVA_VERSION,
  PROMPT_GITHUB_PACKAGES,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACTORY_PROJECT,
  PROMPT_ARTIFACTORY_PACKAGE_TYPE,
  PROMPT_LICENSE,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { copyCommonBuildWorkflows, rmIfExists } from '../util/copyworkflows.js';
import { outputReport } from '../util/report.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_JAVA_VERSION,
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
  PROMPT_CONFIGURE_NR_ARTIFACTORY,
  {
    ...PROMPT_MAVEN_BUILD_COMMAND,
    default: (answers) =>
      `--batch-mode -Dmaven.test.skip=true -P${answers.gitHubPackages ? 'github' : 'artifactory'} deploy${answers.configureNrArtifactory ? ` --settings ${relativeGitPath() ? '../'.repeat(relativeGitPath().split('/').length) : ''}.github/polaris-maven-settings.xml ` : ' '}--file ${answers.pomRoot}pom.xml`,
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
          'NR GitHub Maven Build and Publish Generator',
          'Create workflow and NR Broker intention files for GitHub Maven builds',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-maven-build-gh-maven-build',
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
    if (this.answers.deployOnPrem) {
      this.config.delete('deployOnPrem');
      this.config.addGeneratorToDoc('gh-tomcat-deploy-onprem');
      this.config.save();
      this.showGeneratorDeprecationWarning = true;
    }
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
        javaVersion: this.answers.javaVersion,
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
    if (this.answers.configureNrArtifactory) {
      const maven_args = [this.answers.projectName, this.answers.serviceName];
      this.composeWith('nr-repository-composer:pd-maven', maven_args);
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

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-maven-build', this.answers);
      if (this.showGeneratorDeprecationWarning) {
        this.log(
          chalk.yellow.bold('⚠️ Notice:') +
            chalk.yellow(
              ' This generator no longer handles deployments.\n' +
                '   Please use generator ' +
                chalk.cyan('gh-tomcat-deploy-onprem') +
                ' to update your deployment configuration.\n',
            ),
        );
      }
    }
  }
}
