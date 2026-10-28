import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BackstageStorage } from './backstage.storage.js';
import {
  BACKSTAGE_KIND_API,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
  BACKSTAGE_KIND_NRCOMPOSER,
  getGeneratorsFromDoc,
} from './yaml.js';

describe('BackstageStorage', () => {
  let tmpDir: string;
  let configPath: string;
  let composerPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backstage-storage-'));
    configPath = path.join(tmpDir, 'catalog-info.yaml');
    composerPath = path.join(tmpDir, 'catalog-composer.yaml');
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('creates a new document with the given kind when the file is absent', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(storage.doc.get('kind')).toBe(BACKSTAGE_KIND_COMPONENT);
  });

  it('loads an existing document from disk', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: existing-service
`,
    );
    const storage = new BackstageStorage(
      'existing-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(storage.doc.getIn(['metadata', 'name'])).toBe('existing-service');
  });

  it('adds a document of the requested kind when the file lacks one', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: my-location
`,
    );
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.doc.get('kind')).toBe(BACKSTAGE_KIND_COMPONENT);
    expect(storage.kindDocs('Location')).toHaveLength(1);
    // The file's single NRComposer is shared rather than duplicated.
    expect(storage.kindDocs(BACKSTAGE_KIND_NRCOMPOSER)).toHaveLength(1);
  });

  it('stores the Yeoman prompt cache flat in the shared answers map', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.set('promptValues', { serviceName: 'my-service', clientId: 'x' });

    expect(storage.composer.getIn(['spec', 'answers'])?.toJSON()).toEqual({
      clientId: 'x',
    });
    expect(storage.doc.getIn(['metadata', 'name'])).toBe('my-service');
  });

  it('adds and detects generators on the document', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(storage.hasGenerator('gh-nodejs-build')).toBe(false);
    storage.addGeneratorToDoc('gh-nodejs-build');
    expect(storage.hasGenerator('gh-nodejs-build')).toBe(true);
  });

  it('sets and reads a mapped property via get/set', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.set('serviceName', 'renamed-service');
    expect(storage.get('serviceName')).toBe('renamed-service');
  });

  it('writes document values to the entity and only other answers to NRComposer', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    storage.set('serviceName', 'renamed-service');
    storage.set('projectName', 'my-project');
    storage.set('nodeVersion', '22');
    storage.set('transientAnswer', 'value');

    expect(storage.composer.getIn(['spec', 'answers'])?.toJSON()).toEqual({
      nodeVersion: '22',
      transientAnswer: 'value',
    });
    expect(storage.doc.getIn(['metadata', 'name'])).toBe('renamed-service');
    expect(storage.doc.getIn(['spec', 'system'])).toBe('my-project');
    expect(
      storage.doc.hasIn([
        'metadata',
        'annotations',
        'playbook.io.nrs.gov.bc.ca/nodeVersion',
      ]),
    ).toBe(false);
    expect(storage.getAnswers()).toMatchObject({
      serviceName: 'renamed-service',
      projectName: 'my-project',
      nodeVersion: '22',
      transientAnswer: 'value',
    });
  });

  it('ignores transient prompt names that have no catalog mapping', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.getPath('instanceUrl:tools')).toBeUndefined();
    expect(() =>
      storage.setPath('instanceUrl:tools', 'https://tools.example'),
    ).not.toThrow();
  });

  it('saves the document back to disk', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.set('serviceName', 'saved-service');
    storage.save();
    expect(fs.existsSync(configPath)).toBe(true);
    const reloaded = new BackstageStorage(
      'saved-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(reloaded.get('serviceName')).toBe('saved-service');
  });

  const multiDocCatalog = `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: component-service
---
apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_LOCATION}
metadata:
  name: my-location
spec:
  type: path
`;

  it('parses a multi-document file and selects the document matching its kind', () => {
    fs.writeFileSync(configPath, multiDocCatalog);

    const component = new BackstageStorage(
      'component-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(component.doc.getIn(['kind'])).toBe(BACKSTAGE_KIND_COMPONENT);
    expect(component.get('serviceName')).toBe('component-service');

    const location = new BackstageStorage(
      'my-location',
      BACKSTAGE_KIND_LOCATION,
      undefined,
      configPath,
    );
    expect(location.doc.getIn(['kind'])).toBe(BACKSTAGE_KIND_LOCATION);
    expect(location.doc.getIn(['metadata', 'name'])).toBe('my-location');
  });

  it('preserves documents of other kinds when saving', () => {
    fs.writeFileSync(configPath, multiDocCatalog);

    const component = new BackstageStorage(
      'component-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    component.set('serviceName', 'renamed-service');
    component.save();

    const content = fs.readFileSync(configPath, 'utf8');
    // The Location document must survive the save untouched.
    expect(content).toContain('---');
    expect(content).toContain(`kind: ${BACKSTAGE_KIND_LOCATION}`);
    expect(content).toContain('name: my-location');
    expect(content).toContain('name: renamed-service');
  });

  it('writes answers to NRComposer in the composer file', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.set('serviceName', 'solo-service');
    storage.set('nodeVersion', '22');
    storage.save();

    expect(fs.readFileSync(configPath, 'utf8')).not.toContain('NRComposer');
    const content = fs.readFileSync(composerPath, 'utf8');
    expect(content).toContain('kind: NRComposer');
    expect(content).toContain('apiVersion: composer.io.nrs.gov.bc.ca/v1');
    expect(content).toContain('answers:');
    expect(content).toContain('nodeVersion: "22"');
    expect(content).not.toContain('serviceName:');
  });

  it('reads document values from the document, dropping duplicate answers', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  tags:
    - website
`,
    );
    fs.writeFileSync(
      composerPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_NRCOMPOSER}
spec:
  answers:
    serviceName: stale-name
    tags: stale
    nodeVersion: "22"
`,
    );
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.getPath('serviceName')).toBe('my-service');
    expect(storage.get('serviceName')).toBe('my-service');
    expect(storage.getPath('tags')).toBe('website');
    expect(storage.getPath('nodeVersion')).toBe('22');
    expect(storage.getAnswers()).toMatchObject({
      serviceName: 'my-service',
      nodeVersion: '22',
    });
    expect(storage.composer.getIn(['spec', 'answers'])?.toJSON()).toEqual({
      nodeVersion: '22',
    });
  });

  it('exposes all held documents via the docs accessor', () => {
    fs.writeFileSync(configPath, multiDocCatalog);

    const component = new BackstageStorage(
      'component-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    const kinds = component.docs
      .filter((doc) => doc.contents)
      .map((doc) => doc.getIn(['kind']));
    expect(kinds).toEqual(
      expect.arrayContaining([
        BACKSTAGE_KIND_COMPONENT,
        BACKSTAGE_KIND_LOCATION,
      ]),
    );
  });

  it('migrates a legacy generators annotation into a NRComposer document on load', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/generators: "gh-nodejs-build,gh-oci-deploy-onprem"
    playbook.io.nrs.gov.bc.ca/nodeVersion: "20"
    github.com/project-slug: bcgov/my-service
`,
    );

    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    // The entity no longer carries the legacy annotation.
    expect(
      storage.doc.hasIn([
        'metadata',
        'annotations',
        'composer.io.nrs.gov.bc.ca/generators',
      ]),
    ).toBe(false);

    // The NRComposer document carries the generators as a YAML array.
    expect(storage.composer.get('kind')).toBe('NRComposer');
    expect(getGeneratorsFromDoc(storage.composer)).toEqual([
      'gh-nodejs-build',
      'gh-oci-deploy-onprem',
    ]);
    expect(storage.hasGenerator('gh-nodejs-build')).toBe(true);
    expect(storage.hasGenerator('gh-oci-deploy-onprem')).toBe(true);
    expect(storage.composer.getIn(['spec', 'answers', 'nodeVersion'])).toBe(
      '20',
    );
    expect(
      storage.doc.hasIn([
        'metadata',
        'annotations',
        'playbook.io.nrs.gov.bc.ca/nodeVersion',
      ]),
    ).toBe(false);
    expect(
      storage.doc.getIn(['metadata', 'annotations', 'github.com/project-slug']),
    ).toBe('bcgov/my-service');

    storage.save();
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).not.toContain('NRComposer');
    expect(content).not.toContain('composer.io.nrs.gov.bc.ca/generators');
    expect(content).not.toContain('playbook.io.nrs.gov.bc.ca/nodeVersion');
    expect(content).toContain('github.com/project-slug: bcgov/my-service');
    const composer = fs.readFileSync(composerPath, 'utf8');
    expect(composer).toContain('kind: NRComposer');
    expect(composer).toContain('- gh-nodejs-build');
  });

  it('migrates skipAutomatedScan into the NRComposer document on load', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    composer.io.nrs.gov.bc.ca/skipAutomatedScan: true
`,
    );

    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(
      storage.doc.hasIn([
        'metadata',
        'annotations',
        'composer.io.nrs.gov.bc.ca/skipAutomatedScan',
      ]),
    ).toBe(false);
    expect(storage.composer.getIn(['spec', 'skipAutomatedScan'])).toBe(true);

    storage.save();
    const content = fs.readFileSync(composerPath, 'utf8');
    expect(content).toContain('kind: NRComposer');
    expect(content).toContain('skipAutomatedScan: true');
  });

  it('rejects a catalog with more than one document of a kind', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: first-service
---
apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: second-service
`,
    );
    expect(
      () =>
        new BackstageStorage(
          'first-service',
          BACKSTAGE_KIND_COMPONENT,
          undefined,
          configPath,
        ),
    ).toThrow(/only one document per kind/);
  });

  it('stores multiple API documents independently', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_API}
metadata:
  name: artist-api
spec:
  type: openapi
  lifecycle: production
  owner: artist-team
  definition: 'openapi: 3.0.0'
---
apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_API}
metadata:
  name: catalog-api
spec:
  type: graphql
  lifecycle: experimental
  definition: 'type Query { catalog: String }'
`,
    );

    const storage = new BackstageStorage(
      'artist-api',
      BACKSTAGE_KIND_API,
      undefined,
      configPath,
    );
    expect(storage.kindDocs(BACKSTAGE_KIND_API)).toHaveLength(2);

    storage.selectKindDoc(BACKSTAGE_KIND_API, 1);
    expect(storage.getPath('apiName')).toBe('catalog-api');
    expect(storage.getPath('apiType')).toBe('graphql');
    expect(storage.getPath('apiOwner')).toBeUndefined();
    expect(storage.getPath('apiSystem')).toBe('');
    storage.setPath('apiOwner', 'new-owner');
    storage.save();

    const reloaded = new BackstageStorage(
      'artist-api',
      BACKSTAGE_KIND_API,
      undefined,
      configPath,
    );
    expect(reloaded.kindDocs(BACKSTAGE_KIND_API)).toHaveLength(2);
    expect(
      reloaded.kindDoc(BACKSTAGE_KIND_API, 0).getIn(['spec', 'owner']),
    ).toBe('artist-team');
    expect(
      reloaded.kindDoc(BACKSTAGE_KIND_API, 1).getIn(['spec', 'owner']),
    ).toBe('new-owner');
  });

  it('records a generator on the NRComposer document and emits it on save', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.addGeneratorToDoc('gh-nodejs-build');

    expect(storage.hasGenerator('gh-nodejs-build')).toBe(true);
    // Stored on the composer document, not the entity.
    expect(
      storage.doc.hasIn([
        'metadata',
        'annotations',
        'composer.io.nrs.gov.bc.ca/generators',
      ]),
    ).toBe(false);
    expect(getGeneratorsFromDoc(storage.composer)).toEqual(['gh-nodejs-build']);

    storage.save();
    const content = fs.readFileSync(composerPath, 'utf8');
    expect(content).toContain('kind: NRComposer');
    expect(content).toContain('- gh-nodejs-build');
  });

  it('prefers the composer file over a NRComposer in the catalog file without merging', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
---
apiVersion: backstage.io/v1alpha1
kind: NRComposer
spec:
  answers:
    nodeVersion: "18"
`,
    );
    fs.writeFileSync(
      composerPath,
      `apiVersion: backstage.io/v1alpha1
kind: NRComposer
spec:
  answers:
    other: x
`,
    );
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(storage.getPath('nodeVersion')).toBeUndefined();
    expect(storage.getPath('other')).toBe('x');
    storage.save();
    expect(fs.readFileSync(configPath, 'utf8')).not.toContain('NRComposer');
    expect(fs.readFileSync(composerPath, 'utf8')).toContain('other: x');
  });

  it('moves a NRComposer that only exists in the catalog file to the composer file', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
---
apiVersion: backstage.io/v1alpha1
kind: NRComposer
spec:
  answers:
    nodeVersion: "18"
`,
    );
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(storage.getPath('nodeVersion')).toBe('18');
    storage.save();
    expect(fs.readFileSync(configPath, 'utf8')).not.toContain('NRComposer');
    expect(fs.readFileSync(composerPath, 'utf8')).toContain('nodeVersion');
  });

  it('writes a placeholder catalog file when only composer data exists', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_NRCOMPOSER,
      undefined,
      configPath,
    );
    storage.addGeneratorToDoc('gh-nodejs-build');
    storage.save();
    expect(fs.readFileSync(configPath, 'utf8')).toBe('');
    expect(fs.readFileSync(composerPath, 'utf8')).toContain(
      '- gh-nodejs-build',
    );
  });
});
