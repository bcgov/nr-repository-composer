import { Document, isMap, isSeq, parseAllDocuments } from 'yaml';
import * as fs from 'node:fs';
import path from 'path';

import { destinationGitPath } from './git.js';
import { TOOLS_DEFAULT_PROPERTIES } from './constants.js';
import { getInstanceName, parseInstances } from './instances.js';

export const BACKSTAGE_FILENAME = 'catalog-info.yaml';
export const BACKSTAGE_API_VERSION = 'backstage.io/v1alpha1';
export const BACKSTAGE_KIND_COMPONENT = 'Component';
export const BACKSTAGE_KIND_LOCATION = 'Location';
// A catalog file may also carry a `NRComposer` document that holds the
// composer bookkeeping (the set of generators that produced it, plus scan
// overrides). These fields used to live as `composer.io.nrs.gov.bc.ca/*`
// annotations on the Backstage entity itself, which is off-spec for a
// Backstage catalog entity; they have since moved to this dedicated document.
export const BACKSTAGE_KIND_NRCOMPOSER = 'NRComposer';
// Deployed instances of a component. Unlike other kinds, a catalog file may
// hold several Instance documents; values live under `spec.<key>`.
export const BACKSTAGE_KIND_INSTANCE = 'Instance';
export const BACKSTAGE_GENERATOR_INSTANCES = 'backstage-instances';

// Legacy annotation paths, retained only for migration and read-time fallback.
export const BACKSTAGE_GENERATOR_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/generators',
];

export const BACKSTAGE_SKIP_SCAN_PATH = [
  'metadata',
  'annotations',
  'composer.io.nrs.gov.bc.ca/skipAutomatedScan',
];

// Composer bookkeeping lives on the NRComposer document, not on the entity.
// `generators` is a YAML sequence (an array of generator names); the legacy
// form was a single comma-separated annotation string.
export const NRCOMPOSER_GENERATOR_PATH = ['spec', 'generators'];
export const NRCOMPOSER_SKIP_SCAN_PATH = ['spec', 'skipAutomatedScan'];
export const NRCOMPOSER_ANSWERS_PATH = ['spec', 'answers'];

// Legacy storage of deployed instances as a JSON array, retained only so it can
// be migrated into Instance documents.
export const LEGACY_INSTANCES_ANNOTATION_PATH = [
  'metadata',
  'annotations',
  'playbook.io.nrs.gov.bc.ca/instances',
];
// Prompt answers from the former instance prompts on the backstage generator.
const LEGACY_INSTANCE_ANSWER_PATTERN =
  /^(instances|instanceEnvs|instancesCustom|instanceUrl:.*)$/;

interface PathToProp {
  path: string[];
  prop: string;
  writeEmpty: boolean;
  csv?: boolean;
  // eslint-disable-next-line no-unused-vars
  transform?: (val: any) => any;
  // eslint-disable-next-line no-unused-vars
  deprecated?: (config: any, value?: any) => void;
  assumeDefaultValue?: boolean;
}

export const pathToProps: PathToProp[] = [
  { path: ['spec', 'system'], prop: 'projectName', writeEmpty: false },
  { path: ['metadata', 'name'], prop: 'serviceName', writeEmpty: false },
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
  // Deployment Configuration
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/deploymentConfigPaths',
    ],
    prop: 'deploymentConfigPaths',
    writeEmpty: false,
  },
  // Playbook
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployType'],
    prop: 'deployType',
    writeEmpty: true,
  },
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
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/artifactSrc'],
    prop: 'artifactSrc',
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
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/deployType'],
    prop: 'deployType',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/autoDeployEphemeral',
    ],
    prop: 'autoDeployEphemeral',
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
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/addLog4j2Config',
    ],
    prop: 'addLog4j2Config',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/addTomcatContext',
    ],
    prop: 'addTomcatContext',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/createDataTmpDir',
    ],
    prop: 'createDataTmpDir',
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
      'playbook.io.nrs.gov.bc.ca/intentionUser',
    ],
    prop: 'intentionUser',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/syncSecretEnabled',
    ],
    prop: 'syncSecretEnabled',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/syncVaultPaths',
    ],
    prop: 'syncVaultPaths',
    writeEmpty: false,
    csv: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/syncSecretNames',
    ],
    prop: 'syncSecretNames',
    writeEmpty: false,
    csv: true,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/knoxProvisionCronSchedule',
    ],
    prop: 'ocpKnoxCronSchedule',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/knoxProvisionSourceSecretName',
    ],
    prop: 'ocpKnoxSourceSecretName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/knoxProvisionTargetSecretName',
    ],
    prop: 'ocpKnoxTargetSecretName',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/knoxProvisionSyncSchedule',
    ],
    prop: 'ocpKnoxSyncSchedule',
    writeEmpty: false,
  },
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/knoxProvisionSyncSourceSecretName',
    ],
    prop: 'ocpKnoxSyncSourceSecretName',
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
  {
    path: [
      'metadata',
      'annotations',
      'playbook.io.nrs.gov.bc.ca/publishBaseDirectory',
    ],
    prop: 'publishBaseDirectory',
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
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/playbookPath'],
    prop: 'playbookPath',
    writeEmpty: false,
    deprecated: (config, value) => {
      config.set('deploymentConfigPaths', value);
    },
  },
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
      config.set('toolsBuildSecrets', TOOLS_DEFAULT_PROPERTIES);
      config.set('toolsLocalBuildSecrets', TOOLS_DEFAULT_PROPERTIES);
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
        config.addGeneratorToDoc('gh-oci-deploy-onprem');
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
  {
    path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/customRunner'],
    prop: 'customRunner',
    writeEmpty: true,
    assumeDefaultValue: true,
  },
];

