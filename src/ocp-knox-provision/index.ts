import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import { destinationGitPath } from '../util/git.js';
import { stringify } from 'yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BaseOptions } from 'yeoman-generator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_INTENTION_USER,
  PROMPT_SYNC_SECRET_ENABLED,
  PROMPT_SYNC_VAULT_PATHS,
  PROMPT_SYNC_SECRET_NAMES,
} from '../util/prompts.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_INTENTION_USER,
  PROMPT_SYNC_SECRET_ENABLED,
  PROMPT_SYNC_VAULT_PATHS,
  PROMPT_SYNC_SECRET_NAMES,
];

// Maps the short/long environment names used within vault path segments (e.g. ".../dev/.../development").
const VAULT_PATH_ENV_SEGMENTS: Record<string, { short: string; long: string }> =
  {
    dev: { short: 'dev', long: 'development' },
    test: { short: 'test', long: 'test' },
    prod: { short: 'prod', long: 'production' },
  };

// Rewrites the dev vault paths' env segments (short and long forms) for the target environment.
function deriveVaultPaths(
  devVaultPaths: string,
  targetEnv: 'test' | 'prod',
): string {
  const target = VAULT_PATH_ENV_SEGMENTS[targetEnv];
  return devVaultPaths
    .split(',')
    .map((vaultPath) =>
      vaultPath
        .trim()
        .split('/')
        .map((segment) => {
          if (segment === 'dev') return target.short;
          if (segment === 'development') return target.long;
          return segment;
        })
        .join('/'),
    )
    .join(',');
}

// Builds the Helm values object for a single environment, rendered to YAML via the `yaml` package rather than an EJS template.
function buildEnvValues(options: {
  projectName: string;
  serviceName: string;
  environment: string;
  intentionUser: string;
  syncSecretEnabled: boolean;
  syncVaultPaths: string;
  syncSecretNames: string;
}) {
  const {
    projectName,
    serviceName,
    environment,
    intentionUser,
    syncSecretEnabled,
    syncVaultPaths,
    syncSecretNames,
  } = options;
  const values: Record<string, unknown> = {
    intention: {
      service: {
        name: projectName,
        project: serviceName,
        environment,
      },
      user: {
        name: intentionUser,
      },
    },
  };
  if (syncSecretEnabled) {
    values.sync = {
      enabled: true,
      vaultPaths: syncVaultPaths,
      secretNames: syncSecretNames,
    };
  }
  return values;
}

/**
 * Generate the CI workflow and NR Broker intention files needed for OCP Knox Provision
 */
export default class extends BaseGenerator {
  constructor(args: string | string[], opts: BaseOptions) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR OCP Knox Provision Generator',
      subtitle: 'Create workflow for OCP Knox Provision',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-docs-deploy-gh-docs-deploy',
        ],
      ],
    };
    this._questions = questions;
  }

  async prompting() {
    return super.prompting();
  }

  _getStorageOptions() {
    return {
      kind: BACKSTAGE_KIND_COMPONENT,
      storageOptions: { ignoreKindMismatch: true },
    };
  }

  // Generate GitHub workflows
  writingWorkflow() {
    const {
      projectName,
      serviceName,
      intentionUser,
      syncSecretEnabled,
      syncVaultPaths,
      syncSecretNames,
    } = this.answers;
    const syncEnabled = !!syncSecretEnabled;
    const devVaultPaths = syncVaultPaths ?? '';
    this.fs.copyTpl(
      path.join(__dirname, 'README.md'),
      destinationGitPath('cronjob-deployment/README.md'),
      {},
    );
    this.fs.write(
      destinationGitPath('cronjob-deployment/values/common.yaml'),
      stringify({
        global: { name: 'knox-provision' },
        image: { tag: 'v4.0.0' },
      }),
    );
    this.fs.write(
      destinationGitPath('cronjob-deployment/values/dev.yaml'),
      stringify(
        buildEnvValues({
          projectName,
          serviceName,
          environment: 'development',
          intentionUser,
          syncSecretEnabled: syncEnabled,
          syncVaultPaths: devVaultPaths,
          syncSecretNames: syncSecretNames ?? '',
        }),
      ),
    );
    this.fs.write(
      destinationGitPath('cronjob-deployment/values/test.yaml'),
      stringify(
        buildEnvValues({
          projectName,
          serviceName,
          environment: 'test',
          intentionUser,
          syncSecretEnabled: syncEnabled,
          syncVaultPaths: syncEnabled
            ? deriveVaultPaths(devVaultPaths, 'test')
            : '',
          syncSecretNames: syncEnabled ? (syncSecretNames ?? '') : '',
        }),
      ),
    );
    this.fs.write(
      destinationGitPath('cronjob-deployment/values/prod.yaml'),
      stringify(
        buildEnvValues({
          projectName,
          serviceName,
          environment: 'production',
          intentionUser,
          syncSecretEnabled: syncEnabled,
          syncVaultPaths: syncEnabled
            ? deriveVaultPaths(devVaultPaths, 'prod')
            : '',
          syncSecretNames: syncEnabled ? (syncSecretNames ?? '') : '',
        }),
      ),
    );
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
