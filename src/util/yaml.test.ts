import { parseDocument, Document } from 'yaml';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_API_VERSION,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
  BACKSTAGE_GENERATOR_PATH,
  pathToProps,
  propRecord,
  extractFromYaml,
  addGeneratorToDoc,
  hasGeneratorInDoc,
  generateSetAnswerPropPredicate,
} from './yaml.js';

describe('yaml constants', () => {
  it('exposes the Backstage filename and api version', () => {
    expect(BACKSTAGE_FILENAME).toBe('catalog-info.yaml');
    expect(BACKSTAGE_API_VERSION).toBe('backstage.io/v1alpha1');
    expect(BACKSTAGE_KIND_COMPONENT).toBe('Component');
    expect(BACKSTAGE_KIND_LOCATION).toBe('Location');
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
  it('adds a generator to a document that has no generator annotation', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
`,
    );
    expect(hasGeneratorInDoc(doc, 'gh-nodejs-build')).toBe(false);
    addGeneratorToDoc(doc, 'gh-nodejs-build');
    expect(hasGeneratorInDoc(doc, 'gh-nodejs-build')).toBe(true);
  });

  it('appends to an existing comma-separated generator list', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: gh-nodejs-build
`,
    );
    addGeneratorToDoc(doc, 'gh-oci-deploy-onprem');
    expect(hasGeneratorInDoc(doc, 'gh-nodejs-build')).toBe(true);
    expect(hasGeneratorInDoc(doc, 'gh-oci-deploy-onprem')).toBe(true);
  });

  it('does not add a duplicate generator', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: gh-nodejs-build
`,
    );
    addGeneratorToDoc(doc, 'gh-nodejs-build');
    const stored = doc.getIn(BACKSTAGE_GENERATOR_PATH) as string;
    expect(
      stored.split(',').filter((g) => g === 'gh-nodejs-build'),
    ).toHaveLength(1);
  });

  it('returns false for a generator that is not present', () => {
    const doc = parseDocument(
      `apiVersion: ${BACKSTAGE_API_VERSION}
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
`,
    );
    expect(hasGeneratorInDoc(doc, 'gh-maven-build')).toBe(false);
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
