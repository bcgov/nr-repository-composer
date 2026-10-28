import * as fs from 'fs';
import { Document, isMap, isSeq } from 'yaml';
import { PromptQuestion } from 'yeoman-generator';
import {
  BACKSTAGE_API_VERSION,
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_API,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
  BACKSTAGE_KIND_NRCOMPOSER,
  NRCOMPOSER_ANSWERS_PATH,
  NRCOMPOSER_API_VERSION,
  addGeneratorToDoc,
  hasGeneratorInDoc,
  hasNrcomposerContent,
  extractFromYaml,
  isDocumentProp,
  newNrcomposerDoc,
  composerPathFor,
  loadCatalogFiles,
  propRecord,
  pathToProps,
} from './yaml.js';

const MULTI_DOCUMENT_KINDS: Record<
  string,
  {
    required: string[];
    requiredPrompts: string[];
    prompts: Record<string, string[]>;
  }
> = {
  [BACKSTAGE_KIND_API]: {
    required: ['spec', 'definition'],
    requiredPrompts: [
      'apiName',
      'apiType',
      'apiLifecycle',
      'apiOwner',
      'apiDefinition',
    ],
    prompts: {
      apiName: ['metadata', 'name'],
      apiDescription: ['metadata', 'description'],
      apiType: ['spec', 'type'],
      apiLifecycle: ['spec', 'lifecycle'],
      apiOwner: ['spec', 'owner'],
      apiSystem: ['spec', 'system'],
      apiDefinition: ['spec', 'definition'],
    },
  },
};

// The generator that creates each catalog entity kind.
const KIND_GENERATORS: Record<string, string> = {
  [BACKSTAGE_KIND_API]: 'backstage-api',
  [BACKSTAGE_KIND_COMPONENT]: 'backstage',
  [BACKSTAGE_KIND_LOCATION]: 'backstage-location',
};

export class BackstageStorage {
  private path: string;
  private name: string;
  // The catalog file may hold several YAML documents separated by the `---`
  // delimiter. On load every entity document is paired with a NRComposer
  // document (created if missing) carrying its composer bookkeeping, so reads
  // only need `backstageDoc` and its `composerDoc`. All documents are kept so
  // a save writes the whole multi-document file back.
  private backstageDocs: Document[] = [];
  private backstageDoc!: Document;
  private composerDoc!: Document;

  constructor(
    name: string,
    kind: string,
    metadataName: string | undefined,
    configPath: string,
  ) {
    this.path = configPath;
    this.name = name;

    const { docs, entities } = loadCatalogFiles(this.path);
    this.backstageDocs = docs;

    // API descriptors may appear more than once in a catalog file.
    const kinds = docs
      .filter((doc) => doc.contents)
      .map((doc) => String(doc.get('kind')));
    const duplicate = kinds.find(
      (kind, index) =>
        !MULTI_DOCUMENT_KINDS[kind] && kinds.indexOf(kind) !== index,
    );
    if (duplicate) {
      throw new Error(
        `Backstage catalog ${this.path} has more than one "${duplicate}" document; only one document per kind is supported.`,
      );
    }

    if (kind === BACKSTAGE_KIND_NRCOMPOSER) {
      // This instance *is* the composer document.
      this.backstageDoc =
        docs.find((doc) => doc.contents && doc.get('kind') === kind) ??
        this.appendDocument(kind);
      this.composerDoc = this.backstageDoc;
      return;
    }

    let entity = entities.find((e) => e.doc.get('kind') === kind);
    if (!entity) {
      const doc = this.appendDocument(kind, metadataName);
      // The file's NRComposer is shared by all of its entities.
      let composerDoc = entities[0]?.composerDoc;
      if (!composerDoc) {
        composerDoc = newNrcomposerDoc();
        this.backstageDocs.push(composerDoc);
      }
      entity = { doc, composerDoc };
    }
    this.backstageDoc = entity.doc;
    this.composerDoc = entity.composerDoc;
  }

  /** Build (without registering) a fresh document carrying the standard header. */
  private newKindDoc(kind: string, metadataName?: string): Document {
    const doc = new Document();
    doc.setIn(
      ['apiVersion'],
      kind === BACKSTAGE_KIND_NRCOMPOSER
        ? NRCOMPOSER_API_VERSION
        : BACKSTAGE_API_VERSION,
    );
    doc.setIn(['kind'], kind);
    if (metadataName) {
      doc.setIn(['metadata', 'name'], metadataName);
    }
    return doc;
  }

