import chalk from 'chalk';
import { extractGitHubSlug, getGitRepoOriginUrl } from '../util/git.js';
import { alphaDashValidate } from '../util/github.js';

export const PROMPT_LOCATION_NAME = {
  type: 'input',
  name: 'locationName',
  message: 'Name:',
  default: 'components',
};

export const PROMPT_LOCATION_TARGETS = {
  type: 'input',
  name: 'locationTargets',
  message: 'Targets (comma-separated list of paths):',
  default: '',
};

export const PROMPT_PROJECT = {
  type: 'input',
  name: 'projectName',
  message: 'Project:',
  validate: alphaDashValidate,
};

export const PROMPT_SERVICE = {
  type: 'input',
  name: 'serviceName',
  message: 'Service:',
  validate: alphaDashValidate,
};

export const PROMPT_DESCRIPTION = {
  type: 'input',
  name: 'description',
  message: 'Description:',
};

export const PROMPT_TITLE = {
  type: 'input',
  name: 'title',
  message: 'Title:',
};

export const PROMPT_TYPE = {
  type: 'input',
  name: 'type',
  message: 'Type (service, website, library):',
};

export const PROMPT_LIFECYCLE = {
  type: 'input',
  name: 'lifecycle',
  message: 'Lifecycle (experimental, production, deprecated):',
  default: 'production',
};

export const PROMPT_LICENSE = {
  type: 'input',
  name: 'license',
  default: 'Apache-2.0',
  message: 'License (SPDX):',
};
export const PROMPT_OWNER = {
  type: 'input',
  name: 'owner',
  message: 'Owner:',
};

export const PROMPT_TAGS = {
  type: 'input',
  name: 'tags',
  message: 'Tags (comma-separated, e.g., java, api, frontend):',
  default: '',
};

export const PROMPT_GITHUB_PROJECT_SLUG = {
  type: 'input',
  name: 'gitHubProjectSlug',
  message: 'GitHub Slug (<organization or owner>/<repository>):',
  default: extractGitHubSlug(getGitRepoOriginUrl()) ?? '',
};

export const PROMPT_CLIENT_ID = {
  type: 'input',
  name: 'clientId',
  message: 'Client ID:',
  default: '',
};

export const PROMPT_UNIT_TESTS_PATH = {
  type: 'input',
  name: 'unitTestsPath',
  message: 'Path to unit tests (./.github/workflows/test.yaml):',
  default: '',
};

export const PROMPT_POST_DEPLOY_TESTS_PATH = {
  type: 'input',
  name: 'postDeployTestsPath',
  message: 'Path to post deploy tests (./.github/workflows/postDeploy.yaml):',
  default: '',
};

export const PROMPT_PUBLISH_ARTIFACT_SUFFIX = {
  type: 'input',
  name: 'publishArtifactSuffix',
  message: 'Published files/folders (required: dist):',
  default: 'dist',
};

export const PROMPT_DEPLOY_ON_PREM = {
  type: 'confirm',
  name: 'deployOnPrem',
  message: 'Deploy on-prem (deprecated):',
  default: false,
};

export const PROMPT_SCHEMA_NAME = {
  type: 'input',
  name: 'schemaName',
  message: 'Schema(s):',
};

export const PROMPT_SCHEMA_MIGRATION_TOOL = {
  type: 'input',
  name: 'schemaMigrationTool',
  default: 'flyway',
  message: 'Tool (manual, flyway, liquibase):',
};

export const PROMPT_SCHEMA_MIGRATION_TYPE = {
  type: 'input',
  name: 'schemaMigrationType',
  default: '',
  message: 'Type (oracle, mongodb, postgressql, etc.):',
};

export const PROMPT_SCHEMA_MIGRATION_BASE_PATH = {
  type: 'input',
  name: 'schemaMigrationBasePath',
  default: '',
  message: 'Base path:',
};

