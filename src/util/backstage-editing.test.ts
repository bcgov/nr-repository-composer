import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Document } from 'yaml';
import ApiGenerator from '../backstage-api/index.js';
import InstancesGenerator from '../backstage-instances/index.js';
import { BackstageStorage } from './backstage.storage.js';
import { BackstageInstancesStorage } from '../backstage-instances/storage.js';
import { BACKSTAGE_KIND_API, BACKSTAGE_KIND_COMPONENT } from './yaml.js';
import {
  PROMPT_API_DEFINITION,
  PROMPT_API_DESCRIPTION,
  PROMPT_API_LIFECYCLE,
  PROMPT_API_NAME,
  PROMPT_API_OWNER,
  PROMPT_API_SYSTEM,
  PROMPT_API_TYPE,
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
} from './prompts.js';
import type { PromptQuestion } from 'yeoman-generator';

// Exercise the prompting lifecycle without constructing a Yeoman environment.
jest.mock('./base-generator.js', () => ({ BaseGenerator: class {} }));

describe.each(['API', 'instances'])('%s index editing', (kind) => {
  let tmpDir: string;
  let configPath: string;
  const questions =
    kind === 'API'
      ? [
          PROMPT_API_NAME,
          PROMPT_API_DESCRIPTION,
          PROMPT_API_TYPE,
          PROMPT_API_LIFECYCLE,
          PROMPT_API_OWNER,
          PROMPT_API_SYSTEM,
          PROMPT_API_DEFINITION,
        ]
      : [PROMPT_INSTANCE_ENV, PROMPT_INSTANCE_NAME, PROMPT_INSTANCE_URL];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backstage-editing-'));
    configPath = path.join(tmpDir, 'catalog-info.yaml');
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  function createStorage(count: number) {
    const entries = Array.from({ length: count }, (_, index) => ({
      name: `entry-${index}`,
      url: `https://entry-${index}.example.gov.bc.ca`,
    }));
    const docs =
      kind === 'API'
        ? entries.map(
            (entry) =>
              new Document({
                apiVersion: 'backstage.io/v1alpha1',
                kind: BACKSTAGE_KIND_API,
                metadata: { name: entry.name },
                spec: {
                  type: 'openapi',
                  lifecycle: 'production',
                  owner: 'my-team',
                  definition: 'openapi: 3.0.0',
                },
              }),
          )
        : [
            new Document({
              apiVersion: 'backstage.io/v1alpha1',
              kind: BACKSTAGE_KIND_COMPONENT,
              metadata: {
                name: 'my-service',
                links: entries.map((entry) => ({
                  type: 'instance',
                  env: 'production',
                  title: entry.name,
                  url: entry.url,
                })),
              },
            }),
          ];
    fs.writeFileSync(
      configPath,
      docs.map((doc) => doc.toString()).join('\n---\n'),
    );
    return kind === 'API'
      ? new BackstageStorage('test', BACKSTAGE_KIND_API, undefined, configPath)
      : new BackstageInstancesStorage(
          'test',
          BACKSTAGE_KIND_COMPONENT,
          undefined,
          configPath,
        );
  }

  function run(
    storage: BackstageStorage,
    options: Record<string, unknown>,
    nextAnswers: boolean[] = [],
  ) {
    let edits = 0;
    const prompt = jest.fn(async (prompts: PromptQuestion[]) => {
      if (prompts[0].name === 'next') {
        return { next: nextAnswers.shift() ?? false };
      }
      edits += 1;
      const answers =
        kind === 'API'
          ? {
              apiName: `new-${edits}`,
              apiDescription: '',
              apiType: 'openapi',
              apiLifecycle: 'production',
              apiOwner: 'my-team',
              apiSystem: '',
              apiDefinition: 'openapi: 3.0.0',
            }
          : {
              instanceEnv: 'production',
              instanceName: `new-${edits}`,
              instanceUrl: `https://new-${edits}.example.gov.bc.ca`,
            };
      storage.set('promptValues', answers);
      return answers;
    });
    const context = {
      backstageConfig: storage,
      options,
      _questions: questions,
      _printIntro: jest.fn(),
      _postPrompt: jest.fn(),
      prompt,
      log: jest.fn(),
    };
    const generator = kind === 'API' ? ApiGenerator : InstancesGenerator;
    return { completion: generator.prototype.prompting.call(context), prompt };
  }

  it.each([false, true])(
    'advances --ask-answered from zero (add another: %s)',
    async (addAnother) => {
      const storage = createStorage(3);
      const select =
        storage instanceof BackstageInstancesStorage
          ? jest.spyOn(storage, 'selectInstanceLink')
          : jest.spyOn(storage, 'selectKindDoc');
      const { completion, prompt } = run(storage, { 'ask-answered': true }, [
        addAnother,
        false,
      ]);
      await completion;

      const count = addAnother ? 4 : 3;
      expect(select).toHaveBeenCalledTimes(count);
      for (let index = 0; index < count; index += 1) {
        expect(select.mock.calls[index]).toEqual(
          kind === 'API' ? [BACKSTAGE_KIND_API, index] : [index],
        );
      }
      expect(prompt).toHaveBeenCalledTimes(addAnother ? 6 : 4);
      expect(prompt.mock.calls[3][0][0].name).toBe('next');
      const names =
        storage instanceof BackstageInstancesStorage
          ? storage.getInstanceLinks().map((instance) => instance.name)
          : storage
              .kindDocs(BACKSTAGE_KIND_API)
              .map((doc) => doc.getIn(['metadata', 'name']));
      expect(names).toEqual(
        Array.from({ length: count }, (_, index) => `new-${index + 1}`),
      );
    },
  );

  if (kind === 'API') {
    it('rejects API names already used in the selected namespace', async () => {
      const storage = createStorage(3);
      const docs = storage.kindDocs(BACKSTAGE_KIND_API);
      docs[0].setIn(['metadata', 'namespace'], 'team-a');
      docs[1].setIn(['metadata', 'namespace'], 'team-a');
      docs[2].setIn(['metadata', 'namespace'], 'team-b');

      const { completion, prompt } = run(storage, {
        index: 0,
        'ask-answered': true,
      });
      await completion;

      const apiNameQuestion = prompt.mock.calls[0][0].find(
        (question) =>
          typeof question === 'object' && question.name === 'apiName',
      );
      expect(apiNameQuestion?.validate?.('entry-1')).toBe(
        'An API named "entry-1" already exists in namespace "team-a".',
      );
      expect(apiNameQuestion?.validate?.('entry-0')).toBe(true);
      expect(apiNameQuestion?.validate?.('entry-2')).toBe(true);
      expect(apiNameQuestion?.validate?.('new-name')).toBe(true);
    });

    it('uses the default namespace when checking API names', async () => {
      const storage = createStorage(2);
      const { completion, prompt } = run(storage, { index: -1 });
      await completion;

      const apiNameQuestion = prompt.mock.calls[0][0].find(
        (question) =>
          typeof question === 'object' && question.name === 'apiName',
      );
      expect(apiNameQuestion?.validate?.('entry-0')).toBe(
        'An API named "entry-0" already exists in namespace "default".',
      );
    });
  }

  it.each([
    { index: 0 },
    { index: 1 },
    { index: 0, 'ask-answered': true },
    { index: 1, 'ask-answered': true },
  ])('processes only the existing index with %j', async (options) => {
    const storage = createStorage(3);
    const documents = () =>
      kind === 'API' ? storage.kindDocs(BACKSTAGE_KIND_API) : storage.docs;
    const before = documents().map((doc) => doc.toString());
    const select =
      storage instanceof BackstageInstancesStorage
        ? jest.spyOn(storage, 'selectInstanceLink')
        : jest.spyOn(storage, 'selectKindDoc');
    const { completion, prompt } = run(storage, options);
    await completion;

    expect(select).toHaveBeenCalledTimes(1);
    const edited = options['ask-answered'] === true;
    expect(prompt).toHaveBeenCalledTimes(edited ? 1 : 0);
    const after = documents().map((doc) => doc.toString());
    if (!edited) {
      expect(after).toEqual(before);
    } else if (kind === 'API') {
      expect(documents()[options.index].getIn(['metadata', 'name'])).toBe(
        'new-1',
      );
      before.forEach((doc, index) => {
        if (index !== options.index) {
          expect(after[index]).toBe(doc);
        }
      });
    } else {
      const links = storage.doc.toJSON().metadata.links;
      links.forEach((link: { title: string }, index: number) => {
        expect(link.title).toBe(
          index === options.index ? 'new-1' : `entry-${index}`,
        );
      });
    }
  });

  if (kind === 'instances') {
    it('prompts for missing values in later instances on an unindexed rerun', async () => {
      const storage = createStorage(3) as BackstageInstancesStorage;
      const links = storage.doc.toJSON().metadata.links;
      delete links[1].url;
      storage.doc.setIn(['metadata', 'links'], links);
      const select = jest.spyOn(storage, 'selectInstanceLink');
      const { completion, prompt } = run(storage, {});

      await completion;

      expect(select.mock.calls).toEqual([[0], [1], [2]]);
      expect(prompt).toHaveBeenCalledTimes(1);
      expect(storage.getInstanceLinks()[1].url).toBe(
        'https://new-1.example.gov.bc.ca',
      );
    });
  } else {
    it('prompts for missing values in later APIs on an unindexed rerun', async () => {
      const storage = createStorage(3);
      const docs = storage.kindDocs(BACKSTAGE_KIND_API);
      docs[1].deleteIn(['spec', 'owner']);
      const select = jest.spyOn(storage, 'selectKindDoc');
      const { completion, prompt } = run(storage, {});

      await completion;

      expect(select.mock.calls).toEqual([
        [BACKSTAGE_KIND_API, 0],
        [BACKSTAGE_KIND_API, 1],
        [BACKSTAGE_KIND_API, 2],
      ]);
      expect(prompt).toHaveBeenCalledTimes(1);
      expect(docs[1].getIn(['spec', 'owner'])).toBe('my-team');
    });
  }

  it.each([
    { count: 0, index: 0 },
    { count: 0, index: -1 },
    { count: 2, index: 2 },
    { count: 2, index: -1 },
  ])('retains add-another prompting with %j', async ({ count, index }) => {
    const storage = createStorage(count);
    const { completion, prompt } = run(storage, { index }, [true, false]);
    await completion;

    expect(prompt).toHaveBeenCalledTimes(4);
    expect(prompt.mock.calls[1][0][0].name).toBe('next');
    expect(prompt.mock.calls[3][0][0].name).toBe('next');
    const entryCount =
      storage instanceof BackstageInstancesStorage
        ? storage.getInstanceLinks().length
        : storage.kindDocs(BACKSTAGE_KIND_API).length;
    expect(entryCount).toBe(count + 2);
  });

  it('processes every existing entry in headless mode', async () => {
    const storage = createStorage(3);
    const before = storage.docs.map((doc) => doc.toString());
    const select =
      storage instanceof BackstageInstancesStorage
        ? jest.spyOn(storage, 'selectInstanceLink')
        : jest.spyOn(storage, 'selectKindDoc');
    const { completion, prompt } = run(storage, { headless: true });
    await completion;
    expect(select).toHaveBeenCalledTimes(3);
    expect(prompt).not.toHaveBeenCalled();
    expect(storage.docs.map((doc) => doc.toString())).toEqual(before);
  });

  it.each([0, 1, -1])('rejects headless --index %s', async (index) => {
    const storage = createStorage(3);
    const { completion, prompt } = run(storage, { headless: true, index });
    await expect(completion).rejects.toThrow(
      '--index cannot be used with --headless',
    );
    expect(prompt).not.toHaveBeenCalled();
  });

  it('fails headless validation when a later entry is incomplete', async () => {
    const storage = createStorage(3);
    if (storage instanceof BackstageInstancesStorage) {
      const links = storage.doc.toJSON().metadata.links;
      delete links[2].url;
      storage.doc.setIn(['metadata', 'links'], links);
    } else {
      storage.kindDocs(BACKSTAGE_KIND_API)[2].deleteIn(['spec', 'owner']);
    }
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('headless validation failed');
    });
    const { completion, prompt } = run(storage, { headless: true });
    await expect(completion).rejects.toThrow('headless validation failed');
    expect(exit).toHaveBeenCalledWith(1);
    expect(prompt).not.toHaveBeenCalled();
  });

  it.each([
    { count: 0, index: 1 },
    { count: 2, index: 3 },
    { count: 2, index: -2 },
    { count: 2, index: 0.5 },
    { count: 2, index: NaN },
    { count: 2, index: Infinity },
  ])(
    'validates the index before selection with %j',
    async ({ count, index }) => {
      const storage = createStorage(count);
      const before = storage.docs.map((doc) => doc.toString());
      const select =
        storage instanceof BackstageInstancesStorage
          ? jest.spyOn(storage, 'selectInstanceLink')
          : jest.spyOn(storage, 'selectKindDoc');
      const { completion, prompt } = run(storage, { index });
      await expect(completion).rejects.toThrow(/out of range/);
      expect(select).not.toHaveBeenCalled();
      expect(prompt).not.toHaveBeenCalled();
      expect(storage.docs.map((doc) => doc.toString())).toEqual(before);
    },
  );
});
