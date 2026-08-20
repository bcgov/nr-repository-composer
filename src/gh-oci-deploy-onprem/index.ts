import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import { destinationGitPath, relativeGitPath } from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_TYPE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
  PROMPT_ARTIFACT_SRC,
  PROMPT_PLAYBOOK_PATH,
  PROMPT_DEPLOY_TYPE,
  PROMPT_JAVA_VERSION,
  PROMPT_TOMCAT_CONTEXT,
  PROMPT_USE_ALT_APP_DIR_NAME,
  PROMPT_ALT_APP_DIR_NAME,
  PROMPT_ADD_LOG4J2_CONFIG,
  PROMPT_ADD_TOMCAT_CONTEXT,
  PROMPT_CREATE_DATA_TMP_DIR,
  PROMPT_ADD_WEBADE_CONFIG,
} from '../util/prompts.js';
import { copyCommonDeployWorkflows } from '../util/copyworkflows.js';
import { makeWorkflowDeployPath } from '../util/github.js';
import { writeOciPlaybookFiles } from '../util/pd-helpers.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_CLIENT_ID,
  PROMPT_POST_DEPLOY_TESTS_PATH,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOY_TYPE,
  PROMPT_TYPE,
  PROMPT_ARTIFACT_SRC,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
  {
    ...PROMPT_JAVA_VERSION,
    when: (answers) => answers.deployType === 'tomcat',
  },
  {
    ...PROMPT_TOMCAT_CONTEXT,
    when: (answers) => answers.deployType === 'tomcat',
  },
  {
    ...PROMPT_USE_ALT_APP_DIR_NAME,
    when: (answers) => answers.deployType === 'tomcat',
  },
  {
    ...PROMPT_ALT_APP_DIR_NAME,
    when: (answers) => answers.useAltAppDirName,
  },
  {
    ...PROMPT_ADD_LOG4J2_CONFIG,
    when: (answers) => answers.deployType === 'tomcat',
  },
  {
    ...PROMPT_ADD_TOMCAT_CONTEXT,
    when: (answers) => answers.deployType === 'tomcat',
  },
  PROMPT_CREATE_DATA_TMP_DIR,
  {
    ...PROMPT_ADD_WEBADE_CONFIG,
    when: (answers) => answers.deployType === 'tomcat',
  },
];

/**
 * Generate the deploy workflow and NR Broker intention files for on-prem OCI artifact deployments in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub OCI On-Prem Deploy Generator',
      subtitle:
        'Create deploy workflow for on-prem OCI artifact deployments (Node.js or Tomcat)',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-oci-on-prem-deploy-gh-oci-deploy-onprem',
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

  _postPrompt() {
    // Abort if type is 'library'
    if (
      this.answers.type &&
      typeof this.answers.type === 'string' &&
      this.answers.type.trim().toLowerCase() === 'library'
    ) {
      this.log(chalk.red.bold('\nERROR: Libraries cannot be deployed\n'));
      process.exit(1);
    }
  }

  async prompting() {
    return super.prompting();
  }

  // Generate GitHub deploy workflow and NR Broker intention files
  writingWorkflow() {
    const deployRoot = relativeGitPath();
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
        artifactSrc: this.answers.artifactSrc,
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        postDeployTestsPath: this.answers.postDeployTestsPath,
        deployRoot,
        deployType: this.answers.deployType,
      },
    );

    copyCommonDeployWorkflows(this, this.answers);

    writeOciPlaybookFiles(this, {
      projectName: this.answers.projectName,
      serviceName: this.answers.serviceName,
      deployType: this.answers.deployType,
      javaVersion: this.answers.javaVersion,
      tomcatContext: this.answers.tomcatContext,
      altAppDirName: this.answers.altAppDirName,
      addLog4j2Config: this.answers.addLog4j2Config,
      addTomcatContext: this.answers.addTomcatContext,
      createDataTmpDir: this.answers.createDataTmpDir,
      addWebadeConfig: this.answers.addWebadeConfig,
    });
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
