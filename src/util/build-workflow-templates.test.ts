import * as fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { parse as parseYaml } from 'yaml';

const buildTemplates = [
  'src/gh-nodejs-build/templates/build-release.yaml',
  'src/gh-maven-build/templates/build-release.yaml',
  'src/gh-docker-build/templates/build-release.yaml',
];

const templateData = {
  projectName: 'demo',
  serviceName: 'demo',
  type: 'service',
  artifactRepositoryType: 'GitHubPackages',
  artifactRepositoryPath: '',
  brokerJwt: 'BROKER_JWT',
  brokerTrackingEnabled: true,
  gitHubProjectSlug: 'org/repo',
  license: 'Apache-2.0',
  isMonoRepo: false,
  unitTestsPath: '',
  relativePath: '',
  publishRelativePath: '',
  nodeVersion: '24',
  publishArtifactSuffix: 'dist',
  publishDirectory: 'dist',
  pomRoot: '',
  javaVersion: '17',
  javaPattern: 'SpringBoot',
  mavenBuildCommand: 'verify',
  ociArtifacts: [],
  customRunner: 'ubuntu-latest',
  toolsBuildSecrets: '',
  toolsLocalBuildSecrets: '',
};

describe.each(buildTemplates)('%s', (templatePath) => {
  it.each([true, false])(
    'renders Broker checks and intention tasks according to tracking being %s',
    (brokerTrackingEnabled) => {
      const source = fs.readFileSync(path.resolve(templatePath), 'utf8');
      const workflow = parseYaml(
        ejs.render(source, {
          ...templateData,
          brokerTrackingEnabled,
        }),
      );
      const steps = workflow.jobs['build-publish'].steps;
      const findStep = (name: string) =>
        steps.find((step) => step.name === name);

      expect(workflow.jobs.preflight.with.skip_broker_checks).toBe(
        !brokerTrackingEnabled,
      );
      expect(findStep('Build intention').if).toBe(
        `\${{ ${brokerTrackingEnabled} }}`,
      );
      expect(findStep('Open intention').if).toBe(
        `\${{ ${brokerTrackingEnabled} }}`,
      );
      expect(findStep('Send build info').if).toBe(
        `\${{ 'service' != 'library' && ${brokerTrackingEnabled} }}`,
      );
      expect(
        findStep('Build artifact') || findStep('Build and push Docker image'),
      ).toBeDefined();
    },
  );
});

describe('build preflight Broker opt-out', () => {
  const preflight = parseYaml(
    fs.readFileSync(
      path.resolve('src/util/gh-workflow-template/preflight.yaml'),
      'utf8',
    ),
  );

  it('skips Broker checks and permits a build when tracking is disabled', () => {
    expect(preflight.on.workflow_call.inputs.skip_broker_checks).toMatchObject({
      default: false,
      type: 'boolean',
    });
    expect(preflight.on.workflow_call.secrets.token.required).toBe(false);
    expect(preflight.jobs['check-jwt'].if).toBe(
      '${{ inputs.skip_broker_checks != true }}',
    );
    expect(preflight.jobs['check-release-package'].if).toContain(
      'inputs.skip_broker_checks != true',
    );
    const rebuildStep = preflight.jobs['set-check-outputs'].steps.find(
      (step) => step.id === 'set-can-rebuild',
    );
    expect(rebuildStep.run).toContain(
      'if [[ "$SKIP_BROKER_CHECKS" == "true" ]]',
    );
  });
});
