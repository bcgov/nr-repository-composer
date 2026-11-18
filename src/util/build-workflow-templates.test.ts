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
  it('keeps failed tests, failed preflight, and cancellations blocking the build', () => {
    const workflow = parseYaml(
      ejs.render(fs.readFileSync(path.resolve(templatePath), 'utf8'), {
        ...templateData,
        unitTestsPath: './.github/workflows/test.yaml',
      }),
    );
    expect(workflow.jobs['build-publish'].needs).toEqual(['preflight', 'test']);
    expect(workflow.jobs['build-publish'].if).toBe(
      "${{ needs.preflight.outputs.can_rebuild == 'true' }}",
    );
  });

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
      expect(workflow.jobs['build-publish'].env.BROKER_ENABLED).toBe(
        '${{ needs.preflight.outputs.broker_enabled }}',
      );
      const steps = workflow.jobs['build-publish'].steps;
      for (const name of [
        'Build intention',
        'Open intention',
        'Echo intention ID for deploy job',
      ]) {
        expect(steps.find((step) => step.name === name).if).toBe(
          "${{ env.BROKER_ENABLED == 'true' }}",
        );
      }
      for (const name of [
        'Send build info',
        'Close intention',
        'Close intention (Failure)',
      ]) {
        expect(steps.find((step) => step.name === name).if).toContain(
          "env.BROKER_ENABLED == 'true'",
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
      'selects %s only when preflight validates the token',
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
      "needs.check-jwt.outputs.valid == 'true'",
    );
    const rebuildStep = preflight.jobs['set-check-outputs'].steps.find(
      (step) => step.id === 'set-can-rebuild',
    );
    expect(rebuildStep.env.BROKER_ENABLED).toBe(
      "${{ needs.check-jwt.outputs.valid == 'true' }}",
    );
    expect(rebuildStep.run).toContain('if [[ "$BROKER_ENABLED" == "false" ]]');
    const result = spawnSync('bash', ['-e', '-c', rebuildStep.run], {
      env: {
        ...process.env,
        BROKER_ENABLED: 'false',
        GITHUB_OUTPUT: '/dev/stdout',
      },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('can_rebuild=true');
  });

  it('only tolerates token validation failures for builds, not deployment or other failed jobs', () => {
    expect(preflight.jobs['check-jwt'].with.allow_untracked_build).toBe(
      "${{ inputs.preflight_context == 'build' }}",
    );
    expect(preflight.on.workflow_call.outputs.broker_enabled.value).toBe(
      "${{ jobs.check-jwt.outputs.valid == 'true' }}",
    );
    const outputs = preflight.jobs['set-check-outputs'];
    expect(outputs.needs).toEqual([
      'broker-config',
      'check-jwt',
      'check-release-package',
    ]);
    expect(outputs.if).toContain('!cancelled()');
    expect(outputs.if).toContain("needs.check-jwt.result == 'success'");
    expect(outputs.if).toContain(
      "needs.check-release-package.result == 'success'",
    );
  });
});

describe('Broker token validation', () => {
  const workflow = parseYaml(
    ejs.render(
      fs.readFileSync(
        path.resolve('src/util/gh-workflow-template/check-token.yaml'),
        'utf8',
      ),
      { customRunner: 'ubuntu-latest' },
    ),
  );
  const validation = workflow.jobs['check-jwt'].steps.find(
    (step) => step.id === 'validate',
  );

  it('continues only the validation step for builds and reports its actual outcome', () => {
    expect(workflow.on.workflow_call.inputs.allow_untracked_build.default).toBe(
      false,
    );
    expect(validation['continue-on-error']).toBe(
      '${{ inputs.allow_untracked_build }}',
    );
    expect(workflow.jobs['check-jwt'].outputs.valid).toBe(
      "${{ steps.validate.outcome == 'success' }}",
    );
    const warning = workflow.jobs['check-jwt'].steps.find(
      (step) => step.name === 'Warn about untracked build',
    );
    expect(warning.if).toContain("steps.validate.outcome == 'failure'");
    expect(warning.if).toContain('inputs.allow_untracked_build');
    expect(warning.if).toContain('!cancelled()');
    expect(warning.run).toContain('::warning::');
    expect(warning.run).toContain('Deployment still requires');
  });

  it.each([
    ['valid', 'test-token', '200', 0, 0],
    ['empty', '', '200', 0, 1],
    ['unauthorized', 'test-token', '401', 22, 1],
    ['revoked', 'test-token', '403', 22, 1],
    ['server error', 'test-token', '500', 22, 1],
    ['redirect', 'test-token', '302', 0, 1],
    ['timeout', 'test-token', '000', 28, 1],
    ['connection error', 'test-token', '000', 7, 1],
  ])(
    'handles %s tokens/responses',
    (_, token, httpCode, curlExit, expected) => {
      const result = spawnSync(
        'bash',
        [
          '-e',
          '-o',
          'pipefail',
          '-c',
          `curl() { printf '%s' "$MOCK_HTTP_CODE"; return "$MOCK_CURL_EXIT"; }\n${validation.run}`,
        ],
        {
          env: {
            ...process.env,
            BROKER_JWT: token,
            BROKER_URL: 'https://broker.example.invalid',
            MOCK_HTTP_CODE: httpCode,
            MOCK_CURL_EXIT: String(curlExit),
          },
          encoding: 'utf8',
        },
      );
      expect(result.status).toBe(expected);
      expect(result.stdout + result.stderr).not.toContain('test-token');
      if (expected !== 0) {
        expect(result.stdout).toContain('Error:');
      }
    },
  );
});
