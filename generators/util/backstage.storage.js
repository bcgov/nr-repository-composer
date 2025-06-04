import * as fs from 'fs';
import { Document, parseDocument } from 'yaml';
import {
  addGeneratorToDoc,
  extractFromYaml,
  propRecord,
  pathToProps,
} from './yaml.js';

export class BackstageStorage {
  constructor(name, configPath) {
    this.path = configPath;
    this.name = name;

    if (fs.existsSync(this.path)) {
      const backstageYaml = fs.readFileSync(this.path, 'utf8');
      this.backstageDoc = parseDocument(backstageYaml);
    } else {
      this.backstageDoc = new Document();
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

  getPath(path) {
    path = Array.isArray(path) ? path : propRecord[path].path;
    // console.log(`Getting path "${path}: ${this.backstageDoc.getIn(path)}"`);
    return this.backstageDoc.getIn(path);
  }

  get(key) {
    if (key === 'promptValues') {
      return this.getAnswers();
    }
    // console.log(`Getting key "${key}"`);
    this.backstageDoc.getIn(propRecord[key].path);
  }

  getAll() {
    // console.log(`Getting getAll`);
    return this.backstageDoc.toJSON();
  }

  set(key, value) {
    // console.log(`Setting key "${key}" to`, value);
    this.backstageDoc.setIn(propRecord[key].path, value);
  }

  setPath(path, value) {
    if (value === null) {
      // Do not set null values
      return;
    }
    path = Array.isArray(path) ? path : propRecord[path].path;
    // console.log(`Setting path "${path}" to`, value);
    this.backstageDoc.setIn(path, value);
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

  createStorage(path) {
    // Ignore
    console.log(`createStorage called with path: ${path}`);
    // throw new Error('createStorage not implemented');
  }

  createProxy() {
    throw new Error('createProxy not implemented');
  }
}