export const propRecord: Record<string, PathToProp> = pathToProps.reduce(
  (acc, pathToProp) => {
    acc[pathToProp.prop] = pathToProp;
    return acc;
  },
  {} as Record<string, PathToProp>,
);

export function extractFromYaml(
  doc: Document,
  pathToProps: PathToProp[],
): Record<string, unknown> {
  const answers = {};

  if (doc) {
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      if (doc.hasIn(path)) {
        answers[pathToProp.prop] = doc.getIn(path);
      }
    }
  }

  return answers;
}

/**
 * Coerce a stored generator value (a YAML sequence, a comma-separated string,
 * or a single string) into a de-duplicated list of generator names.
 */
function toGeneratorList(value: unknown): string[] {
  const toArray = (v: unknown): string[] => {
    // ParsedNode (ArrayNode) exposes toJSON() -> string[]
    if (
      v &&
      typeof v === 'object' &&
      typeof (v as { toJSON?: unknown }).toJSON === 'function'
    ) {
      const json = (v as { toJSON: () => unknown }).toJSON();
      return toArray(json);
    }
    if (Array.isArray(v)) {
      return v.flatMap((item) => toArray(item));
    }
    if (typeof v === 'string') {
      return v
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (v === undefined || v === null || v === '') {
      return [];
    }
    return [String(v)];
  };
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of toArray(value)) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

/**
 * Read the recorded generators from a composer (NRComposer) document, reading
 * the new `spec.generators` sequence first and falling back to the legacy
 * `composer.io.nrs.gov.bc.ca/generators` annotation string.
 *
 * @param doc A NRComposer document (or, for read-only fallback, any document).
 */
export function getGeneratorsFromDoc(doc: Document | undefined): string[] {
  if (!doc) {
    return [];
  }
  const modern = doc.getIn(NRCOMPOSER_GENERATOR_PATH);
  if (modern !== undefined) {
    const list = toGeneratorList(modern);
    if (list.length > 0) {
      return list;
    }
  }
  return toGeneratorList(doc.getIn(BACKSTAGE_GENERATOR_PATH));
}

/**
 * Add a generator to a composer (NRComposer) document's `spec.generators`
 * sequence, de-duplicating. The new storage form is a YAML array; a legacy
 * comma-separated annotation (if present) is normalised into the array.
 *
 * @param doc A NRComposer document.
 */
export function addGeneratorToDoc(doc: Document, generator: string) {
  const existing = toGeneratorList(doc.getIn(NRCOMPOSER_GENERATOR_PATH));
  const legacy = toGeneratorList(doc.getIn(BACKSTAGE_GENERATOR_PATH));
  const combined = Array.from(new Set([...legacy, ...existing]));
  if (!combined.includes(generator)) {
    combined.push(generator);
  }
  doc.setIn(NRCOMPOSER_GENERATOR_PATH, combined);
  // Drop the legacy annotation now that the sequence is authoritative.
  if (doc.hasIn(BACKSTAGE_GENERATOR_PATH)) {
    doc.deleteIn(BACKSTAGE_GENERATOR_PATH);
  }
}

export function hasGeneratorInDoc(
  doc: Document | undefined,
  generator: string,
): boolean {
  return getGeneratorsFromDoc(doc).includes(generator);
}

/**
 * Migrate the legacy `composer.io.nrs.gov.bc.ca/*` annotations off a Backstage
 * entity document and onto a dedicated NRComposer document. The migration is
 * idempotent: it only moves a field when the NRComposer document does not yet
 * carry it, and it removes the legacy annotation from the entity so the catalog
 * stays off-spec-free after a single pass.
 *
 * @param composerDoc The NRComposer document that receives the composer data.
 * @param entityDoc The entity (Component/Location) document to migrate away from.
 * @returns `true` if any field was migrated.
 */
export function migrateComposerAnnotations(
  composerDoc: Document,
  entityDoc: Document,
): boolean {
  let migrated = false;

  // generators: csv string -> YAML sequence.
  if (entityDoc.hasIn(BACKSTAGE_GENERATOR_PATH)) {
    const legacy = toGeneratorList(entityDoc.getIn(BACKSTAGE_GENERATOR_PATH));
    if (!composerDoc.hasIn(NRCOMPOSER_GENERATOR_PATH)) {
      composerDoc.setIn(NRCOMPOSER_GENERATOR_PATH, legacy);
    } else if (legacy.length > 0) {
      // Union any extra names from the legacy annotation with the sequence.
      const merged = toGeneratorList(
        composerDoc.getIn(NRCOMPOSER_GENERATOR_PATH),
      );
      for (const name of legacy) {
        if (!merged.includes(name)) {
          merged.push(name);
        }
      }
      composerDoc.setIn(NRCOMPOSER_GENERATOR_PATH, merged);
    }
    entityDoc.deleteIn(BACKSTAGE_GENERATOR_PATH);
    migrated = true;
  }

  // skipAutomatedScan: boolean flag.
  if (entityDoc.hasIn(BACKSTAGE_SKIP_SCAN_PATH)) {
    if (!composerDoc.hasIn(NRCOMPOSER_SKIP_SCAN_PATH)) {
      composerDoc.setIn(
        NRCOMPOSER_SKIP_SCAN_PATH,
        entityDoc.getIn(BACKSTAGE_SKIP_SCAN_PATH),
      );
    }
    entityDoc.deleteIn(BACKSTAGE_SKIP_SCAN_PATH);
    migrated = true;
  }

  dropEmptyAnnotations(entityDoc);

  return migrated;
}

/** Drop a now-empty annotations map so the entity document stays clean. */
function dropEmptyAnnotations(entityDoc: Document) {
  const annotations = entityDoc.getIn(['metadata', 'annotations']);
  if (isMap(annotations) && annotations.items.length === 0) {
    entityDoc.deleteIn(['metadata', 'annotations']);
  }
}

/** Whether a prop path is a composer-owned `*nrs.gov.bc.ca/*` annotation. */
export function isNrsAnnotationPath(path: string[]): boolean {
  return (
    path[0] === 'metadata' &&
    path[1] === 'annotations' &&
    path[2]?.includes('nrs.gov.bc.ca/') === true
  );
}

/**
 * Whether a prompt's value is written directly to the entity document. Such
 * values are read back from the document; only the remaining values (e.g.
 * those used for templating) are kept in the NRComposer answers.
 */
export function isDocumentProp(pathToProp: PathToProp): boolean {
  return !isNrsAnnotationPath(pathToProp.path);
}

/**
 * Remove NRComposer answers duplicating a value an entity document holds.
 *
 * @returns `true` if any answer was removed.
 */
export function dropDocumentAnswers(
  composerDoc: Document,
  entityDocs: Document[],
): boolean {
  let dropped = false;
  for (const pathToProp of pathToProps.filter(isDocumentProp)) {
    const answerPath = [...NRCOMPOSER_ANSWERS_PATH, pathToProp.prop];
    if (
      composerDoc.hasIn(answerPath) &&
      entityDocs.some((doc) => doc.hasIn(pathToProp.path))
    ) {
      composerDoc.deleteIn(answerPath);
      dropped = true;
    }
  }
  const answers = composerDoc.getIn(NRCOMPOSER_ANSWERS_PATH);
  if (dropped && isMap(answers) && answers.items.length === 0) {
    composerDoc.deleteIn(NRCOMPOSER_ANSWERS_PATH);
  }
  return dropped;
}

/**
 * Move prompt answers stored as legacy `*nrs.gov.bc.ca/*` annotations on an
 * entity into the NRComposer document's `spec.answers`. Existing answers win.
 *
 * @param composerDoc The NRComposer document that receives the answers.
 * @param entityDoc The entity (Component/Location) document to migrate away from.
 * @returns `true` if any answer was migrated.
 */
export function migrateAnswerAnnotations(
  composerDoc: Document,
  entityDoc: Document,
): boolean {
  let migrated = false;
  for (const pathToProp of pathToProps) {
    if (
      !isNrsAnnotationPath(pathToProp.path) ||
      !entityDoc.hasIn(pathToProp.path)
    ) {
      continue;
    }
    const answerPath = [...NRCOMPOSER_ANSWERS_PATH, pathToProp.prop];
    if (!composerDoc.hasIn(answerPath)) {
      composerDoc.setIn(answerPath, entityDoc.getIn(pathToProp.path));
    }
    entityDoc.deleteIn(pathToProp.path);
    migrated = true;
  }
  dropEmptyAnnotations(entityDoc);
  return migrated;
}

/**
 * Create a NRComposer document. It only carries `apiVersion`, `kind` and
 * `spec`; a catalog file has exactly one, shared by all of its entities.
 */
export function newNrcomposerDoc(): Document {
  const doc = new Document();
  doc.setIn(['apiVersion'], BACKSTAGE_API_VERSION);
  doc.setIn(['kind'], BACKSTAGE_KIND_NRCOMPOSER);
  return doc;
}

/**
 * Whether a NRComposer document carries any composer bookkeeping. Documents
 * without any are not worth writing out.
 */
export function hasNrcomposerContent(doc: Document): boolean {
  return [
    NRCOMPOSER_GENERATOR_PATH,
    NRCOMPOSER_SKIP_SCAN_PATH,
    NRCOMPOSER_ANSWERS_PATH,
  ].some((path) => doc.getIn(path) !== undefined);
}

/** An entity document paired with the NRComposer document carrying its bookkeeping. */
export interface CatalogEntity {
  doc: Document;
  composerDoc: Document;
}

/** Whether a document is an entity that is paired with a NRComposer document. */
function isPairedEntity(doc: Document): boolean {
  const kind = doc.get('kind');
  return (
    !!doc.contents &&
    kind !== BACKSTAGE_KIND_NRCOMPOSER &&
    kind !== BACKSTAGE_KIND_INSTANCE
  );
}

/** Create an Instance document for a component. */
export function newInstanceDoc(): Document {
  const doc = new Document();
  doc.setIn(['apiVersion'], BACKSTAGE_API_VERSION);
  doc.setIn(['kind'], BACKSTAGE_KIND_INSTANCE);
  return doc;
}

/**
 * Name an Instance document `<service>-<instance name>`, where the instance
 * name defaults to its environment.
 */
export function updateInstanceName(doc: Document, serviceName: string) {
  const env = doc.getIn(['spec', 'env']);
  if (typeof env !== 'string' || !env) {
    return;
  }
  const name = doc.getIn(['spec', 'name']);
  const instanceName = getInstanceName({
    env,
    name: typeof name === 'string' ? name : undefined,
  });
  doc.setIn(['metadata', 'name'], `${serviceName}-${instanceName}`);
}

/**
 * Convert instances stored as a JSON array (legacy annotation or NRComposer
 * answer) into Instance documents inserted after `afterDoc`. Leftover answers
 * from the former instance prompts are removed. Existing Instance documents
 * win: the stored array is only converted when the file has none.
 */
function migrateInstances(
  docs: Document[],
  { doc: entity, composerDoc }: CatalogEntity,
) {
  const legacy =
    composerDoc.getIn([...NRCOMPOSER_ANSWERS_PATH, 'instances']) ??
    entity.getIn(LEGACY_INSTANCES_ANNOTATION_PATH);
  if (entity.hasIn(LEGACY_INSTANCES_ANNOTATION_PATH)) {
    entity.deleteIn(LEGACY_INSTANCES_ANNOTATION_PATH);
    dropEmptyAnnotations(entity);
  }

  const answers = composerDoc.getIn(NRCOMPOSER_ANSWERS_PATH);
  if (isMap(answers)) {
    for (const key of Object.keys(answers.toJSON())) {
      if (LEGACY_INSTANCE_ANSWER_PATTERN.test(key)) {
        answers.delete(key);
      }
    }
    if (answers.items.length === 0) {
      composerDoc.deleteIn(NRCOMPOSER_ANSWERS_PATH);
    }
  }

  const instances = parseInstances(
    typeof legacy === 'string' ? legacy : isSeq(legacy) ? legacy.toJSON() : [],
  );
  const hasInstanceDocs = docs.some(
    (doc) => doc.get('kind') === BACKSTAGE_KIND_INSTANCE,
  );
  if (instances.length > 0 && !hasInstanceDocs) {
    const serviceName = String(entity.getIn(['metadata', 'name']) ?? 'unknown');
    const instanceDocs = instances.map((instance) => {
      const doc = newInstanceDoc();
      doc.setIn(['spec', 'env'], instance.env);
      if (instance.name) {
        doc.setIn(['spec', 'name'], instance.name);
      }
      if (instance.url) {
        doc.setIn(['spec', 'url'], instance.url);
      }
      updateInstanceName(doc, serviceName);
      return doc;
    });
    docs.splice(docs.indexOf(composerDoc) + 1, 0, ...instanceDocs);
    addGeneratorToDoc(composerDoc, BACKSTAGE_GENERATOR_INSTANCES);
  }
}

/**
 * Pair every entity document in a catalog with the file's single NRComposer
 * document and migrate legacy annotations onto it, so later reads only need
 * to look at the pair. A NRComposer is created directly after the first
 * entity when the file has none. Instance documents are not paired; legacy
 * stored instances are converted into Instance documents.
 *
 * @param docs Every document parsed from the catalog file (mutated in place).
 * @returns The entities in file order, each with the shared NRComposer.
 * @throws When the catalog holds more than one NRComposer document.
 */
export function pairCatalogDocs(docs: Document[]): CatalogEntity[] {
  const populated = docs.filter((doc) => doc.contents);
  const entities = populated.filter(isPairedEntity);
  const composers = populated.filter(
    (doc) => doc.get('kind') === BACKSTAGE_KIND_NRCOMPOSER,
  );
  if (composers.length > 1) {
    throw new Error(
      `Catalog has ${composers.length} "${BACKSTAGE_KIND_NRCOMPOSER}" documents; only one is supported.`,
    );
  }
  if (entities.length === 0) {
    return [];
  }

  let composerDoc = composers[0];
  if (!composerDoc) {
    composerDoc = newNrcomposerDoc();
    docs.splice(docs.indexOf(entities[0]) + 1, 0, composerDoc);
  }
  const pairs = entities.map((entity) => {
    migrateComposerAnnotations(composerDoc, entity);
    migrateAnswerAnnotations(composerDoc, entity);
    const pair = { doc: entity, composerDoc };
    migrateInstances(docs, pair);
    return pair;
  });
  dropDocumentAnswers(composerDoc, entities);
  return pairs;
}

/**
 * Parse a (possibly multi-document) catalog file and pair each entity with its
 * NRComposer document. See {@link pairCatalogDocs}.
 */
export function parseCatalog(content: string): {
  docs: Document[];
  entities: CatalogEntity[];
} {
  const docs: Document[] = [...parseAllDocuments(content)];
  return { docs, entities: pairCatalogDocs(docs) };
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
 */
export function generateSetAnswerPropPredicate(
  answers: Record<string, unknown>,
  keepAnswered: boolean,
) {
  return (val) => {
    return !(val.name in answers) || keepAnswered;
  };
}

export function scanRepositoryForComponents(
  rootCatalogPath = BACKSTAGE_FILENAME,
  includeLocations = false,
) {
  const initCatalogPath = destinationGitPath(rootCatalogPath);
  const gitRoot = destinationGitPath('.');
  const components: (CatalogEntity & {
    path: string;
    name: string;
    parentPath?: string;
  })[] = [];

  const loadCatalog = (catalogPath, parentPath?: string) => {
    let entities: CatalogEntity[];
    try {
      const content = fs.readFileSync(catalogPath, 'utf8');
      entities = parseCatalog(content).entities;
    } catch (err) {
      console.error(
        `Error loading catalog at ${catalogPath}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return;
    }

    for (const { doc, composerDoc } of entities) {
      const kind = doc.get('kind');
      const relativePath = path.relative(gitRoot, catalogPath);

      if (
        kind === BACKSTAGE_KIND_COMPONENT ||
        (includeLocations && kind === BACKSTAGE_KIND_LOCATION)
      ) {
        const name = String(doc.getIn(['metadata', 'name']) || 'unknown');
        components.push({
          doc,
          composerDoc,
          path: relativePath,
          name,
          parentPath,
        });
      }

      if (kind === BACKSTAGE_KIND_LOCATION) {
        const targets = doc.getIn(['spec', 'targets']);
        // Handle both plain arrays and YAML sequence nodes
        const targetArray = Array.isArray(targets)
          ? targets
          : isSeq(targets)
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
            loadCatalog(resolvedPath, relativePath);
          }
        }
      }
    }
  };

  loadCatalog(initCatalogPath);

  return components;
}
