import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
  brokerJwt: 'broker_jwt_demo',
  hasBrokerClientId: true,
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
  mavenBuildCommand: 'verify',
  ociArtifacts: [],
  customRunner: 'ubuntu-latest',
  toolsBuildSecrets: '',
};

describe.each(buildTemplates)('%s', (templatePath) => {
  it.each([true, false])(
    'uses runtime secret checks with a configured Client ID=%s',
    (hasBrokerClientId) => {
      const workflow = parseYaml(
        ejs.render(fs.readFileSync(path.resolve(templatePath), 'utf8'), {
          ...templateData,
          hasBrokerClientId,
        }),
      );
      const expectedToken = hasBrokerClientId
        ? '${{ secrets.broker_jwt_demo }}'
        : '';
      expect(workflow.env.BROKER_JWT).toBe(expectedToken);
      expect(workflow.jobs.preflight.secrets.token).toBe(expectedToken);
      const steps = workflow.jobs['build-publish'].steps;
      for (const name of [
        'Build intention',
        'Open intention',
        'Echo intention ID for deploy job',
      ]) {
        expect(steps.find((step) => step.name === name).if).toBe(
          "${{ env.BROKER_JWT != '' }}",
        );
      }
      for (const name of [
        'Send build info',
        'Close intention',
        'Close intention (Failure)',
      ]) {
        expect(steps.find((step) => step.name === name).if).toContain(
          "env.BROKER_JWT != ''",
        );
      }
      expect(
        steps.find((step) => step.name === 'Open intention').with.broker_jwt,
      ).toBe('${{ env.BROKER_JWT }}');
      expect(
        steps.find((step) =>
          ['Build artifact', 'Build and push Docker image'].includes(step.name),
        ),
      ).toBeDefined();
    },
  );
});

describe.each(buildTemplates.slice(0, 2))(
  '%s runner selection',
  (templatePath) => {
    it.each([
      [
        'group: Larger Runners - OpenShift Static-IP',
        { group: 'Larger Runners - OpenShift Static-IP' },
      ],
      ['self-hosted', 'self-hosted'],
    ])(
      'selects %s only when preflight finds a secret',
      (customRunner, expected) => {
        const workflow = parseYaml(
          ejs.render(fs.readFileSync(path.resolve(templatePath), 'utf8'), {
            ...templateData,
            customRunner,
          }),
        );
        const runner = workflow.jobs['build-publish']['runs-on'];
        expect(runner).toContain(
          "needs.preflight.outputs.broker_enabled == 'true'",
        );
        const choices = runner.match(/&& '(.+)' \|\| '(.+)'/);
        expect(JSON.parse(choices[1])).toEqual(expected);
        expect(JSON.parse(choices[2])).toBe('ubuntu-latest');
      },
    );
  },
);

describe('runtime Broker configuration', () => {
  const preflight = parseYaml(
    fs.readFileSync(
      path.resolve('src/util/gh-workflow-template/preflight.yaml'),
      'utf8',
    ),
  );

  it.each([
    ['', 'build', 0, 'enabled=false', '::warning::'],
    ['test-token', 'build', 0, 'enabled=true', ''],
    ['', 'deploy', 1, '', '::error::'],
    ['test-token', 'deploy', 0, 'enabled=true', ''],
  ])(
    'handles secret=%s context=%s',
    (token, context, status, output, message) => {
      const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'broker-check-'));
      try {
        const outputPath = path.join(directory, 'output');
        fs.writeFileSync(outputPath, '');
        const step = preflight.jobs['broker-config'].steps[0];
        expect(step.env.BROKER_JWT).toBe('${{ secrets.token }}');
        const result = spawnSync('bash', ['-e', '-c', step.run], {
          env: {
            ...process.env,
            BROKER_JWT: token,
            PREFLIGHT_CONTEXT: context,
            GITHUB_OUTPUT: outputPath,
          },
          encoding: 'utf8',
        });
        expect(result.status).toBe(status);
        expect(fs.readFileSync(outputPath, 'utf8').trim()).toBe(output);
        expect(result.stdout).toContain(message);
        expect(result.stdout).not.toContain('test-token');
      } finally {
        fs.rmSync(directory, { recursive: true, force: true });
      }
    },
  );

  it('gates Broker jobs on the runtime check and permits unrecorded tag builds', () => {
    expect(preflight.jobs['check-jwt'].needs).toBe('broker-config');
    expect(preflight.jobs['check-jwt'].if).toContain(
      "needs.broker-config.outputs.enabled == 'true'",
    );
    expect(preflight.jobs['check-release-package'].if).toContain(
      "needs.broker-config.outputs.enabled == 'true'",
    );
    const rebuildStep = preflight.jobs['set-check-outputs'].steps.find(
      (step) => step.id === 'set-can-rebuild',
    );
    expect(rebuildStep.env.BROKER_ENABLED).toBe(
      '${{ needs.broker-config.outputs.enabled }}',
    );
    expect(rebuildStep.run).toContain('if [[ "$BROKER_ENABLED" == "false" ]]');
  });
});