export const PROMPT_PLAYBOOK_PATH = {
  type: 'input',
  name: 'playbookPath',
  message: 'Playbook path:',
  default: 'playbooks',
};
export const PROMPT_OCI_ARTIFACTS = {
  type: 'input',
  name: 'ociArtifacts',
  message:
    'OCI static assets [{"artifact":"ghcr.io/bcgov-c/servicename:${PROJECT_TAG}","output": "./static"}]:',
  default: '',
  validate: (input) => {
    if (!input.trim()) {
      return true;
    }
    try {
      const parsed = JSON.parse(input);
      if (!Array.isArray(parsed)) {
        return 'OCI Artifacts must be a JSON array';
      }
      for (const item of parsed) {
        if (
          typeof item.artifact !== 'string' ||
          typeof item.output !== 'string'
        ) {
          return 'Each OCI Artifact must have "artifact" and "output" string properties';
        }
      }
      return true;
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return 'Invalid JSON format for OCI Artifacts';
    }
  },
};
export const PROMPT_POM_ROOT = {
  type: 'input',
  name: 'pomRoot',
  message: 'Path to pom.xml (relative to service catalog root):',
  default: './',
};
export const PROMPT_NODE_PATTERN = {
  type: 'list',
  name: 'nodePattern',
  message: 'Node pattern:',
  choices: ['NPM', 'unknown'],
  default: 'NPM',
};
export const PROMPT_NODE_VERSION = {
  type: 'list',
  name: 'nodeVersion',
  message: 'Node.js version:',
  choices: ['20', '22', '24'],
  default: '24',
};
export const PROMPT_JAVA_PATTERN = {
  type: 'list',
  name: 'javaPattern',
  message: 'Java pattern:',
  choices: ['SpringBoot', 'Tomcat', 'unknown'],
  default: 'SpringBoot',
};
export const PROMPT_JAVA_VERSION = {
  type: 'list',
  name: 'javaVersion',
  message: 'Java version:',
  choices: ['8', '11', '17', '21'],
  default: '8',
};
export const PROMPT_ARTIFACT_REPOSITORY_TYPE = {
  type: 'list',
  name: 'artifactRepositoryType',
  message: 'Artifact destination repository type:',
  choices: ['GitHubPackages', 'JFrogArtifactory'],
  default: 'GitHubPackages',
};
export const PROMPT_ARTIFACT_REPOSITORY_PATH = {
  type: 'input',
  name: 'artifactRepositoryPath',
  message: 'Artifact destination repository path:',
  default: (answers) => {
    switch (answers.artifactRepositoryType) {
      case 'JFrogArtifactory':
        return 'https://artifacts.developer.gov.bc.ca/artifactory/cc20-gen-maven-local';
      case 'GitHubPackages':
        return `https://maven.pkg.github.com/${answers.gitHubProjectSlug}`;
      default:
        return '';
    }
  },
};
export const PROMPT_TOOLS_BUILD_SECRETS = {
  type: 'input',
  name: 'toolsBuildSecrets',
  message: 'Tools secrets used with builds (comma-separated):',
  default: 'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
};
export const PROMPT_TOOLS_LOCAL_BUILD_SECRETS = {
  type: 'input',
  name: 'toolsLocalBuildSecrets',
  message: 'Local tools secrets used with builds (comma-separated):',
  default: (answers) => answers.toolsBuildSecrets ?? '',
};
export const PROMPT_MAVEN_BUILD_COMMAND = {
  type: 'input',
  name: 'mavenBuildCommand',
  message: 'Maven build arguments:',
};
export const PROMPT_DEPLOY_JASPER_REPORTS = {
  type: 'confirm',
  name: 'deployJasperReports',
  message: 'Deploy Jasper Reports:',
  default: false,
};
export const PROMPT_JASPER_PROJECT_NAME = {
  type: 'input',
  name: 'jasperProjectName',
  message: 'Jasper Project Name:',
};
export const PROMPT_JASPER_SERVICE_NAME = {
  type: 'input',
  name: 'jasperServiceName',
  message: 'Jasper Service Name:',
};
export const PROMPT_JASPER_SOURCE_PATH = {
  type: 'input',
  name: 'jasperSourcePath',
  message: 'Jasper source path:',
  default: '{{ playbook_dir }}/../src',
};
export const PROMPT_JASPER_SERVER_INSTANCE = {
  type: 'input',
  name: 'jasperServerInstance',
  message: 'Jasper Reports server instance:',
  default: 'JCRS',
};
export const PROMPT_JASPER_ADDITIONAL_DATA_SOURCES = {
  type: 'input',
  name: 'jasperAdditionalDataSources',
  message: 'Additional Jasper Reports data sources:',
  default: '',
};
export const PROMPT_JASPER_PAUSE_SECONDS = {
  type: 'input',
  name: 'jasperPauseSeconds',
  message: 'Pause seconds for Jasper Reports deployment:',
  default: 30,
};
export const PROMPT_TOMCAT_CONTEXT = {
  type: 'input',
  name: 'tomcatContext',
  message: 'Tomcat Context (e.g. ext#results):',
};
export const PROMPT_USE_ALT_APP_DIR_NAME = {
  type: 'confirm',
  name: 'useAltAppDirName',
  message: 'Use alternative webapp directory:',
  default: false,
};
export const PROMPT_ALT_APP_DIR_NAME = {
  type: 'input',
  name: 'altAppDirName',
  message: 'Alternative webapp directory name:',
  default: '',
};
export const PROMPT_ADD_WEBADE_CONFIG = {
  type: 'confirm',
  name: 'addWebadeConfig',
  message: 'Add Webade configuration:',
  default: false,
};

