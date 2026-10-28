import { parseDocument, Document } from 'yaml';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_API_VERSION,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_API,
  BACKSTAGE_KIND_INSTANCE,
  BACKSTAGE_KIND_LOCATION,
  BACKSTAGE_KIND_NRCOMPOSER,
  BACKSTAGE_GENERATOR_PATH,
  NRCOMPOSER_SKIP_SCAN_PATH,
  pathToProps,
  propRecord,
  extractFromYaml,
  addGeneratorToDoc,
  hasGeneratorInDoc,
  getGeneratorsFromDoc,
  migrateComposerAnnotations,
  pairCatalogDocs,
  parseCatalog,
  generateSetAnswerPropPredicate,
} from './yaml.js';

describe('yaml constants', () => {
  it('exposes the Backstage filename and api version', () => {
    expect(BACKSTAGE_FILENAME).toBe('catalog-info.yaml');
    expect(BACKSTAGE_API_VERSION).toBe('backstage.io/v1alpha1');
    expect(BACKSTAGE_KIND_COMPONENT).toBe('Component');
    expect(BACKSTAGE_KIND_API).toBe('API');
    expect(BACKSTAGE_KIND_LOCATION).toBe('Location');
    expect(BACKSTAGE_KIND_NRCOMPOSER).toBe('NRComposer');
  });

  it('points the generator annotation path at the composer namespace', () => {
    expect(BACKSTAGE_GENERATOR_PATH).toEqual([
      'metadata',
      'annotations',
      'composer.io.nrs.gov.bc.ca/generators',
    ]);
  });
});

describe('pathToProps / propRecord', () => {
  it('maps every path-to-prop entry into the propRecord by prop name', () => {
    expect(propRecord.serviceName).toEqual(
      pathToProps.find((p) => p.prop === 'serviceName'),
    );
    expect(propRecord.projectName).toEqual(
      pathToProps.find((p) => p.prop === 'projectName'),
    );
  });

  it('marks csv fields as csv', () => {
    expect(propRecord.tags.csv).toBe(true);
    expect(propRecord.locationTargets.csv).toBe(true);
    expect(propRecord.serviceName.csv).toBeFalsy();
  });

  it('maps OCP Knox values prompts for persistence', () => {
    expect(
      [
        'ocpKnoxCronSchedule',
        'ocpKnoxSourceSecretName',
        'ocpKnoxTargetSecretName',
        'ocpKnoxSyncSchedule',
        'ocpKnoxSyncSourceSecretName',
      ].every((prop) => Boolean(propRecord[prop])),
    ).toBe(true);
  });
});

describe('extractFromYaml', () => {
  it('extracts known props from a parsed document', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  description: A test service
spec:
  system: my-project
`,
    );
    const answers = extractFromYaml(doc, pathToProps);
    expect(answers.serviceName).toBe('my-service');
    expect(answers.description).toBe('A test service');
    expect(answers.projectName).toBe('my-project');
  });

  it('returns an empty object when the document is falsy', () => {
    expect(
      extractFromYaml(undefined as unknown as Document, pathToProps),
    ).toEqual({});
  });

  it('omits props that are not present in the document', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
`,
    );
    const answers = extractFromYaml(doc, pathToProps);
    expect(answers.serviceName).toBe('my-service');
    expect(answers.description).toBeUndefined();
  });
});

