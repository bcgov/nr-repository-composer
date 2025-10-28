'use strict';
import Generator from 'yeoman-generator';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
} from '../util/yaml.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { destinationGitPath } from '../util/git.js';

export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_LOCATION,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  // Generate common mono repo build files
  writing() {
    this.log('Generating build files');
    const targets = this.config.getPath(['spec', 'targets']).split(',');
    const docs = targets.map((target) => {
      return new BackstageStorage(
        this.rootGeneratorName(),
        BACKSTAGE_KIND_COMPONENT,
        this.destinationPath(target),
      );
    });

    const serviceNeeds = {};
    const serviceNames = [];

    for (const doc of docs) {
      const serviceName = doc.getPath(['metadata', 'name']);
      serviceNames.push(serviceName);
      // this.log(serviceName);
      const subcomponents = doc.getPath(['spec', 'subcomponentOf'], 'json');
      if (subcomponents) {
        for (const subcomponent of subcomponents) {
          const subServiceName = subcomponent.split(':')[1];
          if (!serviceNeeds[subServiceName]) {
            serviceNeeds[subServiceName] = [];
          }
          serviceNeeds[subServiceName].push(serviceName);
        }
      }
      // this.log(subcomponents);
      // this.log(serviceNeeds);
    }

    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      destinationGitPath(`.github/workflows/build-release.yaml`),
      {
        serviceNames,
        serviceNeeds: serviceNeeds,
      },
    );
  }
}