export const PROMPT_TO_USAGE = {
  locationName: {
    description:
      'The name of the location file. This is used to group services together in the Backstage catalog.',
    example: 'components',
  },
  locationTargets: {
    description:
      'A comma-separated list of paths that this location file points to.',
    example:
      'src/services/catalog-info.yaml,src/website/catalog-info.yaml,src/libraries/catalog-info.yaml',
  },
  projectName: {
    description:
      'Lowercase kebab-case name that uniquely identifies the project',
    example: 'my-awesome-project',
  },
  serviceName: {
    description:
      'Lowercase kebab-case name that uniquely indentifies the service. Should start with project, have an optional descriptor and end with an artifact identifier.',
    example: 'super-project-backend-war',
  },
  description: {
    description: 'A short description of the service',
  },
  title: {
    description: 'A short human readable title for the service',
  },
  type: {
    description: 'The type of service (e.g. service, website, library)',
  },
  lifecycle: {
    description:
      'The lifecycle of the service (e.g. experimental, production, deprecated)',
  },
  license: {
    description: 'The license of the service (e.g. Apache-2.0)',
  },
  owner: {
    description: 'The owner of the service (e.g. bcgov)',
  },
  ociArtifacts: {
    description: 'A JSON array of OCI artifact references to include in build',
    example:
      '[{"artifact": "ghcr.io/bcgov-c/servicename:${PROJECT_TAG}", "output": "./static"}]',
  },
  tags: {
    description:
      'Comma-separated list of tags for categorizing and searching components',
    example: 'java, api, backend, microservice',
  },
  gitHubProjectSlug: {
    description:
      'The GitHub slug of the service. If not provided, will be auto-detected from the git remote URL',
    example: 'bcgov-c/edqa-war',
  },
  clientId: {
    description:
      'The client ID of the Broker account to use. Leave blank to use manually set BROKER_JWT secret.',
  },
  unitTestsPath: {
    description:
      'The path to the unit tests (e.g. .github/workflows/test.yaml)',
  },
  nodeVersion: {
    description:
      'The Node.js version to use for building and deploying the Node.js project. This will be used in the GitHub Actions workflow.',
    example: '24',
  },
  postDeployTestsPath: {
    description:
      'The path to the post deploy tests (e.g. .github/workflows/postDeploy.yaml)',
  },
  schemaName: {
    description:
      'Comma-separated list of schema name(s) to use (e.g. my_schema)',
  },
  schemaMigrationTool: {
    description:
      'The tool to use for schema migrations (e.g. manual, flyway, liquibase). If a supported tool is choosen, additional guidelines provided',
  },
  schemaMigrationType: {
    description:
      'The type of schema migration to use (e.g. oracle, mongodb, postgressql, etc.)',
  },
  schemaMigrationBasePath: {
    description: 'The base path for the schema migrations',
  },
  publishArtifactSuffix: {
    description:
      'A space separated list with the first used as the overall checksum.',
    example: 'dist node_modules package.json package-lock.json',
  },
  javaPattern: {
    description:
      'The development pattern used for the service. If not unknown, this will be used to provide development and deployment workflows.',
    example: 'SpringBoot',
  },
  javaVersion: {
    description:
      'The Java version to use for building and deploying the Maven project. This will be used in the GitHub Actions workflow.',
    example: '11',
  },
  deployOnPrem: {
    description: 'Whether to deploy on-prem or not',
  },
  playbookPath: {
    description:
      'The path to the playbook (e.g. ./playbooks/). If not provided, will be auto-detected from the git remote URL',
  },
  pomRoot: {
    description: 'The path to the pom.xml file',
    example: './',
  },
  artifactRepositoryType: {
    description: 'The artifact destination repository type',
    example: 'GitHubPackages',
  },
  artifactRepositoryPath: {
    description: 'The artifact destination repository path',
  },
  mavenBuildCommand: {
    description: 'Arguments to pass to mvn',
    example: '--batch-mode -Dmaven.test.skip=true -Pgithub clean deploy',
  },
  toolsBuildSecrets: {
    description: 'Tools secrets used with builds (comma-separated)',
    example: 'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
  },
  toolsLocalBuildSecrets: {
    description: 'Local tools secrets used with builds (comma-separated)',
    example: 'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
  },
  deployJasperReports: {
    description: 'Whether to deploy Jasper Reports or not',
  },
  jasperProjectName: {
    description: 'The Jasper project name to use (e.g. jasper-project)',
  },
  jasperServiceName: {
    description:
      'The Jasper service name to use (e.g. jasper-project-backend-war)',
  },
  jasperSourcePath: {
    description:
      'The relative path to the jasper source (e.g. {{ playbook_dir }}/../src)',
  },
  jasperServerInstance: {
    description: 'The Jasper server instance to use (e.g. JCRS, JRS, etc.)',
  },
  jasperAdditionalDataSources: {
    description: '(Optional) Additional data sources for Jasper',
  },
  jasperPauseSeconds: {
    description:
      'The number of seconds to pause before requesting import status',
  },
  tomcatContext: {
    description: 'The Tomcat context to use (e.g. ext#results).',
    example: 'ext#results',
  },
  useAltAppDirName: {
    description: 'Whether to use an alternative webapp directory name or not',
  },
  altAppDirName: {
    description:
      'The alternative webapp directory name to use (e.g. jasper-project)',
  },
  addWebadeConfig: {
    description: 'Whether to add Webade configuration or not',
  },
};

export function getPromptToUsage(question) {
  const usage = PROMPT_TO_USAGE[question.name];
  return (
    `${chalk.bold(question.message)} (key: ${question.name})
    Description: ${usage?.description ?? 'unknown'}` +
    (usage?.example ? `\n    Example: ${usage?.example}` : '') +
    '\n'
  );
}
