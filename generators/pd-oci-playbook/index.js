'use strict';
import path from 'path';
import * as fs from 'node:fs';
import Generator from 'yeoman-generator';
import { updateReadmeWithPipelineGuide } from '../util/copyworkflows.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';

/**
 * Generate Ansible playbook and variable files for OCI artifact deployments
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.argument('projectName', {
      type: String,
      required: true,
      description: 'Project Name',
    });
    this.argument('serviceName', {
      type: String,
      required: true,
      description: 'Service Name',
    });
    this.argument('playbookPath', {
      type: String,
      required: false,
      description: 'Playbook Path',
      default: 'playbooks',
    });

    this.option('deployType', {
      type: String,
      description: 'Deployment type (nodejs or tomcat)',
      default: 'nodejs',
    });
  }
  
  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }
  
  writing() {
    this.log('Generating playbook files');

    // Initialize playbook variable files (copy vars/custom if they don't exist)
    const varsCustomPath = this.templatePath('./vars/custom');
    if (fs.existsSync(varsCustomPath)) {
      const varsFiles = fs.readdirSync(varsCustomPath);
      for (const file of varsFiles) {
        const destPath = this.destinationPath(
          `${this.options.playbookPath}/vars/custom/${file}`,
        );
        if (!fs.existsSync(destPath)) {
          this.fs.copyTpl(path.join(varsCustomPath, file), destPath, {});
        }
      }
    }

    const deployType = this.options.deployType || 'nodejs';
    const templateFile =
      deployType === 'tomcat' ? 'playbook-tomcat.yaml' : 'playbook-nodejs.yaml';

    this.fs.copyTpl(
      this.templatePath(templateFile),
      this.destinationPath(`${this.options.playbookPath}/playbook.yaml`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        addWebadeConfig: this.options.addWebadeConfig,
      },
    );
    this.fs.copyTpl(
      this.templatePath('vars/standard/**'),
      this.destinationPath(`${this.options.playbookPath}/vars/standard`),
      {
        projectName: this.options.projectName,
        serviceName: this.options.serviceName,
        projectNameUpperCase: this.options.projectName.toUpperCase(),
        deployType: deployType,
        shutdownScript: this.options.shutdownScript || '',
      },
    );

    // Update README with Polaris Pipeline guide
    updateReadmeWithPipelineGuide(this);
  }
}
