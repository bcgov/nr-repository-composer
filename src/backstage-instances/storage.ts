import { isSeq } from 'yaml';
import { BackstageStorage } from '../util/backstage.storage.js';
import {
  STANDARD_ENVIRONMENTS,
  type CatalogInstance,
} from '../util/instances.js';
import {
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
} from '../util/prompts.js';

const INSTANCE_LINK_FIELDS: Record<string, string> = {
  [PROMPT_INSTANCE_ENV.name]: 'type',
  [PROMPT_INSTANCE_NAME.name]: 'title',
  [PROMPT_INSTANCE_URL.name]: 'url',
};

export class BackstageInstancesStorage extends BackstageStorage {
  private instanceLinkIndex?: number;

  /** Deployed environment links, in their current catalog order. */
  getInstanceLinks(): CatalogInstance[] {
    const links = this.readLinks();
    return this.instanceLinkIndexes(links).map((index) => {
      const link = links[index];
      const instance: CatalogInstance = { env: String(link.type) };
      if (typeof link.title === 'string') {
        instance.name = link.title;
      }
      if (typeof link.url === 'string') {
        instance.url = link.url;
      }
      return instance;
    });
  }

  /** Select a deployed-environment link by its zero-based instance index. */
  selectInstanceLink(index: number) {
    const count = this.getInstanceLinks().length;
    if (!Number.isInteger(index) || index < 0 || index > count) {
      throw new Error(
        `Instance index ${index} is out of range: ${count} instance link(s) exist.`,
      );
    }
    this.instanceLinkIndex = index;
  }

  override getAnswers(): Record<string, unknown> {
    const answers: Record<string, unknown> = {};
    for (const name of Object.keys(INSTANCE_LINK_FIELDS)) {
      const value = this.getLinkPrompt(name);
      if (value !== undefined) {
        answers[name] = value;
      }
    }
    return answers;
  }

  override getPath(path: string | string[], option = ''): unknown {
    if (typeof path === 'string' && INSTANCE_LINK_FIELDS[path]) {
      return this.getLinkPrompt(path);
    }
    return super.getPath(path, option);
  }

  override get(key: string): unknown {
    if (key === 'promptValues') {
      return this.getAnswers();
    }
    if (INSTANCE_LINK_FIELDS[key]) {
      return this.getLinkPrompt(key);
    }
    return super.get(key);
  }

  override set(key: string, value: unknown) {
    if (key === 'promptValues') {
      for (const [name, answer] of Object.entries(
        (value ?? {}) as Record<string, unknown>,
      )) {
        this.set(name, answer);
      }
      return;
    }
    if (INSTANCE_LINK_FIELDS[key]) {
      this.setLinkPrompt(key, value);
      return;
    }
    super.set(key, value);
  }

  override setPath(path: string | string[], value: unknown) {
    if (typeof path === 'string' && INSTANCE_LINK_FIELDS[path]) {
      this.set(path, value);
      return;
    }
    super.setPath(path, value);
  }

  private getLinkPrompt(name: string): unknown {
    const link = this.selectedInstanceLink();
    if (!link) {
      return undefined;
    }
    const value = link[INSTANCE_LINK_FIELDS[name]];
    if (value !== undefined) {
      return value;
    }
    return name === PROMPT_INSTANCE_URL.name ? undefined : '';
  }

  private setLinkPrompt(name: string, value: unknown) {
    const field = INSTANCE_LINK_FIELDS[name];
    const trimmed = typeof value === 'string' ? value.trim() : value;
    const links = this.readLinks();
    const linkIndexes = this.instanceLinkIndexes(links);
    const actualIndex = linkIndexes[this.instanceLinkIndex!];
    const targetIndex = actualIndex ?? links.length;
    const link = links[targetIndex] ?? {};
    if (trimmed === null || trimmed === undefined || trimmed === '') {
      if (field === 'title' && typeof link.type === 'string') {
        link.title = link.type;
      } else {
        delete link[field];
      }
    } else {
      link[field] = trimmed;
    }
    links[targetIndex] = link;
    this.doc.setIn(['metadata', 'links'], links);
  }

  private readLinks(): Record<string, unknown>[] {
    const stored = this.doc.getIn(['metadata', 'links']);
    const links = isSeq(stored) ? stored.toJSON() : stored;
    return Array.isArray(links)
      ? links.filter(
          (link): link is Record<string, unknown> =>
            typeof link === 'object' && link !== null && !Array.isArray(link),
        )
      : [];
  }

  private instanceLinkIndexes(links = this.readLinks()): number[] {
    return links.flatMap((link, index) =>
      typeof link.type === 'string' &&
      (STANDARD_ENVIRONMENTS as readonly string[]).includes(link.type)
        ? [index]
        : [],
    );
  }

  private selectedInstanceLink(): Record<string, unknown> | undefined {
    if (this.instanceLinkIndex === undefined) {
      return undefined;
    }
    const links = this.readLinks();
    const actualIndex = this.instanceLinkIndexes(links)[this.instanceLinkIndex];
    return actualIndex === undefined ? undefined : links[actualIndex];
  }
}
