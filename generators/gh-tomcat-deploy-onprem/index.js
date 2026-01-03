'use strict';
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
  PROMPT_GITHUB_PACKAGES,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACTORY_PROJECT,
  PROMPT_ARTIFACTORY_PACKAGE_TYPE,
  PROMPT_PLAYBOOK_PATH,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_USE_ALT_APP_DIR_NAME,
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
