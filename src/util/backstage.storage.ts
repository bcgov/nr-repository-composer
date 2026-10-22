import * as fs from 'fs';
import { Document, isSeq, parseAllDocuments } from 'yaml';
import { PromptQuestion } from 'yeoman-generator';
import {
  BACKSTAGE_API_VERSION,
  addGeneratorToDoc,
  hasGeneratorInDoc,
  extractFromYaml,
  propRecord,
  pathToProps,
} from './yaml.js';

export class BackstageStorage {
  private path: string;
  private name: string;
  // The catalog file may hold several YAML documents separated by the `---`
  // delimiter (one per Backstage `kind`). `backstageDoc` is the document that
  // matches this instance's `kind`; the others are kept so a save can write the
  // whole multi-document file back without dropping unrelated kinds.
  private backstageDocs: Document[] = [];
  private backstageDoc!: Document;

  constructor(
    name: string,
    kind: string,
    configPath: string,
    options: { ignoreKindMismatch?: boolean } = {},
  ) {
    this.path = configPath;
    this.name = name;

    if (fs.existsSync(this.path)) {
      const backstageYaml = fs.readFileSync(this.path, 'utf8');
      this.backstageDocs = parseAllDocuments(backstageYaml);
      // Skip empty documents (e.g. a stray trailing `---`) when locating the
      // one that matches this instance's kind.
      const populated = this.backstageDocs.filter((doc) => doc.contents);

      // Prefer the document that already matches this instance's kind, so a
      // catalog file holding several kinds keeps each kind's data in its own
      // document.
      const existing = populated.find((doc) => doc.getIn(['kind']) === kind);

      if (existing) {
        this.backstageDoc = existing;
      } else if (options.ignoreKindMismatch) {
        // No document of this kind exists. Preserve the historic single-document
        // behaviour: attach to the first existing document when there is one.
        this.backstageDoc = populated[0] ?? this.newDocumentForKind(kind);
      } else {
        const active = populated[0];
        if (active) {
          const foundKind = active.getIn(['kind']);
          throw new Error(
            `Backstage document kind mismatch: expected "${kind}", found "${foundKind}". Are you running the correct generator for the current working directory?`,
          );
        }
        // The file exists but is blank; start a document for this kind.
        this.backstageDoc = this.newDocumentForKind(kind);
      }

      // Keep the active document registered so save() can emit it even when it
      // was created fresh for this kind.
      if (!this.backstageDocs.includes(this.backstageDoc)) {
        this.backstageDocs.push(this.backstageDoc);
      }
    } else {
      this.backstageDoc = this.newDocumentForKind(kind);
      this.backstageDocs = [this.backstageDoc];
    }
  }

  /** Create and register a fresh document carrying the standard Backstage header. */
  private newDocumentForKind(kind: string): Document {
    const doc = new Document();
    doc.setIn(['apiVersion'], BACKSTAGE_API_VERSION);
    doc.setIn(['kind'], kind);
    return doc;
  }

  get doc() {
    return this.backstageDoc;
  }

  /**
   * Every document currently held for this catalog file. Useful when a caller
   * needs to inspect or persist kinds other than this instance's own.
   */
  get docs(): Document[] {
    return this.backstageDocs;
  }

  getAnswers() {
    return extractFromYaml(this.backstageDoc, pathToProps);
  }

  addGeneratorToDoc(generator: string) {
    addGeneratorToDoc(this.backstageDoc, generator);
  }

  hasGenerator(generator: string): boolean {
    return hasGeneratorInDoc(this.backstageDoc, generator);
  }

  save() {
    console.log(`Saving backstage document to ${this.path}`);
    // Emit every held document, one per Backstage `kind`, joined with the
    // standard YAML multi-document delimiter. Empty documents are dropped so a
    // single-kind file stays a plain single document (byte-identical output).
    const output = this.backstageDocs
      .filter((doc) => doc.contents)
      .map((doc) => doc.toString())
      .join('\n---\n');
    fs.writeFileSync(this.path, output);
  }

  getPath(path: string | string[], option = ''): unknown {
    const docPath = Array.isArray(path) ? path : propRecord[path]?.path;
    if (!docPath) {
      // Unmapped names (e.g. transient per-environment prompt keys such as
      // `instanceUrl:tools`) are not catalog fields. Return undefined rather
      // than throwing so the standard Yeoman prompt flow can round-trip them.
      return undefined;
    }
    // console.log(
    //   `Getting path "${docPath}: ${this.backstageDoc.getIn(docPath)}"`,
    // );
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
    // console.log(`Getting key "${key}"`);
    const val = this.backstageDoc.getIn(propRecord[key].path);
    return val && isSeq(val) ? val.toJSON().join() : val;
  }

  getAll() {
    // console.log(`Getting getAll`);
    return this.backstageDoc.toJSON();
  }

  set(key: string, value: string) {
    console.log(`Setting key "${key}" to`, value);
    this.backstageDoc.setIn(
      propRecord[key].path,
      propRecord[key].csv ? value.split(',') : value,
    );
  }

  setPath(path: string | string[], value: string | null) {
    if (value === null) {
      // Do not set null values
      return;
    }
    const resolvedPath = Array.isArray(path) ? path : propRecord[path]?.path;
    if (!resolvedPath) {
      // Unmapped names (e.g. transient per-environment prompt keys) are not
      // catalog fields; skip them rather than writing to an undefined path.
      return;
    }
    const csv = propRecord[path as string]?.csv;
    this.backstageDoc.setIn(resolvedPath, csv ? value.split(',') : value);
  }

  delete(key: string | string[]) {
    const path = Array.isArray(key) ? key : propRecord[key].path;
    this.backstageDoc.deleteIn(path);
  }

  defaults(defaults: Record<string, unknown>) {
    console.log(`Setting defaults`, defaults);
    throw new Error('defaults not implemented');
  }

  merge(source: Record<string, unknown>) {
    console.log(`Merging source`, source);
    throw new Error('merge not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  createStorage(path: string) {
    // Ignore
    // console.log(`createStorage called with path: ${path}`);
    // throw new Error('createStorage not implemented');
  }

  createProxy() {
    throw new Error('createProxy not implemented');
  }

  processDeprecated() {
    const removedProps: string[] = [];
    for (const pathToProp of pathToProps) {
      const path = pathToProp.path;
      if (this.backstageDoc.hasIn(path) && pathToProp.deprecated) {
        removedProps.push(pathToProp.prop);
        pathToProp.deprecated(this, this.backstageDoc.getIn(path));
        this.backstageDoc.deleteIn(path);
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
      if (!this.backstageDoc.hasIn(path) && pathToProp.assumeDefaultValue) {
        const defaultValue = questions.find(
          (question) => question.name === pathToProp.prop,
        )?.default;
        if (defaultValue !== null) {
          assumedDefaultProps.push(pathToProp.prop);
          this.backstageDoc.setIn(path, defaultValue);
        }
      }
    }
    if (assumedDefaultProps.length > 0) {
      this.save();
    }
    return assumedDefaultProps;
  }
}
