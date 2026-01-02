import * as fs from 'fs';
import { Document, parseDocument, isSeq } from 'yaml';
import {
  BACKSTAGE_API_VERSION,
  addGeneratorToDoc,
  extractFromYaml,
  propRecord,
  pathToProps,
} from './yaml.js';

export class BackstageStorage {
  constructor(name, kind, configPath, options = {}) {
    this.path = configPath;
    this.name = name;

    if (fs.existsSync(this.path)) {
      const backstageYaml = fs.readFileSync(this.path, 'utf8');
      this.backstageDoc = parseDocument(backstageYaml);
      if (!options.ignoreKindMismatch && this.getPath(['kind']) !== kind) {
        throw new Error(
          `Backstage document kind mismatch: expected "${kind}", found "${this.getPath(['kind'])}". Are you running the correct generator for the current working directory?`,
        );
      }
    } else {
      this.backstageDoc = new Document();
      this.setPath(['apiVersion'], BACKSTAGE_API_VERSION);
      this.setPath(['kind'], kind);
    }
  }

  get doc() {
    return this.backstageDoc;
  }

  getAnswers() {
    return extractFromYaml(this.backstageDoc, pathToProps);
  }

  addGeneratorToDoc(generator) {
    addGeneratorToDoc(this.backstageDoc, generator);
  }

  save() {
    console.log(`Saving backstage document to ${this.path}`);
    fs.writeFileSync(this.path, this.backstageDoc.toString());
  }

  getPath(path, option = '') {
    const docPath = Array.isArray(path) ? path : propRecord[path]?.path;
    if (!docPath) {
      throw new Error(`Mapping from "${path}" to YAML document path not found`);
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

  get(key) {
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

  set(key, value) {
    console.log(`Setting key "${key}" to`, value);
    this.backstageDoc.setIn(
      propRecord[key].path,
      propRecord[key].csv ? value.split(',') : value,
    );
  }

  setPath(path, value) {
    if (value === null) {
      // Do not set null values
      return;
    }
    const csv = propRecord[path]?.csv;
    path = Array.isArray(path) ? path : propRecord[path].path;
    // console.log(`Setting path "${path}" to`, value);
    this.backstageDoc.setIn(path, csv ? value.split(',') : value);
  }

  delete(key) {
    key = Array.isArray(key) ? key : propRecord[key].path;
    this.backstageDoc.deleteIn(propRecord[key].path);
  }

  defaults(defaults) {
    console.log(`Setting defaults`, defaults);
    throw new Error('defaults not implemented');
  }

  merge(source) {
    console.log(`Merging source`, source);
    throw new Error('merge not implemented');
  }

  // eslint-disable-next-line no-unused-vars
  createStorage(path) {
    // Ignore
    // console.log(`createStorage called with path: ${path}`);
    // throw new Error('createStorage not implemented');
  }

  createProxy() {
    throw new Error('createProxy not implemented');
  }
}
