import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { copyCommonDeploymentConfigWorkflow } from './copyworkflows.js';

describe('copyCommonDeploymentConfigWorkflow', () => {
  let repoDir: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'copyworkflows-'));
    fs.mkdirSync(path.join(repoDir, '.git'), { recursive: true });
    fs.writeFileSync(
      path.join(repoDir, '.git', 'config'),
      '[core]\n\trepositoryformatversion = 0\n',
    );
    fs.writeFileSync(
      path.join(repoDir, 'catalog-info.yaml'),
      [
        'apiVersion: backstage.io/v1alpha1',
        'kind: Component',
        'metadata:',
        '  name: my-service',
        '  annotations:',
        '    playbook.io.nrs.gov.bc.ca/deploymentConfigPaths: playbooks',
        '',
      ].join('\n'),
    );
    process.chdir(repoDir);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it('includes paths migrated into the composer answers in the deployment workflow', () => {
    const copyTpl = jest.fn();
    const generator = {
      fs: { copyTpl },
      templatePath: (template: string) => template,
    };

    copyCommonDeploymentConfigWorkflow('', generator, {});

    const buildDcWorkflow = copyTpl.mock.calls.find(([_, destination]) =>
      destination.endsWith('.github/workflows/build-dc.yaml'),
    );
    expect(buildDcWorkflow?.[2].deploymentConfigPaths).toContain('playbooks');
  });
});
