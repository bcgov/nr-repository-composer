import { parseDocument } from 'yaml';
import {
  SCAN_RECORD_PREFIX,
  formatScanRecordsHeadless,
  formatScanRecordsHuman,
  toScanRecord,
  type ScanRecord,
} from './scan.js';

const doc = (yaml: string) => parseDocument(yaml);

describe('toScanRecord', () => {
  it('reads name, generators and skip flag', () => {
    const record = toScanRecord(
      doc(`
kind: Component
metadata:
  name: world
  annotations:
    composer.io.nrs.gov.bc.ca/generators: backstage,gh-maven-build
    composer.io.nrs.gov.bc.ca/skipAutomatedScan: "true"
`),
      'mod1/catalog-info.yaml',
    );

    expect(record).toEqual({
      name: 'world',
      dir: 'mod1',
      skip: true,
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
    expect(record.skip).toBe(false);
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
      name: 'components',
      dir: '.',
      skip: false,
      generators: ['backstage-location', 'gh-common-mono-build'],
    });
  });
});

describe('formatScanRecordsHeadless', () => {
  const records: ScanRecord[] = [
    { name: 'world', dir: 'mod1', skip: false, generators: ['backstage'] },
    { name: 'person', dir: 'mod2', skip: true, generators: [] },
  ];

  it('emits one prefixed, tab-separated record per component', () => {
    expect(formatScanRecordsHeadless(records).split('\n')).toEqual([
      `${SCAN_RECORD_PREFIX}\tworld\tmod1\tfalse\tbackstage`,
      `${SCAN_RECORD_PREFIX}\tperson\tmod2\ttrue\t`,
    ]);
  });

  it('returns an empty string when there is nothing to report', () => {
    expect(formatScanRecordsHeadless([])).toBe('');
  });
});

describe('formatScanRecordsHuman', () => {
  it('summarizes components and tallies generators', () => {
    const output = formatScanRecordsHuman([
      { name: 'world', dir: 'mod1', skip: false, generators: ['backstage'] },
      { name: 'person', dir: 'mod2', skip: true, generators: ['backstage'] },
    ]);

    expect(output).toContain('Found 2 components');
    expect(output).toContain('world (mod1)');
    expect(output).toContain('person (mod2) [skipAutomatedScan]');
    expect(output).toContain('backstage (2)');
  });

  it('reports when no components are found', () => {
    expect(formatScanRecordsHuman([])).toContain('No components found');
  });
});