  /**
   * Create and register a fresh document at the end of the catalog, carrying the
   * standard Backstage header.
   */
  private appendDocument(kind: string, metadataName?: string): Document {
    const doc = this.newKindDoc(kind, metadataName);
    this.backstageDocs.push(doc);
    return doc;
  }

  /** The documents of a kind held in this catalog file, in file order. */
  kindDocs(kind: string): Document[] {
    return this.backstageDocs.filter(
      (doc) => doc.contents && doc.get('kind') === kind,
    );
  }

  /**
   * The document of a kind. An index equal to the current count creates it.
   */
  kindDoc(kind: string, index: number): Document {
    const docs = this.kindDocs(kind);
    const max = MULTI_DOCUMENT_KINDS[kind] ? docs.length : 0;
    if (!Number.isInteger(index) || index < 0 || index > max) {
      throw new Error(
        `${kind} index ${index} is out of range: ${docs.length} ${kind} document(s) exist.`,
      );
    }
    if (index < docs.length) {
      return docs[index];
    }
    // Insert after the last document of this kind (or the composer document).
    const doc = this.newKindDoc(kind);
    const after = docs[docs.length - 1] ?? this.composerDoc;
    const position = this.backstageDocs.indexOf(after);
    this.backstageDocs.splice(
      position === -1 ? this.backstageDocs.length : position + 1,
      0,
      doc,
    );
    return doc;
  }

  /**
   * Make the nth (zero-based) document of a kind the one this storage reads
   * and writes, creating it when the index equals the current count (see
   * `kindDoc`).
   */
  selectKindDoc(kind: string, index: number): Document {
    this.backstageDoc = this.kindDoc(kind, index);
    return this.backstageDoc;
  }

  /**
   * The catalog's document of a kind, which must already have been created
   * (named) by the generator that owns the kind.
   *
   * @throws When the catalog has no named document of the kind.
   */
  ensureKindExists(kind: string): Document {
    const [doc] = this.kindDocs(kind);
    const name = doc?.getIn(['metadata', 'name']);
    if (typeof name !== 'string' || !name) {
      const owner = KIND_GENERATORS[kind];
      throw new Error(
        `No ${kind} found in ${BACKSTAGE_FILENAME}.${owner ? ` Run the ${owner} generator first.` : ''}`,
      );
    }
    return doc;
  }

  /**
   * Read the catalog values for a list of prompts from a document of a kind.
   *
   * Each prompt's value is looked up at the catalog path its `name` maps to in
   * `propRecord` (the same mapping the storage layer uses), so a caller can pull
   * values that live on the entity document — and are therefore not prompt
   * answers — without hard-coding the path. Unmapped prompts are skipped.
   *
   * @param kind The document kind to read (e.g. BACKSTAGE_KIND_COMPONENT).
   * @param prompts The prompts whose catalog values to extract; each prompt's
   *   `name` selects the path.
   * @returns A map of the extracted prompt names to their string values.
   */
  extractPromptValues(
    kind: string,
    ...prompts: PromptQuestion[]
  ): Record<string, string> {
    const doc = this.ensureKindExists(kind);
    const values: Record<string, string> = {};
    for (const prompt of prompts) {
      const pathToProp = propRecord[prompt.name];
      if (pathToProp) {
        values[prompt.name] = String(doc.getIn(pathToProp.path) ?? '');
      }
    }
    return values;
  }

  get doc() {
    return this.backstageDoc;
  }

  /**
   * The mapping of a prompt whose value is written directly to the entity
   * document, so it is read from there rather than the NRComposer answers.
   */
  private documentProp(key: string) {
    const pathToProp = propRecord[key];
    return pathToProp &&
      isDocumentProp(pathToProp) &&
      this.backstageDoc !== this.composerDoc
      ? pathToProp
      : undefined;
  }

  /** Prompt fields stored on the selected repeated kind document. */
  private get docPrompts() {
    return MULTI_DOCUMENT_KINDS[String(this.backstageDoc.get('kind'))]?.prompts;
  }

  private getDocPrompt(name: string): unknown {
    const config = MULTI_DOCUMENT_KINDS[String(this.backstageDoc.get('kind'))];
    const path = config?.prompts[name];
    if (!path) {
      return undefined;
    }
    const value = this.backstageDoc.getIn(path);
    if (value !== undefined) {
      return value;
    }
    if (config.requiredPrompts.includes(name)) {
      return undefined;
    }
    return this.backstageDoc.hasIn(config.required) ? '' : undefined;
  }