describe('addGeneratorToDoc / hasGeneratorInDoc', () => {
  it('stores a generator as an entry in the NRComposer spec.generators array', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
`,
    );
    expect(hasGeneratorInDoc(composer, 'gh-nodejs-build')).toBe(false);
    addGeneratorToDoc(composer, 'gh-nodejs-build');
    expect(hasGeneratorInDoc(composer, 'gh-nodejs-build')).toBe(true);
    expect(getGeneratorsFromDoc(composer)).toEqual(['gh-nodejs-build']);
  });

  it('appends to an existing spec.generators array', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
`,
    );
    addGeneratorToDoc(composer, 'gh-oci-deploy-onprem');
    expect(getGeneratorsFromDoc(composer)).toEqual([
      'gh-nodejs-build',
      'gh-oci-deploy-onprem',
    ]);
    expect(hasGeneratorInDoc(composer, 'gh-nodejs-build')).toBe(true);
    expect(hasGeneratorInDoc(composer, 'gh-oci-deploy-onprem')).toBe(true);
  });

  it('does not add a duplicate generator', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
`,
    );
    addGeneratorToDoc(composer, 'gh-nodejs-build');
    const stored = getGeneratorsFromDoc(composer);
    expect(stored.filter((g) => g === 'gh-nodejs-build')).toHaveLength(1);
  });

  it('migrates a legacy comma-separated annotation into the spec.generators array', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
metadata:
  annotations:
    composer.io.nrs.gov.bc.ca/generators: gh-nodejs-build,gh-maven-build
`,
    );
    addGeneratorToDoc(composer, 'gh-oci-deploy-onprem');
    expect(getGeneratorsFromDoc(composer)).toEqual([
      'gh-nodejs-build',
      'gh-maven-build',
      'gh-oci-deploy-onprem',
    ]);
    // The legacy annotation is cleared once the array is authoritative.
    expect(composer.hasIn(BACKSTAGE_GENERATOR_PATH)).toBe(false);
  });

  it('returns false for a generator that is not present', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
`,
    );
    expect(hasGeneratorInDoc(composer, 'gh-maven-build')).toBe(false);
  });
});

describe('migrateComposerAnnotations', () => {
  it('moves the generators annotation off the entity into the NRComposer array', () => {
    const entity = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: " backstage , gh-nodejs-build "
    composer.io.nrs.gov.bc.ca/skipAutomatedScan: true
`,
    );
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
`,
    );

    const migrated = migrateComposerAnnotations(composer, entity);
    expect(migrated).toBe(true);
    expect(getGeneratorsFromDoc(composer)).toEqual([
      'backstage',
      'gh-nodejs-build',
    ]);
    expect(composer.getIn(NRCOMPOSER_SKIP_SCAN_PATH)).toBe(true);
    // Legacy annotations are removed from the entity.
    expect(entity.hasIn(BACKSTAGE_GENERATOR_PATH)).toBe(false);
    // A now-empty annotations map is dropped so the entity stays clean.
    expect(entity.getIn(['metadata', 'annotations'])).toBeUndefined();
  });

  it('is idempotent when the NRComposer already carries the generators', () => {
    const entity = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: gh-nodejs-build
`,
    );
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
    - gh-oci-deploy-onprem
`,
    );

    migrateComposerAnnotations(composer, entity);
    // Existing array is preserved; the legacy annotation is still cleared.
    expect(getGeneratorsFromDoc(composer)).toEqual([
      'gh-nodejs-build',
      'gh-oci-deploy-onprem',
    ]);
    expect(entity.hasIn(BACKSTAGE_GENERATOR_PATH)).toBe(false);
  });
});

describe('pairCatalogDocs', () => {
  it('reuses the NRComposer document that follows the entity', () => {
    const entity = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
`,
    );
    const existing = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
