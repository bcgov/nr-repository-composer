/**
 * Deployed-instance catalog helpers.
 *
 * An "instance" describes a deployed environment for a component, e.g. its
 * `tools`, `development`, `test`, or `production` URL. Instances are stored in
 * `catalog-info.yaml` under the `playbook.io.nrs.gov.bc.ca/instances`
 * annotation as a JSON array of `{ env, name?, url? }` objects, mirroring the way
 * `ociArtifacts` is stored and consumed.
 */

/** The well-known, standard environments offered through the prompts. */
export const STANDARD_ENVIRONMENTS = [
  'tools',
  'development',
  'test',
  'production',
] as const;

/** A single deployed instance: an environment with an optional URL. */
export interface CatalogInstance {
  env: string;
  name?: string;
  url?: string;
}

/** Resolve an instance's name, defaulting it to its environment. */
export function getInstanceName(instance: CatalogInstance): string {
  return instance.name?.trim() || instance.env;
}

/** Existing catalog values suppress instance prompts unless explicitly re-asked. */
export function shouldSkipInstancePrompts(
  storedInstances: CatalogInstance[],
  askAnswered: boolean,
): boolean {
  return storedInstances.length > 0 && !askAnswered;
}

function instanceKey(instance: CatalogInstance): string {
  return JSON.stringify([instance.env.trim(), getInstanceName(instance)]);
}

/**
 * Parse the stored `instances` value into a validated array.
 *
 * Accepts either a JSON array string (as written to the catalog) or an already
 * parsed array. Malformed entries are dropped rather than throwing, so a
 * partially-invalid annotation degrades gracefully.
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

/**
 * Pre-fill the instance prompts from a stored value.
 *
 * Used to seed `this.answers` and the per-env prompt `default`s on a re-run so
 * that previously stored instances are preserved (merge-on-rerun) and the
 * headless bail treats the transient prompt names as answered.
 *
 * @param raw - The stored `instances` value (string or array).
 * @returns `selectedEnvs` (the standard envs present) and `urlByEnv` (a lookup
 * of stored URLs by env for every stored instance).
 */
export function prefillInstancePrompts(raw: unknown): {
  selectedEnvs: string[];
  urlByEnv: Map<string, string>;
} {
  const urlByEnv = new Map<string, string>();
  for (const instance of parseInstances(raw)) {
    if (getInstanceName(instance) === instance.env) {
      urlByEnv.set(instance.env, instance.url ?? '');
    }
  }
  return {
    selectedEnvs: STANDARD_ENVIRONMENTS.filter((env) => urlByEnv.has(env)),
    urlByEnv,
  };
}

/**
 * Merge stored instances with the current run's prompt selections.
 *
 * The selected standard environments are authoritative, so unchecking a
 * standard environment removes it. Its previously stored URL is retained
 * when the environment remains selected and the URL prompt is left blank.
 * Custom environments are supplied as an editable list, so that list is
 * authoritative while remaining prefilled from the stored catalog value.
 * Instances are distinguished by `(env, effective name)`, where the
 * effective name defaults to the environment.
 *
 * @param opts.stored - Instances already in `catalog-info.yaml`.
 * @param opts.selectedEnvs - Standard environments checked this run.
 * @param opts.urlByEnv - URL values entered for standard environments this run.
 * @param opts.custom - Custom instances parsed from the free-form input.
 * @returns The merged, de-duplicated instances array.
 */
export function mergeInstances(opts: {
  stored: CatalogInstance[];
  selectedEnvs: string[];
  urlByEnv: Record<string, string>;
  custom: CatalogInstance[];
}): CatalogInstance[] {
  const storedByKey = new Map(
    opts.stored.map((instance) => [instanceKey(instance), instance]),
  );
  const byKey = new Map<string, CatalogInstance>();
  const upsert = (
    instance: CatalogInstance,
    url?: string,
    preserveStoredUrl = false,
  ) => {
    const env = instance.env.trim();
    if (!env) {
      return;
    }
    const name = getInstanceName(instance).trim();
    const normalized: CatalogInstance = { env };
    if (name && name !== env) {
      normalized.name = name;
    }
    const key = instanceKey(normalized);
    const existing =
      byKey.get(key) ?? (preserveStoredUrl ? storedByKey.get(key) : undefined);
    const nextUrl = url?.trim() || existing?.url;
    if (nextUrl) {
      normalized.url = nextUrl;
    }
    byKey.set(key, normalized);
  };
  for (const env of opts.selectedEnvs) {
    upsert({ env }, opts.urlByEnv[env] ?? '', true);
  }
  for (const custom of opts.custom) {
    upsert(custom, custom.url);
  }
  return Array.from(byKey.values());
}