  private setDocPrompt(name: string, value: unknown) {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    const path =
      MULTI_DOCUMENT_KINDS[String(this.backstageDoc.get('kind'))]?.prompts[
        name
      ];
    if (!path) {
      return;
    }
    if (trimmed === null || trimmed === undefined || trimmed === '') {
      this.backstageDoc.deleteIn(path);
    } else {
      this.backstageDoc.setIn(path, trimmed);
    }
  }

  /**
   * The dedicated NRComposer document carrying this entity's composer
   * bookkeeping (`spec.generators`, `spec.skipAutomatedScan`, `spec.answers`).
   */
  get composer(): Document {
    return this.composerDoc;
  }

  /**
   * Every document currently held for this catalog file. Useful when a caller
   * needs to inspect or persist kinds other than this instance's own.
   */
  get docs(): Document[] {
    return this.backstageDocs;
  }

  getAnswers() {
    if (this.docPrompts) {
      const answers: Record<string, unknown> = {};
      for (const name of Object.keys(this.docPrompts)) {
        const value = this.getDocPrompt(name);
        if (value !== undefined) {
          answers[name] = value;
        }
      }
      return answers;
    }
    const answers: Record<string, unknown> = {};
    const storedAnswers = this.composerDoc.getIn(NRCOMPOSER_ANSWERS_PATH);
    if (isMap(storedAnswers)) {
      Object.assign(answers, storedAnswers.toJSON());
    }
    const documentProps = pathToProps.filter((pathToProp) =>
      this.documentProp(pathToProp.prop),
    );
    for (const pathToProp of documentProps) {
      delete answers[pathToProp.prop];
    }
    return Object.assign(
      answers,
      extractFromYaml(this.backstageDoc, documentProps),
    );
  }

  addGeneratorToDoc(generator: string) {
    addGeneratorToDoc(this.composerDoc, generator);
  }

  hasGenerator(generator: string): boolean {
    return hasGeneratorInDoc(this.composerDoc, generator);
  }

  save() {
    console.log(`Saving backstage document to ${this.path}`);
    // Always split: entity documents go to catalog-info.yaml (written even
    // when empty, as a placeholder) and the NRComposer document goes to
    // catalog-composer.yaml.
    const toYaml = (docs: Document[]) =>
      docs.map((doc) => doc.toString({ directives: false })).join('\n---\n');
    const populated = this.backstageDocs.filter((doc) => doc.contents);
    const isComposer = (doc: Document) =>
      doc.get('kind') === BACKSTAGE_KIND_NRCOMPOSER;
    fs.writeFileSync(
      this.path,
      toYaml(populated.filter((d) => !isComposer(d))),
    );
    const composerDocs = populated.filter(
      (doc) => isComposer(doc) && hasNrcomposerContent(doc),
    );
    if (composerDocs.length > 0) {
      fs.writeFileSync(composerPathFor(this.path), toYaml(composerDocs));
    }
  }

  getPath(path: string | string[], option = ''): unknown {
    if (typeof path === 'string' && this.docPrompts) {
      return this.docPrompts[path] ? this.getDocPrompt(path) : undefined;
    }
    if (
      typeof path === 'string' &&
      !this.documentProp(path) &&
      this.composerDoc.hasIn([...NRCOMPOSER_ANSWERS_PATH, path])
    ) {
      return this.composerDoc.getIn([...NRCOMPOSER_ANSWERS_PATH, path]);
    }
    const docPath = Array.isArray(path) ? path : propRecord[path]?.path;
    if (!docPath) {
      // Unmapped names (e.g. transient per-environment prompt keys such as
      // `instanceUrl:tools`) are not catalog fields. Return undefined rather
      // than throwing so the standard Yeoman prompt flow can round-trip them.
      return undefined;
    }
    const val = this.backstageDoc.getIn(docPath);
    return val && isSeq(val)
      ? option === 'json'
        ? val.toJSON()
        : val.toJSON().join()
      : val;
  }

  get(key: string): unknown {
    if (key === 'promptValues') {
      return this.getAnswers();
    }
    if (
      !this.documentProp(key) &&
      this.composerDoc.hasIn([...NRCOMPOSER_ANSWERS_PATH, key])
    ) {
      return this.composerDoc.getIn([...NRCOMPOSER_ANSWERS_PATH, key]);
    }
    const path = propRecord[key]?.path;
    if (!path) {
      return undefined;
    }
    const val = this.backstageDoc.getIn(path);
    return val && isSeq(val) ? val.toJSON().join() : val;
  }

