import { parseDocument } from 'yaml';
import {
  formatScanRecordsHeadless,
  formatScanRecordsHuman,
  toScanRecord,
  type ScanRecord,
} from './scan.js';

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
    expect(output).toContain(
      './mod1/catalog-info.yaml\n    Component: world',
    );
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