`,
    );
    const docs = [entity, existing];

    const [paired] = pairCatalogDocs(docs);
    expect(paired.doc).toBe(entity);
    expect(paired.composerDoc).toBe(existing);
    expect(getGeneratorsFromDoc(paired.composerDoc)).toEqual([
      'gh-nodejs-build',
    ]);
    expect(docs).toHaveLength(2);
  });

  it('creates a NRComposer document after the entity when none exists', () => {
    const entity = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: gh-nodejs-build
    playbook.io.nrs.gov.bc.ca/nodeVersion: "20"
`,
    );
    const docs = [entity];

    const [{ composerDoc }] = pairCatalogDocs(docs);
    expect(composerDoc.get('kind')).toBe(BACKSTAGE_KIND_NRCOMPOSER);
    expect(composerDoc.has('metadata')).toBe(false);
    expect(getGeneratorsFromDoc(composerDoc)).toEqual(['gh-nodejs-build']);
    expect(composerDoc.getIn(['spec', 'answers', 'nodeVersion'])).toBe('20');
    expect(entity.getIn(['metadata', 'annotations'])).toBeUndefined();
    // The new document is registered on the docs array for save().
    expect(docs).toEqual([entity, composerDoc]);
  });

  it('shares the single NRComposer across entities and skips Instance documents', () => {
    const { docs, entities } = parseCatalog(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_LOCATION}
metadata:
  name: components
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-maven-build
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_INSTANCE}
metadata:
  name: my-service-test
spec:
  env: test
`,
    );

    expect(entities.map((e) => e.doc.get('kind'))).toEqual([
      BACKSTAGE_KIND_LOCATION,
      BACKSTAGE_KIND_COMPONENT,
    ]);
    expect(entities[0].composerDoc).toBe(entities[1].composerDoc);
    expect(getGeneratorsFromDoc(entities[0].composerDoc)).toEqual([
      'gh-maven-build',
    ]);
    expect(docs.map((doc) => doc.get('kind'))).toEqual([
      BACKSTAGE_KIND_LOCATION,
      BACKSTAGE_KIND_COMPONENT,
      BACKSTAGE_KIND_NRCOMPOSER,
      BACKSTAGE_KIND_INSTANCE,
    ]);
  });

  it('rejects a catalog with more than one NRComposer document', () => {
    expect(() =>
      parseCatalog(
        `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_LOCATION}
metadata:
  name: components
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
`,
      ),
    ).toThrow(/only one is supported/);
  });

  it('migrates legacy instance JSON into metadata.links, including missing URLs', () => {
    const { entities } = parseCatalog(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    playbook.io.nrs.gov.bc.ca/instances: '[{"env":"production","url":"https://app.example"},{"env":"tools","name":"tools"}]'
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  answers:
    nodeVersion: "22"
`,
    );

    expect(entities[0].doc.getIn(['metadata', 'links'])).toEqual([
      {
        type: 'production',
        title: 'production',
        url: 'https://app.example',
      },
      { type: 'tools', title: 'tools' },
    ]);
    expect(entities[0].doc.hasIn(['metadata', 'annotations'])).toBe(false);
    expect(
      entities[0].composerDoc.getIn(['spec', 'answers'])?.toJSON(),
    ).toEqual({ nodeVersion: '22' });
    expect(getGeneratorsFromDoc(entities[0].composerDoc)).toContain(
      'backstage-instances',
    );
  });

  it('pairs a lone entity with a lone NRComposer placed before it', () => {
    const { entities } = parseCatalog(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
---
apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
`,
    );

    expect(getGeneratorsFromDoc(entities[0].composerDoc)).toEqual([
      'gh-nodejs-build',
    ]);
  });
});

describe('getGeneratorsFromDoc', () => {
  it('prefers spec.generators over a legacy annotation', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  generators:
    - gh-nodejs-build
  annotations:
    composer.io.nrs.gov.bc.ca/generators: "stale,legacy"
`,
    );
    expect(getGeneratorsFromDoc(composer)).toEqual(['gh-nodejs-build']);
  });

  it('falls back to the legacy annotation when no spec.generators exist', () => {
    const composer = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: " backstage , gh-maven-build "
`,
    );
    expect(getGeneratorsFromDoc(composer)).toEqual([
      'backstage',
      'gh-maven-build',
    ]);
  });

  it('returns an empty list for an undefined document', () => {
    expect(getGeneratorsFromDoc(undefined)).toEqual([]);
  });
});

describe('generateSetAnswerPropPredicate', () => {
  it('returns true for names not present in answers', () => {
    const predicate = generateSetAnswerPropPredicate({ foo: 'bar' }, false);
    expect(predicate({ name: 'foo' })).toBe(false);
    expect(predicate({ name: 'baz' })).toBe(true);
  });

  it('returns true for all names when keepAnswered is true', () => {
    const predicate = generateSetAnswerPropPredicate({ foo: 'bar' }, true);
    expect(predicate({ name: 'foo' })).toBe(true);
    expect(predicate({ name: 'baz' })).toBe(true);
  });
});
