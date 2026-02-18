import { destinationGitPath } from './git.js';
import { parseDocument } from 'yaml';
import * as fs from 'node:fs';
import path from 'path';

export const BACKSTAGE_FILENAME = 'catalog-info.yaml';
export const BACKSTAGE_API_VERSION = 'backstage.io/v1alpha1';
export const BACKSTAGE_KIND_COMPONENT = 'Component';
export const BACKSTAGE_KIND_LOCATION = 'Location';

export const BACKSTAGE_GENERATOR_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/generators',
];

export const pathToProps = [
  { path: ['spec', 'system'], prop: 'projectName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'serviceName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'locationName', writeEmpty: false },
  { path: ['metadata', 'description'], prop: 'description', writeEmpty: true },
  { path: ['metadata', 'title'], prop: 'title', writeEmpty: false },
  {
    path: ['spec', 'targets'],
    prop: 'locationTargets',
    writeEmpty: true,
    csv: true,
  },
  { path: ['spec', 'type'], prop: 'type', writeEmpty: false },
  { path: ['spec', 'lifecycle'], prop: 'lifecycle', writeEmpty: false },
  { path: ['spec', 'owner'], prop: 'owner', writeEmpty: true },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/ociArtifacts'],
    prop: 'ociArtifacts',
    writeEmpty: true,
  },
  {
    path: ['metadata', 'tags'],
    prop: 'tags',
    writeEmpty: false,
    csv: true,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/pomRoot'],
    prop: 'pomRoot',
    writeEmpty: false,
  },
  // License
  {
    path: ['metadata', 'annotations', 'license'],
    prop: 'license',
    writeEmpty: false,
  },
  // Github
  {
    path: ['metadata', 'annotations', 'github.com/project-slug'],
    prop: 'gitHubProjectSlug',
    writeEmpty: false,
  },
  // Playbook
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/unitTestsPath',
    ],
    prop: 'unitTestsPath',
    writeEmpty: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/postDeployTestsPath',
    ],
    prop: 'postDeployTestsPath',
    writeEmpty: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactRepositoryType',
    ],
    prop: 'artifactRepositoryType',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactRepositoryPath',
    ],
    prop: 'artifactRepositoryPath',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/toolsBuildSecrets',
    ],
    prop: 'toolsBuildSecrets',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/toolsLocalBuildSecrets',
    ],
    prop: 'toolsLocalBuildSecrets',
    writeEmpty: false,
  },
  // Maven
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/mavenBuildCommand',
    ],
    prop: 'mavenBuildCommand',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/mavenBuildProfiles',
    ],
    prop: 'mavenBuildProfiles',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/nodePattern'],
    prop: 'nodePattern',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/nodeVersion'],
    prop: 'nodeVersion',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/javaPattern'],
    prop: 'javaPattern',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/javaVersion'],
    prop: 'javaVersion',
    writeEmpty: false,
  },
  // Jasper
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/deployJasperReports',
    ],
    prop: 'deployJasperReports',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperProjectName',
    ],
    prop: 'jasperProjectName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperServiceName',
    ],
    prop: 'jasperServiceName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperSourcePath',
    ],
    prop: 'jasperSourcePath',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperServerInstance',
    ],
    prop: 'jasperServerInstance',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperAdditionalDataSources',
    ],
    prop: 'jasperAdditionalDataSources',
    writeEmpty: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/jasperPauseSeconds',
    ],
    prop: 'jasperPauseSeconds',
    writeEmpty: false,
    transform: (val) => (val === '' || val === undefined ? val : Number(val)),
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/playbookPath'],
    prop: 'playbookPath',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/tomcatContext',
    ],
    prop: 'tomcatContext',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/useAltAppDirName',
    ],
    prop: 'useAltAppDirName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/altAppDirName',
    ],
    prop: 'altAppDirName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/addWebadeConfig',
    ],
    prop: 'addWebadeConfig',
    writeEmpty: false,
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/clientId'],
    prop: 'clientId',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/publishArtifactSuffix',
    ],
    prop: 'publishArtifactSuffix',
    writeEmpty: true,
  },
  // Migrations
  {
    path: ['metadata', 'annotations', 'migration.io.nrs.gov.bc.ca/schemaName'],
    prop: 'schemaName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationTool',
    ],
    prop: 'schemaMigrationTool',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationType',
    ],
    prop: 'schemaMigrationType',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'migration.io.nrs.gov.bc.ca/schemaMigrationBasePath',
    ],
    prop: 'schemaMigrationBasePath',
    writeEmpty: true,
  },
  // Deprecated - Remove in future
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryPackageType',
    ],
    prop: 'artifactoryPackageType',
    writeEmpty: false,
    deprecated: () => {},
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/artifactoryProject',
    ],
    prop: 'artifactoryProject',
    writeEmpty: false,
    deprecated: () => {},
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/configureNrArtifactory',
    ],
    prop: 'configureNrArtifactory',
    writeEmpty: false,
    deprecated: (config) => {
      config.set(
        'toolsBuildSecrets',
        'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
      );
      config.set(
        'toolsLocalBuildSecrets',
        'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
      );
      // Build command will need updating
      config.delete('mavenBuildCommand');
    },
  },
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployOnPrem'],
    prop: 'deployOnPrem',
    writeEmpty: false,
    deprecated: (config) => {
      if (config.hasGenerator('gh-maven-build')) {
        config.addGeneratorToDoc('gh-tomcat-deploy-onprem');
      }
      if (config.hasGenerator('gh-nodejs-build')) {
        config.addGeneratorToDoc('gh-oci-deploy-onprem');
      }
    },
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/gitHubPackages',
    ],
    prop: 'gitHubPackages',
    writeEmpty: false,
    deprecated: (config, value) => {
      config.set(
        'artifactRepositoryType',
        value ? 'GitHubPackages' : 'JFrogArtifactory',
      );
    },
  },
];

