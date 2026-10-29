import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BackstageInstancesStorage } from './storage.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';

describe('BackstageInstancesStorage', () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backstage-instances-'));
    configPath = path.join(tmpDir, 'catalog-info.yaml');
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  const linkCatalog = `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  links:
    - title: Documentation
      url: https://docs.example.gov.bc.ca
    - type: development
      title: Development
      url: https://dev.example.gov.bc.ca
`;

  it('reads only environment links and returns their prompt values', () => {
    fs.writeFileSync(configPath, linkCatalog);
    const storage = new BackstageInstancesStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    expect(storage.getInstanceLinks()).toEqual([
      {
        env: 'development',
        name: 'Development',
        url: 'https://dev.example.gov.bc.ca',
      },
    ]);
    storage.selectInstanceLink(0);
    expect(storage.getAnswers()).toEqual({
      instanceEnv: 'development',
      instanceName: 'Development',
      instanceUrl: 'https://dev.example.gov.bc.ca',
    });
  });

  it('appends an environment link without changing unrelated links', () => {
    fs.writeFileSync(configPath, linkCatalog);
    const storage = new BackstageInstancesStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );
    storage.selectInstanceLink(1);
    storage.set('promptValues', {
      instanceEnv: 'tools',
      instanceName: '',
      instanceUrl: 'https://tools.example.gov.bc.ca',
    });

    expect(storage.doc.getIn(['metadata', 'links'])).toEqual([
      { title: 'Documentation', url: 'https://docs.example.gov.bc.ca' },
      {
        type: 'development',
        title: 'Development',
        url: 'https://dev.example.gov.bc.ca',
      },
      {
        type: 'tools',
        title: 'tools',
        url: 'https://tools.example.gov.bc.ca',
      },
    ]);
    expect(storage.composer.toJSON().spec?.answers).toBeUndefined();
  });

  it('treats a missing URL as unanswered and validates the next index', () => {
    fs.writeFileSync(
      configPath,
      `apiVersion: backstage.io/v1alpha1
kind: ${BACKSTAGE_KIND_COMPONENT}
metadata:
  name: my-service
  links:
    - type: test
      title: Test
`,
    );
    const storage = new BackstageInstancesStorage(
      'my-service',
      BACKSTAGE_KIND_COMPONENT,
      undefined,
      configPath,
    );

    storage.selectInstanceLink(0);
    expect(storage.getPath('instanceUrl')).toBeUndefined();
    expect(storage.getAnswers()).toEqual({
      instanceEnv: 'test',
      instanceName: 'Test',
    });
    expect(() => storage.selectInstanceLink(2)).toThrow(/out of range/);
    storage.selectInstanceLink(1);
    expect(storage.getAnswers()).toEqual({});
  });
});