  getAll() {
    // console.log(`Getting getAll`);
    return this.backstageDoc.toJSON();
  }

  set(key: string, value: unknown) {
    if (key === 'promptValues') {
      // Yeoman's prompt cache: keep every answer flat in the shared map.
      for (const [name, answer] of Object.entries(
        (value ?? {}) as Record<string, unknown>,
      )) {
        this.set(name, answer);
      }
      return;
    }
    if (this.docPrompts) {
      if (this.docPrompts[key]) {
        this.setDocPrompt(key, value);
      }
      return;
    }
    console.log(`Setting key "${key}" to`, value);
    const pathToProp = this.documentProp(key);
    if (!pathToProp) {
      this.composerDoc.setIn([...NRCOMPOSER_ANSWERS_PATH, key], value);
      return;
    }
    this.backstageDoc.setIn(
      pathToProp.path,
      pathToProp.csv && typeof value === 'string' ? value.split(',') : value,
    );
    if (this.composerDoc.hasIn([...NRCOMPOSER_ANSWERS_PATH, key])) {
      this.composerDoc.deleteIn([...NRCOMPOSER_ANSWERS_PATH, key]);
    }
  }

  setPath(path: string | string[], value: unknown) {
    if (typeof path === 'string' && this.docPrompts) {
      this.set(path, value);
      return;
    }
    if (value === null) {
      // Do not set null values
      return;
    }
    if (typeof path === 'string' && propRecord[path]) {
      this.set(path, value);
      return;
    }
    const resolvedPath = Array.isArray(path) ? path : propRecord[path]?.path;
    if (!resolvedPath) {
      // Unmapped names (e.g. transient per-environment prompt keys) are not
      // catalog fields; skip them rather than writing to an undefined path.
      return;
    }
    this.backstageDoc.setIn(resolvedPath, value);
  }

  delete(key: string | string[]) {
    if (Array.isArray(key)) {
      this.backstageDoc.deleteIn(key);
      return;
    }
    this.composerDoc.deleteIn([...NRCOMPOSER_ANSWERS_PATH, key]);
    const path = propRecord[key]?.path;
    if (!path) {
      return;
    }
    this.backstageDoc.deleteIn(path);
  }

  /**
   * Yeoman's `Generator` constructor calls `createStorage()` on the config
   * object to derive its generator/instance sub-stores; this storage ignores
   * the request (the result is unused here), so it is a deliberate no-op.
   */
  // eslint-disable-next-line no-unused-vars
  createStorage(path: string) {}

  processDeprecated() {
    const removedProps: string[] = [];
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      const hasLegacyValue = this.backstageDoc.hasIn(path);
      const hasStoredValue = this.composerDoc.hasIn([
        ...NRCOMPOSER_ANSWERS_PATH,
        pathToProp.prop,
      ]);
      if ((hasLegacyValue || hasStoredValue) && pathToProp.deprecated) {
        removedProps.push(pathToProp.prop);
        const value = hasStoredValue
          ? this.composerDoc.getIn([
              ...NRCOMPOSER_ANSWERS_PATH,
              pathToProp.prop,
            ])
          : this.backstageDoc.getIn(path);
        pathToProp.deprecated(this, value);
        this.backstageDoc.deleteIn(path);
        this.composerDoc.deleteIn([
          ...NRCOMPOSER_ANSWERS_PATH,
          pathToProp.prop,
        ]);
      }
    }
    if (removedProps.length > 0) {
      this.save();
    }
    return removedProps;
  }

  processAssumeDefaultValue(questions: PromptQuestion[]) {
    const assumedDefaultProps: string[] = [];
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      if (
        !this.backstageDoc.hasIn(path) &&
        !this.composerDoc.hasIn([
          ...NRCOMPOSER_ANSWERS_PATH,
          pathToProp.prop,
        ]) &&
        pathToProp.assumeDefaultValue
      ) {
        const defaultValue = questions.find(
          (question) => question.name === pathToProp.prop,
        )?.default;
        if (defaultValue !== null) {
          assumedDefaultProps.push(pathToProp.prop);
          this.set(pathToProp.prop, defaultValue);
        }
      }
    }
    if (assumedDefaultProps.length > 0) {
      this.save();
    }
    return assumedDefaultProps;
  }
}
