import { BaseGenerator } from '../util/base-generator.js';
import {
  destinationGitPath,
  isMonoRepo,
  relativeGitPath,
} from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_CLIENT_ID,
  PROMPT_DEPLOYMENT_CONFIG_PATHS,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_LICENSE,
  PROMPT_OCI_ARTIFACTS,
  PROMPT_PUBLISH_ARTIFACT_SUFFIX,
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  PROMPT_TYPE,
  PROMPT_UNIT_TESTS_PATH,
} from '../util/prompts.js';
import {
  copyCommonBuildWorkflows,
  copyCommonDeploymentConfigWorkflow,
} from '../util/copyworkflows.js';
import { makeWorkflowBuildPublishPath } from '../util/github.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_TYPE,
  PROMPT_LICENSE,
  PROMPT_CLIENT_ID,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_OCI_ARTIFACTS,
  {
    ...PROMPT_PUBLISH_ARTIFACT_SUFFIX,
    when: (answers) => answers.type !== 'library',
  },
  PROMPT_UNIT_TESTS_PATH,
  PROMPT_ARTIFACT_REPOSITORY_TYPE,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  {
    ...PROMPT_DEPLOYMENT_CONFIG_PATHS,
    default: 'charts',
  },
  PROMPT_TOOLS_BUILD_SECRETS,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
];

/**
 * Generate the CI workflow and NR Broker intention files needed for Docker builds in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub Docker Build Generator',
      subtitle:
        'Create workflow and NR Broker intention files for GitHub Docker builds',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-docker-build-gh-docker-build',
        ],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
      ],
    };
    this._questions = questions;
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
        artifactRepositoryType: this.answers.artifactRepositoryType,
        artifactRepositoryPath: this.answers.artifactRepositoryPath,
        brokerJwt,
        gitHubProjectSlug: this.answers.gitHubProjectSlug,
        license: this.answers.license,
        isMonoRepo: isMonoRepo(),
        unitTestsPath: this.answers.unitTestsPath,
        publishArtifactSuffix: this.answers.publishArtifactSuffix,
        toolsBuildSecrets: this.answers.toolsBuildSecrets,
        toolsLocalBuildSecrets: this.answers.toolsLocalBuildSecrets,
        relativePath,
        ociArtifacts,
      },
    );
    copyCommonBuildWorkflows(this, {
      ...this.answers,
      packageArchitecture: 'container',
      packageType: 'application/vnd.oci.image.layer.v1.tar+gzip',
    });

    copyCommonDeploymentConfigWorkflow(brokerJwt, this, this.answers);
  }

  writingBackstage() {
    super.writingBackstage();
  }
}
