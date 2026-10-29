/**
 * Deployed-instance catalog helpers.
 *
 * An "instance" describes a deployed environment for a component, e.g. its
 * `tools`, `development`, `test`, or `production` URL. Each instance is stored
 * as an entry in the Component's standard `metadata.links` array.
 */

/** The well-known, standard environments offered through the prompts. */
export const STANDARD_ENVIRONMENTS = [
  'tools',
  'development',
  'test',
  'production',
] as const;

/** A deployed environment link. */
export interface CatalogInstance {
  env: string;
  name?: string;
  url?: string;
}
/** Resolve an instance's name, defaulting it to its environment. */
export function getInstanceName(instance: CatalogInstance): string {
  return instance.name?.trim() || instance.env;
}

/**
 * Parse a legacy stored `instances` value into a validated array.
 *
 * Accepts either a JSON array string (as formerly written to the catalog) or an
 * already parsed array. Malformed entries are dropped rather than throwing, so
 * a partially-invalid value degrades gracefully.
 *
 * @param raw - The stored value (string or array), or undefined/null.
 * @returns A clean array of `{ env, name?, url? }` objects.
 */
export function parseInstances(raw: unknown): CatalogInstance[] {
  let entries: unknown;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    try {
      entries = JSON.parse(trimmed);
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    entries = raw;
  } else {
    return [];
  }
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).env === 'string' &&
        ((item as Record<string, unknown>).name === undefined ||
          typeof (item as Record<string, unknown>).name === 'string'),
    )
    .map((item) => {
      const env = (item.env as string).trim();
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const instance: CatalogInstance = { env };
      if (name && name !== env) {
        instance.name = name;
      }
      if (typeof item.url === 'string' && item.url.trim()) {
        instance.url = item.url.trim();
      }
      return instance;
    })
    .filter((item) => item.env.trim() !== '');
}
