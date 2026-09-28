import path from 'path';
import type { Document } from 'yaml';
import {
  BACKSTAGE_GENERATOR_PATH,
  BACKSTAGE_SKIP_SCAN_PATH,
  scanRepositoryForComponents,
} from './yaml.js';

/**
 * A single component's composer summary.
 */
export interface ScanRecord {
  /** metadata.name of the component */
  name: string;
  /** Directory holding the catalog file, relative to the git root ('.' at root) */
  dir: string;
  /** True when composer.io.nrs.gov.bc.ca/skipAutomatedScan is set */
  skip: boolean;
  /** Generators recorded in composer.io.nrs.gov.bc.ca/generators */
  generators: string[];
}

/**
 * Leading token on every machine-readable record so consumers can ignore
 * unrelated output (container pull progress, warnings) with a simple match.
 */
export const SCAN_RECORD_PREFIX = 'COMPONENT';

const stripTabs = (value: string) => value.replace(/[\t\r\n]+/g, ' ').trim();

/**
 * Read the composer annotations off a parsed catalog document.
 *
 * @param doc Parsed catalog-info.yaml document
 * @param catalogRelativePath Catalog file path relative to the git root
 */
export function toScanRecord(
  doc: Document,
  catalogRelativePath: string,
): ScanRecord {
  const rawGenerators = doc.getIn(BACKSTAGE_GENERATOR_PATH);
  const generators =
    typeof rawGenerators === 'string'
      ? rawGenerators
          .split(',')
          .map((generator) => stripTabs(generator))
          .filter(Boolean)
      : [];

  const rawSkip = doc.getIn(BACKSTAGE_SKIP_SCAN_PATH);
  const name = doc.getIn(['metadata', 'name']);

  return {
    name: name ? stripTabs(String(name)) : 'unknown',
    dir: path.dirname(catalogRelativePath) || '.',
    skip: String(rawSkip) === 'true',
    generators,
  };
}

/**
 * Summarize every component reachable from the repository's root catalog file.
 */
export function scanRepository(): ScanRecord[] {
  return scanRepositoryForComponents().map((component) =>
    toScanRecord(component.doc, component.path),
  );
}

/**
 * Tab-separated records for consumption by scripts.
 *
 * Layout: `COMPONENT<TAB>name<TAB>dir<TAB>skip<TAB>generators-csv`
 */
export function formatScanRecordsHeadless(records: ScanRecord[]): string {
  return records
    .map((record) =>
      [
        SCAN_RECORD_PREFIX,
        record.name,
        record.dir,
        record.skip ? 'true' : 'false',
        record.generators.join(','),
      ].join('\t'),
    )
    .join('\n');
}

/**
 * Human-readable summary of the composers recorded in the repository.
 */
export function formatScanRecordsHuman(records: ScanRecord[]): string {
  if (records.length === 0) {
    return 'No components found. Is there a catalog-info.yaml at the repository root?';
  }

  const lines: string[] = [];
  lines.push(
    `Found ${records.length} component${records.length === 1 ? '' : 's'}:`,
  );
  lines.push('');

  for (const record of records) {
    const flags = record.skip ? ' [skipAutomatedScan]' : '';
    lines.push(`  ${record.name} (${record.dir})${flags}`);
    lines.push(
      record.generators.length > 0
        ? `    generators: ${record.generators.join(', ')}`
        : '    generators: (none recorded)',
    );
  }

  const tally = new Map<string, number>();
  for (const record of records) {
    for (const generator of record.generators) {
      tally.set(generator, (tally.get(generator) ?? 0) + 1);
    }
  }

  lines.push('');
  if (tally.size === 0) {
    lines.push('No generators recorded in this repository.');
  } else {
    lines.push('Generators in use:');
    for (const [generator, count] of [...tally.entries()].sort()) {
      lines.push(`  ${generator} (${count})`);
    }
  }

  return lines.join('\n');
}
