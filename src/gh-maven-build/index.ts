import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';
import {
  destinationGitPath,
  isMonoRepo,
  relativeGitPath,
} from '../util/git.js';
import { makeWorkflowBuildPublishPath } from '../util/github.js';

import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_CLIENT_ID,
  PROMPT_DEPLOY_ON_PREM,
  PROMPT_JAVA_PATTERN,
  PROMPT_JAVA_VERSION,
  PROMPT_LICENSE,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_MAVEN_BUILD_COMMAND,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_POM_ROOT,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  PROMPT_TYPE,
  PROMPT_UNIT_TESTS_PATH,
} from '../util/prompts.js';
import { copyCommonBuildWorkflows, rmIfExists } from '../util/copyworkflows.js';
import { writeJavaMavenFiles } from '../util/pd-helpers.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_TYPE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_JAVA_VERSION,
  PROMPT_JAVA_PATTERN,
  PROMPT_POM_ROOT,
  PROMPT_OCI_ARTIFACTS,
  {
    ...PROMPT_PUBLISH_ARTIFACT_SUFFIX,
    when: (answers) => answers.type !== 'library',
  },
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  {
    ...PROMPT_MAVEN_BUILD_COMMAND,
    default: (answers) =>
      `--batch-mode -Dmaven.test.skip=true -Pgithub clean ${answers.type !== 'library' ? 'package' : 'deploy'}`,
  },
];

/**
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub Maven Build and Publish Generator',
      subtitle:
        'Create workflow and NR Broker intention files for GitHub Maven builds',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-maven-build-gh-maven-build',
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
      removedProps.indexOf(PROMPT_DEPLOY_ON_PREM.name) !== -1;
  }

  async prompting() {
    return super.prompting();
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
        type: this.answers.type,
        brokerJwt,
        artifactoryProject: '',
        artifactRepositoryType: this.answers.artifactRepositoryType,
        artifactRepositoryPath: this.answers.artifactRepositoryPath,
        license: this.answers.license,
        pomRoot: this.answers.pomRoot,
        javaVersion: this.answers.javaVersion,
        javaPattern: this.answers.javaPattern,
        unitTestsPath: this.answers.unitTestsPath,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        relativePath,
        isMonoRepo: isMonoRepo(),
        toolsBuildSecrets: this.answers.toolsBuildSecrets,
        mavenBuildCommand: this.answers.mavenBuildCommand,
        publishArtifactSuffix: this.answers.publishArtifactSuffix,
        toolsLocalBuildSecrets: this.answers.toolsLocalBuildSecrets,
        ociArtifacts,
      },
    );
    copyCommonBuildWorkflows(this, {
      ...this.answers,
      packageArchitecture: 'jvm',
      packageType:
        this.answers.type !== 'library'
          ? 'application/vnd.oci.image.layer.v1.tar+gzip'
          : this.answers.javaPattern === 'Tomcat'
            ? 'war'
            : 'jar',
    });

    writeJavaMavenFiles(this);

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
    super.writingBackstage();
  }

  end() {
    super.end();
    if (this.showGeneratorDeprecationWarning) {
      this.log(
        chalk.yellow.bold('⚠️ Notice:') +
          chalk.yellow(
            ' This generator no longer handles deployments.\n' +
              '   Please use generator ' +
              chalk.cyan('gh-oci-deploy-onprem') +
              ' to update your deployment configuration.\n',
          ),
      );
    }
  }
}
