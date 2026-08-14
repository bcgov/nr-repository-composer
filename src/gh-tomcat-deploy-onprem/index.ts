import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
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
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
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
} from '../util/prompts.js';
import { copyCommonDeployWorkflows } from '../util/copyworkflows.js';
import {
  writeJavaPlaybookFiles,
  writeJasperReportsFiles,
} from '../util/pd-helpers.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POM_ROOT,
  PROMPT_JAVA_VERSION,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
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
];

/**
 * Generate the deploy workflow and NR Broker intention files for on-prem Java/Tomcat Maven deployments in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub Tomcat On-Prem Deploy Generator',
      subtitle:
        'Create deploy workflow and NR Broker intention files for on-prem Tomcat deployments',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-tomcat-on-prem-deploy-gh-tomcat-deploy-onprem',
        ],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
      ],
    };
    this._questions = questions;
  }

  _prePrompt() {
    const removedProps = this.backstageConfig.processDeprecated();
    this.showGeneratorDeprecationWarning =
      removedProps.indexOf(PROMPT_PLAYBOOK_PATH.name) !== -1;
  }

  async prompting() {
    return super.prompting();
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
        pomRoot: this.answers.pomRoot,
        artifactRepositoryPath: this.answers.artifactRepositoryPath,
        artifactRepositoryType: this.answers.artifactRepositoryType,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        relativePath,
        postDeployTestsPath: this.answers.postDeployTestsPath,
      },
    );

    copyCommonDeployWorkflows(this, this.answers);

    writeJavaPlaybookFiles(this, {
      projectName: this.answers.projectName,
      serviceName: this.answers.serviceName,
      tomcatContext: this.answers.tomcatContext,
      addWebadeConfig: this.answers.addWebadeConfig,
      altAppDirName: this.answers.altAppDirName,
      javaVersion: this.answers.javaVersion,
    });

    if (this.answers.deployJasperReports) {
      writeJasperReportsFiles(this, {
        projectName: this.answers.projectName,
        serviceName: this.answers.jasperServiceName,
        jasperProjectName: this.answers.jasperProjectName,
        jasperServerInstance: this.answers.jasperServerInstance,
        jasperSourcePath: this.answers.jasperSourcePath,
        jasperPauseSeconds: this.answers.jasperPauseSeconds,
        jasperAdditionalDataSources: this.answers.jasperAdditionalDataSources,
        brokerJwt: brokerJwt,
      });
    }
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
    if (this.showGeneratorDeprecationWarning) {
      this.log(
        chalk.yellow.bold('⚠️ Notice:') +
          chalk.yellow(
            ' This generator no longer handles playbook path configuration.\n' +
              '   Playbook path is now automatically determined.\n',
          ),
      );
    }
  }
}
