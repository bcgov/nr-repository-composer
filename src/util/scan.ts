import path from 'path';
import type { Document } from 'yaml';
import {
  BACKSTAGE_GENERATOR_PATH,
  scanRepositoryForComponents,
} from './yaml.js';

/**
 * A single component's composer summary.
 */
export interface ScanRecord {
  /** Backstage kind of the catalog document */
  kind: string;
  /** metadata.name of the component */
  name: string;
  /** Directory holding the catalog file, relative to the git root ('.' at root) */
  dir: string;
  /** Parent catalog path, relative to the git root, when reached from a Location */
  parentPath?: string;
  /** Generators recorded in composer.io.nrs.gov.bc.ca/generators */
  generators: string[];
}

const stripTabs = (value: string) => value.replace(/[\t\r\n]+/g, ' ').trim();

const formatCatalogPath = (catalogPath: string) =>
  catalogPath === 'catalog-info.yaml'
    ? './catalog-info.yaml'
    : `./${catalogPath}`;

/**
 * Read the composer annotations off a parsed catalog document.
 *
 * @param doc Parsed catalog-info.yaml document
 * @param catalogRelativePath Catalog file path relative to the git root
 */
export function toScanRecord(
  doc: Document,
  catalogRelativePath: string,
  parentPath?: string,
): ScanRecord {
  const rawGenerators = doc.getIn(BACKSTAGE_GENERATOR_PATH);
  const generators =
    typeof rawGenerators === 'string'
      ? rawGenerators
          .split(',')
          .map((generator) => stripTabs(generator))
          .filter(Boolean)
      : [];

  const name = doc.getIn(['metadata', 'name']);
  const kind = doc.get('kind');

  return {
    kind: kind ? stripTabs(String(kind)) : 'unknown',
    name: name ? stripTabs(String(name)) : 'unknown',
    dir: path.dirname(catalogRelativePath) || '.',
    parentPath,
    generators,
  };
}

/**
 * Summarize every catalog reachable from the repository's root catalog file,
 * including Location catalogs.
 */
export function scanRepository(): ScanRecord[] {
  return scanRepositoryForComponents(undefined, true).map((component) =>
    toScanRecord(component.doc, component.path, component.parentPath),
  );
}

/**
 * Tab-separated records for consumption by scripts.
 *
 * Layout: `kind<TAB>dir<TAB>name<TAB>generators-csv`
 */
export function formatScanRecordsHeadless(records: ScanRecord[]): string {
  return records
    .map((record) =>
      [record.kind, record.dir, record.name, record.generators.join(',')].join(
        '\t',
      ),
    )
    .join('\n');
}

/**
 * Human-readable catalog summary, including each Location parent relationship.
 */
export function formatScanRecordsHuman(records: ScanRecord[]): string {
  if (records.length === 0) {
    return 'No catalog-info.yaml files found. Is there one at the repository root?';
  }

  const lines: string[] = [];
  lines.push(
    `Found ${records.length} catalog-info.yaml file${records.length === 1 ? '' : 's'}:`,
  );
  lines.push('');

  const depths = new Map<string, number>();
  for (const record of records) {
    const catalogPath = path.join(record.dir, 'catalog-info.yaml');
    const depth = record.parentPath
      ? (depths.get(record.parentPath) ?? 0) + 1
      : 0;
    const indent = '  '.repeat(depth);
    depths.set(catalogPath, depth);

    lines.push(`${indent}${formatCatalogPath(catalogPath)}`);
    lines.push(`${indent}  ${record.kind}: ${record.name}`);
    lines.push(
      record.generators.length > 0
        ? `${indent}  generators: ${record.generators.join(', ')}`
        : `${indent}  generators: (none recorded)`,
    );
    lines.push('');
  }

  const tally = new Map<string, number>();
  for (const record of records) {
    for (const generator of record.generators) {
      tally.set(generator, (tally.get(generator) ?? 0) + 1);
    }
  }

  if (tally.size === 0) {
    lines.push('No generators recorded in this repository.');
  } else {
    lines.push('Configured generators:');
    for (const [generator, count] of [...tally.entries()].sort()) {
      lines.push(`  ${generator} (${count})`);
    }
    lines.push('');
    lines.push(
      `--all would run ${[...tally.values()].reduce((total, count) => total + count, 0)} generator invocation${[...tally.values()].reduce((total, count) => total + count, 0) === 1 ? '' : 's'}.`,
    );
  }

  return lines.join('\n');
}