export const propRecord = pathToProps.reduce((acc, pathToProp) => {
  acc[pathToProp.prop] = pathToProp;
  return acc;
}, {});

export function extractFromYaml(doc, pathToProps) {
  const answers = {};

  if (doc) {
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      if (doc.hasIn(path) && !!pathToProp.deprecated) {
        answers[pathToProp.prop] = doc.getIn(path);
      }
    }
  }

  return answers;
}

export function addGeneratorToDoc(doc, generator) {
  if (doc.hasIn(BACKSTAGE_GENERATOR_PATH)) {
    const generators = doc.getIn(BACKSTAGE_GENERATOR_PATH).split(',');
    // console.log(generators);
    // console.log(generators.indexOf(generator));
    if (generators.indexOf(generator) === -1) {
      generators.push(generator);
      doc.setIn(BACKSTAGE_GENERATOR_PATH, generators.join(','));
    }
  } else {
    doc.setIn(BACKSTAGE_GENERATOR_PATH, generator);
  }
}

export function hasGeneratorInDoc(doc, generator) {
  if (doc.hasIn(BACKSTAGE_GENERATOR_PATH)) {
    const generators = doc.getIn(BACKSTAGE_GENERATOR_PATH).split(',');
    return generators.indexOf(generator) !== -1;
  }
  return false;
}

/**
 * Create a predicate that determines whether a value with a given name should be considered
 * for setting an "answer" property based on an existing answers map and a flag.
 *
 * The returned predicate accepts an object expected to have a `name` property and returns:
 * - true if the name is not present in the `answers` object, or
 * - true if `keepAnswered` is true (allowing already-answered names), otherwise false.
 *
 * @param {Object} answers - Map/object of existing answers (keys are answer names).
 * @param {boolean} keepAnswered - If true, do not filter out values whose names already exist in `answers`.
 * @returns {(val: { name: string }) => boolean} Predicate that returns whether the provided value should be kept.
 */
export function generateSetAnswerPropPredicate(answers, keepAnswered) {
  return (val) => {
    return !(val.name in answers) || keepAnswered;
  };
}

export function scanRepositoryForComponents(
  rootCatalogPath = BACKSTAGE_FILENAME,
) {
  const initCatalogPath = destinationGitPath(rootCatalogPath);
  const gitRoot = destinationGitPath('.');
  const components = [];

  const loadCatalog = (catalogPath) => {
    let doc;
    try {
      const content = fs.readFileSync(catalogPath, 'utf8');
      doc = parseDocument(content);
      if (doc.get('kind') === BACKSTAGE_KIND_COMPONENT) {
        const name = doc.getIn(['metadata', 'name']) || 'unknown';
        const relativePath = path.relative(gitRoot, catalogPath);
        components.push({ doc, path: relativePath, name });
      } else if (doc.get('kind') === BACKSTAGE_KIND_LOCATION) {
        const targets = doc.getIn(['spec', 'targets']);
        // Handle both plain arrays and YAML sequence nodes
        const targetArray = Array.isArray(targets)
          ? targets
          : targets && targets.toJSON
            ? targets.toJSON()
            : null;
        if (targetArray && Array.isArray(targetArray)) {
          for (const target of targetArray) {
            const targetPath = target.startsWith('/')
              ? target.substring(1) // Remove leading slash
              : target;
            const resolvedPath = path.resolve(
              path.dirname(catalogPath),
              targetPath,
            );
            loadCatalog(resolvedPath);
          }
        }
      }
    } catch (err) {
      console.error(`Error loading catalog at ${catalogPath}: ${err.message}`);
    }
  };

  loadCatalog(initCatalogPath);

  return components;
}
