import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BackstageStorage } from './backstage.storage.js';
import { BACKSTAGE_KIND_COMPONENT } from './yaml.js';

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
});
