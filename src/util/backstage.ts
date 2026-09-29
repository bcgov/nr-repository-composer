import { BACKSTAGE_FILENAME } from './yaml.js';
import path from 'path';

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
