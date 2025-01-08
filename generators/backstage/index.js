'use strict';
import * as fs from 'fs';
import Generator from 'yeoman-generator';
import yosay from 'yosay';
import { Document, parseDocument } from 'yaml';
import {
  BACKSTAGE_FILENAME,
  pathToProps,
  extractFromYaml,
  generateSetAnswerPropPredicate,
  writePropToPath,
} from '../util/yaml.js';
import { extractGitHubSlug, getGitRepoOriginUrl } from '../util/git.js';

/**
 * Generate a basic backstage file
 */
export default class extends Generator {
  async initializing() {
    const backstagePath = this.destinationPath(BACKSTAGE_FILENAME);
    if (fs.existsSync(backstagePath)) {
      const backstageYaml = fs.readFileSync(backstagePath, 'utf8');
      this.backstageDoc = parseDocument(backstageYaml);
    } else {
      this.backstageDoc = new Document();
    }
  }

  async prompting() {
    const promptless = !!this.options.promptless;
    this.answers = extractFromYaml(this.backstageDoc, pathToProps);

    this.log(yosay('Welcome to the backstage file generator!'));

    // Attempt to read origin url
    const repoOrigin = getGitRepoOriginUrl();

    const backstageAnswer = promptless
      ? { skip: true }
      : await this.prompt([
          {
            type: 'confirm',
            name: 'skip',
            message: `Skip prompts for values found in Backstage file (${BACKSTAGE_FILENAME}):`,
            default: true,
          },
        ]);

    this.answers = {
      ...this.answers,
      ...(await this.prompt(
        [
          {
            type: 'input',
            name: 'projectName',
            message: 'Project:',
          },
          {
            type: 'input',
            name: 'serviceName',
            message: 'Service:',
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description:',
          },
          {
            type: 'input',
            name: 'title',
            message: 'Title:',
          },
          {
            type: 'input',
            name: 'type',
            message: 'Type (service, website, library):',
          },
          {
            type: 'input',
            name: 'lifecycle',
            message: 'Lifecycle (experimental, production, deprecated):',
          },
          {
            type: 'input',
            name: 'license',
            default: 'Apache-2.0',
            message: 'License (SPDX):',
          },
          {
            type: 'input',
            name: 'owner',
            message: 'Owner:',
          },
          {
            type: 'input',
            name: 'githubProjectSlug',
            message: 'GitHub Slug (<organization or owner>/<repository>):',
            default: extractGitHubSlug(repoOrigin) ?? '',
          },
        ]
          .filter(
            generateSetAnswerPropPredicate(this.answers, !backstageAnswer.skip),
          )
          .map((question) => {
            if (this.answers[question?.name]) {
              question.default = this.answers[question.name];
            }
            return question;
          }),
      )),
    };
  }

  writingBackstage() {
    writePropToPath(this.backstageDoc, pathToProps, this.answers);

    this.backstageDoc.setIn(['apiVersion'], 'backstage.io/v1alpha1');
    this.backstageDoc.setIn(['kind'], 'Component');

    this.fs.write(
      this.destinationPath(BACKSTAGE_FILENAME),
      this.backstageDoc.toString(),
    );
  }
}
