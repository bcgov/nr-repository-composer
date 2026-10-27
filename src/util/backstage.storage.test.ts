import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BackstageStorage } from './backstage.storage.js';
import {
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_INSTANCE,
  BACKSTAGE_KIND_LOCATION,
  BACKSTAGE_KIND_NRCOMPOSER,
  getGeneratorsFromDoc,
} from './yaml.js';

describe('BackstageStorage', () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backstage-storage-'));
    configPath = path.join(tmpDir, 'catalog-info.yaml');
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

  it('writes answers to NRComposer in a second YAML document', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.set('serviceName', 'solo-service');
    storage.set('nodeVersion', '22');
    storage.save();

    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('\n---\n');
    expect(content).toContain('kind: NRComposer');
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
---
apiVersion: backstage.io/v1alpha1
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
    expect(content).toContain('---');
    expect(content).toContain('kind: NRComposer');
    expect(content).toContain('- gh-nodejs-build');
    expect(content).not.toContain('composer.io.nrs.gov.bc.ca/generators');
    expect(content).not.toContain('playbook.io.nrs.gov.bc.ca/nodeVersion');
    expect(content).toContain('github.com/project-slug: bcgov/my-service');
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
    const content = fs.readFileSync(configPath, 'utf8');
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

  const instanceCatalog = `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
---
apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_INSTANCE}
metadata:
  name: my-service-test
spec:
  env: test
---
apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_INSTANCE}
metadata:
  name: my-service-production
spec:
  env: production
  url: https://app.example.gov.bc.ca
`;

  it('allows several Instance documents without pairing them to NRComposers', () => {
    fs.writeFileSync(configPath, instanceCatalog);

    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(
      storage
        .kindDocs(BACKSTAGE_KIND_INSTANCE)
        .map((doc) => doc.getIn(['spec', 'env'])),
    ).toEqual(['test', 'production']);
    expect(
      storage.kindDoc(BACKSTAGE_KIND_INSTANCE, 1).getIn(['spec', 'url']),
    ).toBe('https://app.example.gov.bc.ca');
    expect(
      storage.docs.filter((doc) => doc.get('kind') === 'NRComposer'),
    ).toHaveLength(1);
  });

  it('adds the next Instance document after the last one and saves it', () => {
    fs.writeFileSync(configPath, instanceCatalog);

    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    const added = storage.kindDoc(BACKSTAGE_KIND_INSTANCE, 2);
    added.setIn(['spec', 'env'], 'tools');
    storage.addGeneratorToDoc('backstage-instances');
    storage.save();

    const kinds = fs
      .readFileSync(configPath, 'utf8')
      .split('\n---\n')
      .map((block) => block.match(/^kind: (\w+)/m)?.[1]);
    expect(kinds).toEqual([
      BACKSTAGE_KIND_COMPONENT,
      'NRComposer',
      BACKSTAGE_KIND_INSTANCE,
      BACKSTAGE_KIND_INSTANCE,
      BACKSTAGE_KIND_INSTANCE,
    ]);
    const reloaded = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    expect(
      reloaded.kindDoc(BACKSTAGE_KIND_INSTANCE, 2).getIn(['spec', 'env']),
    ).toBe('tools');
  });

  it('reads Instance prompts from the selected document spec keys', () => {
    fs.writeFileSync(configPath, instanceCatalog);
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.selectKindDoc(BACKSTAGE_KIND_INSTANCE, 1)).toBe(storage.doc);
    expect(storage.getPath('instanceEnv')).toBe('production');
    // Optional values left blank count as answered once env is set.
    expect(storage.getPath('instanceName')).toBe('');
    expect(storage.getPath('serviceName')).toBeUndefined();
    expect(storage.getAnswers()).toEqual({
      instanceEnv: 'production',
      instanceName: '',
      instanceUrl: 'https://app.example.gov.bc.ca',
    });
  });

  it('leaves every Instance prompt unanswered for a new document', () => {
    fs.writeFileSync(configPath, instanceCatalog);
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    storage.selectKindDoc(BACKSTAGE_KIND_INSTANCE, 2);
    expect(storage.getPath('instanceEnv')).toBeUndefined();
    expect(storage.getPath('instanceName')).toBeUndefined();
    expect(storage.getAnswers()).toEqual({});
  });

  it('writes Instance prompts to the document, not the shared answers', () => {
    fs.writeFileSync(configPath, instanceCatalog);
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    const doc = storage.selectKindDoc(BACKSTAGE_KIND_INSTANCE, 1);
    storage.setPath('instanceName', ' blue ');
    storage.setPath('instanceUrl', '');
    storage.setPath('unmapped', 'ignored');
    storage.set('promptValues', { instanceEnv: 'test', other: 'ignored' });

    expect(doc.toJSON().spec).toEqual({ env: 'test', name: 'blue' });
    expect(storage.composer.toJSON().spec?.answers).toBeUndefined();
  });

  it('rejects an Instance index past the next new document', () => {
    fs.writeFileSync(configPath, instanceCatalog);
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(() => storage.kindDoc(BACKSTAGE_KIND_INSTANCE, 3)).toThrow(
      /out of range/,
    );
    expect(() => storage.kindDoc(BACKSTAGE_KIND_INSTANCE, -1)).toThrow(
      /out of range/,
    );
  });

  it('only selects index 0 of a single-document kind', () => {
    fs.writeFileSync(configPath, instanceCatalog);
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.kindDoc(BACKSTAGE_KIND_COMPONENT, 0)).toBe(storage.doc);
    expect(() => storage.kindDoc(BACKSTAGE_KIND_COMPONENT, 1)).toThrow(
      /out of range/,
    );
  });

  it('migrates stored instances into Instance documents on load', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  annotations:
    playbook.io.nrs.gov.bc.ca/instances: '[{"env":"production","url":"https://app.example"},{"env":"production","name":"blue"}]'
---
apiVersion: backstage.io/v1alpha1
kind: NRComposer
spec:
  answers:
    instanceEnvs:
      - production
    instanceUrl:production: https://app.example
    nodeVersion: "22"
`,
    );

    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(
      storage.kindDocs(BACKSTAGE_KIND_INSTANCE).map((doc) => doc.toJSON()),
    ).toEqual([
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: BACKSTAGE_KIND_INSTANCE,
        metadata: { name: 'my-service-production' },
        spec: { env: 'production', url: 'https://app.example' },
      },
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: BACKSTAGE_KIND_INSTANCE,
        metadata: { name: 'my-service-blue' },
        spec: { env: 'production', name: 'blue' },
      },
    ]);
    expect(storage.doc.hasIn(['metadata', 'annotations'])).toBe(false);
    expect(storage.composer.getIn(['spec', 'answers'])?.toJSON()).toEqual({
      nodeVersion: '22',
    });
    expect(storage.hasGenerator('backstage-instances')).toBe(true);
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
    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).toContain('kind: NRComposer');
    expect(content).toContain('- gh-nodejs-build');
  });
});
