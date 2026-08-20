import Generator from 'yeoman-generator';
import type { BaseOptions } from 'yeoman-generator';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
} from '../util/yaml.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { destinationGitPath } from '../util/git.js';
import { makeWorkflowBuildPublishPath } from '../util/github.js';
import { OPTION_HEADLESS } from '../util/options.js';
import { outputReport } from '../util/report.js';

export default class extends Generator {
  constructor(args: string | string[], opts: BaseOptions) {
    super(args as string[], opts);
    this.option(OPTION_HEADLESS);
  }

  override _getStorage(): any {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_LOCATION,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  // Generate common mono repo build files
  writing() {
    const targets = String(
      (this.config as unknown as BackstageStorage).getPath(['spec', 'targets']),
    ).split(',');
    const docs = targets.map((target) => {
      return new BackstageStorage(
        this.rootGeneratorName(),
        BACKSTAGE_KIND_COMPONENT,
        this.destinationPath(target),
      );
    });

    const serviceNeeds = {};
    const services = docs.map((doc) => {
      const name = doc.getPath(['metadata', 'name']) as string;
      return {
        name,
        workflow: makeWorkflowBuildPublishPath(name),
      };
    });

    for (const doc of docs) {
      const serviceName = doc.getPath(['metadata', 'name']) as string;
      const subcomponents = doc.getPath(
        ['spec', 'subcomponentOf'],
        'json',
      ) as any[];
      if (subcomponents) {
        for (const subcomponent of subcomponents) {
          const subServiceName = subcomponent.split(':')[1];
          if (
            services.findIndex((service) => service.name === subServiceName) ===
            -1
          ) {
            throw new Error(
              `Subcomponent ${subServiceName} not found in mono-repo`,
            );
          }
          if (!serviceNeeds[subServiceName]) {
            serviceNeeds[subServiceName] = [];
          }
          serviceNeeds[subServiceName].push(serviceName);
        }
      }
    }

    this.fs.copyTpl(
      this.templatePath('build-release.yaml'),
      destinationGitPath(`.github/workflows/build-release.yaml`),
      {
        services,
        serviceNeeds,
      },
    );
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, 'gh-common-mono-build', {});
    }
  }
}
