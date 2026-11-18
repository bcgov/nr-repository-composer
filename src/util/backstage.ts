import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_SYSTEM,
  scanRepositoryForEntities,
} from './yaml.js';
import path from 'path';

/**
 * Find the first named System in the repository's catalog scan.
 */
export function findSystemDefault(): string | undefined {
  return scanRepositoryForEntities().find(({ doc }) => {
    const name = doc.getIn(['metadata', 'name']);
    return (
      doc.get('kind') === BACKSTAGE_KIND_SYSTEM &&
      typeof name === 'string' &&
      Boolean(name.trim())
    );
  })?.name;
}

/**
 * Normalize the entered target paths, appending the catalog file name to any
 * path that does not already end with it.
 */
export function normalizeCatalogTargets(rawTargets: string): string {
  const targets = String(rawTargets ?? '')
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean);

  return targets
    .map((target) => {
      const normalized = target.endsWith(BACKSTAGE_FILENAME)
        ? target
        : path.join(target, BACKSTAGE_FILENAME);

      return normalized;
    })
    .join(',');
}
