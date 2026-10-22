import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BackstageStorage } from './backstage.storage.js';
import { BACKSTAGE_KIND_COMPONENT, BACKSTAGE_KIND_LOCATION } from './yaml.js';

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
      configPath,
    );
    expect(storage.doc.getIn(['metadata', 'name'])).toBe('existing-service');
  });

  it('throws on a kind mismatch unless ignoreKindMismatch is set', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: my-location
`,
    );
    expect(
      () =>
        new BackstageStorage(
          'my-location',
          BACKSTAGE_KIND_COMPONENT,
          configPath,
        ),
    ).toThrow(/kind mismatch/);
  });

  it('ignores a kind mismatch when ignoreKindMismatch is set', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: Location
metadata:
  name: my-location
`,
    );
    expect(
      () =>
        new BackstageStorage(
          'my-location',
          BACKSTAGE_KIND_COMPONENT,
          configPath,
          { ignoreKindMismatch: true },
        ),
    ).not.toThrow();
  });

  it('adds and detects generators on the document', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
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
      configPath,
    );
    storage.set('serviceName', 'renamed-service');
    expect(storage.get('serviceName')).toBe('renamed-service');
  });

  it('ignores transient prompt names that have no catalog mapping', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      configPath,
    );

    expect(storage.getPath('instanceUrl:tools')).toBeUndefined();
    expect(() =>
      storage.setPath('instanceUrl:tools', 'https://tools.example'),
    ).not.toThrow();
  });

  it('stores instances in the playbook annotation and reads them back', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      configPath,
    );
    const instances = [{ env: 'production', url: 'https://app.example' }];

    storage.setPath('instances', JSON.stringify(instances));

    expect(
      storage.doc.getIn([
        'metadata',
        'annotations',
        'playbook.io.nrs.gov.bc.ca/instances',
      ]),
    ).toBe(JSON.stringify(instances));
    expect(storage.getAnswers().instances).toBe(JSON.stringify(instances));
  });

  it('saves the document back to disk', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      configPath,
    );
    storage.set('serviceName', 'saved-service');
    storage.save();
    expect(fs.existsSync(configPath)).toBe(true);
    const reloaded = new BackstageStorage(
      'saved-service',
      BACKSTAGE_KIND_COMPONENT,
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
      configPath,
    );
    expect(component.doc.getIn(['kind'])).toBe(BACKSTAGE_KIND_COMPONENT);
    expect(component.get('serviceName')).toBe('component-service');

    const location = new BackstageStorage(
      'my-location',
      BACKSTAGE_KIND_LOCATION,
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

  it('keeps a single-kind catalog file free of the multi-document delimiter', () => {
    const storage = new BackstageStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      configPath,
    );
    storage.set('serviceName', 'solo-service');
    storage.save();

    const content = fs.readFileSync(configPath, 'utf8');
    expect(content).not.toContain('\n---\n');
  });

  it('exposes all held documents via the docs accessor', () => {
    fs.writeFileSync(configPath, multiDocCatalog);

    const component = new BackstageStorage(
      'component-service',
      BACKSTAGE_KIND_COMPONENT,
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
});
