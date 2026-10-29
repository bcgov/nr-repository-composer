import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { parseDocument } from 'yaml';
import {
  formatScanRecordsHeadless,
  formatScanRecordsHuman,
  scanRepository,
  toScanRecord,
  type ScanRecord,
} from './scan.js';
import { scanRepositoryForComponents } from './yaml.js';

const doc = (yaml: string) => parseDocument(yaml);

describe('toScanRecord', () => {
  it('reads name and generators', () => {
    const record = toScanRecord(
      doc(`
kind: Component
metadata:
  name: world
  annotations:
    composer.io.nrs.gov.bc.ca/generators: backstage,gh-maven-build
`),
      'mod1/catalog-info.yaml',
    );

    expect(record).toEqual({
      kind: 'Component',
      name: 'world',
      dir: 'mod1',
      parentPath: undefined,
      generators: ['backstage', 'gh-maven-build'],
    });
  });

  it('uses "." for a catalog at the repository root', () => {
    const record = toScanRecord(
      doc(`
kind: Component
metadata:
  name: root
`),
      'catalog-info.yaml',
    );

    expect(record.dir).toBe('.');
    expect(record.generators).toEqual([]);
  });

  it('trims whitespace and drops empty generator entries', () => {
    const record = toScanRecord(
      doc(`
kind: Component
metadata:
  name: spaced
  annotations:
    composer.io.nrs.gov.bc.ca/generators: " backstage , ,gh-nodejs-build "
`),
      'a/catalog-info.yaml',
    );

    expect(record.generators).toEqual(['backstage', 'gh-nodejs-build']);
  });

  it('falls back to "unknown" when the name is missing', () => {
    const record = toScanRecord(doc('kind: Component'), 'catalog-info.yaml');
    expect(record.name).toBe('unknown');
  });

  it('reads generators from a Location document when it has the annotation', () => {
    const record = toScanRecord(
      doc(`
kind: Location
metadata:
  name: components
  annotations:
    composer.io.nrs.gov.bc.ca/generators: backstage-location,gh-common-mono-build
`),
      'catalog-info.yaml',
    );

    expect(record).toEqual({
      kind: 'Location',
      name: 'components',
      dir: '.',
      parentPath: undefined,
      generators: ['backstage-location', 'gh-common-mono-build'],
    });
  });

  it('reads generators from a paired NRComposer document', () => {
    const record = toScanRecord(
      doc(`
kind: Component
metadata:
  name: world
`),
      'mod1/catalog-info.yaml',
      undefined,
      doc(`
kind: NRComposer
spec:
  generators:
    - backstage
    - gh-maven-build
`),
    );

    expect(record).toEqual({
      kind: 'Component',
      name: 'world',
      dir: 'mod1',
      parentPath: undefined,
      generators: ['backstage', 'gh-maven-build'],
    });
  });
});

describe('formatScanRecordsHeadless', () => {
  const records: ScanRecord[] = [
    {
      kind: 'Component',
      name: 'world',
      dir: 'mod1',
      generators: ['backstage'],
    },
    {
      kind: 'Location',
      name: 'person',
      dir: 'mod2',
      generators: [],
    },
  ];

  it('emits one kind-prefixed, tab-separated record per catalog', () => {
    expect(formatScanRecordsHeadless(records).split('\n')).toEqual([
      'Component\tmod1\tworld\tbackstage',
      'Location\tmod2\tperson\t',
    ]);
  });

  it('returns an empty string when there is nothing to report', () => {
    expect(formatScanRecordsHeadless([])).toBe('');
  });
});

describe('formatScanRecordsHuman', () => {
  it('summarizes catalog files and their Location parent relationships', () => {
    const output = formatScanRecordsHuman([
      {
        kind: 'Component',
        name: 'world',
        dir: 'mod1',
        parentPath: 'catalog-info.yaml',
        generators: ['backstage'],
      },
      {
        kind: 'Component',
        name: 'person',
        dir: 'mod2',
        parentPath: 'catalog-info.yaml',
        generators: ['backstage'],
      },
    ]);

    expect(output).toContain('Found 2 catalog-info.yaml files');
    expect(output).toContain('./mod1/catalog-info.yaml\n    Component: world');
    expect(output).toContain('./mod2/catalog-info.yaml\n    Component: person');
    expect(output).not.toContain('skipAutomatedScan');
    expect(output).toContain('backstage (2)');
    expect(output).toContain('Configured generators:');
    expect(output).toContain('--all would run 2 generator invocations.');
  });

  it('reports when no components are found', () => {
    expect(formatScanRecordsHuman([])).toContain('No catalog-info.yaml files');
  });
});

describe('scanRepositoryForComponents', () => {
  let repoDir: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scan-'));
    fs.mkdirSync(path.join(repoDir, '.git'), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, '.git', 'config'),
      '[core]\n\trepositoryformatversion = 0\n',
    );
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('does not loop when a catalog Location targets its own file', () => {
    fs.writeFileSync(
      path.join(repoDir, 'catalog-info.yaml'),
      [
        'apiVersion: backstage.io/v1alpha1',
        'kind: Component',
        'metadata:',
        '  name: nr-bqs-knox',
        '  annotations:',
        '    composer.io.nrs.gov.bc.ca/generators: backstage,gh-docker-build',
        '---',
        'apiVersion: backstage.io/v1alpha1',
        'kind: Location',
        'metadata:',
        '  name: locations',
        'spec:',
        '  targets:',
        '    - ./catalog-info.yaml',
        '  type: path',
        '',
      ].join('\n'),
    );

    process.chdir(repoDir);
    const components = scanRepositoryForComponents(undefined, true);

    // The self-targeting Location is skipped, so the root catalog is loaded
    // once and yields exactly its two entities — no re-entrant loop.
    expect(components.map((c) => c.path)).toEqual([
      'catalog-info.yaml',
      'catalog-info.yaml',
    ]);
    expect(components.map((c) => c.doc.get('kind'))).toEqual([
      'Component',
      'Location',
    ]);
  });

  it('does not double count a single catalog with a Component and Location', () => {
    fs.writeFileSync(
      path.join(repoDir, 'catalog-info.yaml'),
      [
        'apiVersion: backstage.io/v1alpha1',
        'kind: Component',
        'metadata:',
        '  name: nr-bqs-knox',
        '  annotations:',
        '    composer.io.nrs.gov.bc.ca/generators: backstage,gh-docker-build',
        '---',
        'apiVersion: backstage.io/v1alpha1',
        'kind: Location',
        'metadata:',
        '  name: locations',
        'spec:',
        '  targets:',
        '    - ./catalog-info.yaml',
        '  type: path',
        '',
      ].join('\n'),
    );

    process.chdir(repoDir);
    const output = formatScanRecordsHuman(scanRepository());

    // One record per catalog file, so the tally counts each generator once.
    expect(output).toContain('Found 1 catalog-info.yaml file');
    expect(output).toContain('backstage (1)');
    expect(output).toContain('gh-docker-build (1)');
    expect(output).toContain('--all would run 2 generator invocations.');
  });
});
