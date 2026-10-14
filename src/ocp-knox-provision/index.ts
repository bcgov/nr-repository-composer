import * as fs from 'node:fs';
import { parse, stringify } from 'yaml';
import deepMerge from 'deepmerge';
import type { BaseOptions } from 'yeoman-generator';

import { BaseGenerator } from '../util/base-generator.js';
import { BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_INTENTION_USER,
  PROMPT_SYNC_SECRET_ENABLED,
  PROMPT_SYNC_VAULT_PATHS,
  PROMPT_SYNC_SECRET_NAMES,
  PROMPT_OCP_KNOX_CRON_SCHEDULE,
  PROMPT_OCP_KNOX_SOURCE_SECRET_NAME,
  PROMPT_OCP_KNOX_TARGET_SECRET_NAME,
  PROMPT_OCP_KNOX_SYNC_SCHEDULE,
  PROMPT_OCP_KNOX_SYNC_SOURCE_SECRET_NAME,
} from '../util/prompts.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_INTENTION_USER,
  PROMPT_OCP_KNOX_CRON_SCHEDULE,
  PROMPT_OCP_KNOX_SOURCE_SECRET_NAME,
  PROMPT_OCP_KNOX_TARGET_SECRET_NAME,
  PROMPT_SYNC_SECRET_ENABLED,
  PROMPT_SYNC_VAULT_PATHS,
  PROMPT_SYNC_SECRET_NAMES,
  PROMPT_OCP_KNOX_SYNC_SCHEDULE,
  PROMPT_OCP_KNOX_SYNC_SOURCE_SECRET_NAME,
];

const OCP_KNOX_PROVISION_PATH = 'ocp-knox-provision';

// Maps the short/long environment names used within vault path segments (e.g. ".../dev/.../development").
const VAULT_PATH_ENV_SEGMENTS: {
  short: 'dev' | 'test' | 'prod';
  long: string;
}[] = [
  { short: 'dev', long: 'development' },
  { short: 'test', long: 'test' },
  { short: 'prod', long: 'production' },
];

// Rewrites the dev vault paths' env segments (short and long forms) for the target environment.
function deriveVaultPaths(
  devVaultPaths: string,
  targetEnv: 'dev' | 'test' | 'prod',
): string {
  return devVaultPaths
    .split(',')
    .map((vaultPath) => {
      const pathArr = vaultPath.trim().split('/');
      if (pathArr.length > 2) {
        pathArr[2] = targetEnv;
      }
      return pathArr.join('/');
    })
    .join(',');
}

// Builds the per-environment values for a single environment, rendered to YAML
// via the `yaml` package rather than an EJS template. Only the path-derived,
// environment-specific fields (sync vault paths / secret names) and the NR
// Broker intention live here. Environment-shared settings live in common.yaml.
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
        name: serviceName,
        project: projectName,
        environment,
      },
      user: {
        name: intentionUser,
      },
    },
  };
  if (syncSecretEnabled) {
    values.sync = {
      vaultPaths: syncVaultPaths,
      secretNames: syncSecretNames,
    };
  }
  return values;
}

// Reads an existing values file from disk (if a prior run created it) and
// returns its parsed object, or an empty object when the file is absent.
function readExistingValues(existingPath: string): Record<string, unknown> {
  if (fs.existsSync(existingPath)) {
    return parse(fs.readFileSync(existingPath, 'utf8')) ?? {};
  }
  return {};
}

// Overlays the freshly built prompt values onto any existing values file so
// that hand-edited values survive a re-run of the generator.
function writeMergedValues(
  gen: BaseGenerator,
  fileName: string,
  generated: Record<string, unknown>,
) {
  gen.fs.write(
    fileName,
    stringify(deepMerge(readExistingValues(fileName), generated)),
  );
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

  // Generate the common and per-environment Helm values files.
  writingWorkflow() {
    const {
      projectName,
      serviceName,
      intentionUser,
      syncSecretEnabled,
      syncVaultPaths,
      syncSecretNames,
      ocpKnoxCronSchedule,
      ocpKnoxSourceSecretName,
      ocpKnoxTargetSecretName,
      ocpKnoxSyncSchedule,
      ocpKnoxSyncSourceSecretName,
    } = this.answers;
    const syncEnabled = !!syncSecretEnabled;
    const devVaultPaths = syncVaultPaths ?? '';
    this.fs.copyTpl(
      this.templatePath('README.md'),
      this.destinationPath(OCP_KNOX_PROVISION_PATH, 'README.md'),
      {},
    );

    // Values that are shared across environments are written to common.yaml.
    // Everything the chart can source from a single source of truth lands here
    // rather than being repeated in each per-environment file.
    const common: Record<string, unknown> = {
      cron: {
        schedule: ocpKnoxCronSchedule ?? '0 2 * * *',
      },
      sourceSecret: {
        name: ocpKnoxSourceSecretName ?? 'knox-secret',
      },
      targetSecret: {
        name: ocpKnoxTargetSecretName ?? 'knox-secret',
      },
      sync: {
        enabled: syncEnabled,
        schedule: syncEnabled ? (ocpKnoxSyncSchedule ?? '') : '',
      },
    };

    if (syncEnabled) {
      // Login source-secret for the sync job is optional; default is the target
      // secret, so only emit when the user chose a different one.
      if (ocpKnoxSyncSourceSecretName) {
        (common.sync as Record<string, unknown>).sourceSecret = {
          name: ocpKnoxSyncSourceSecretName,
        };
      }
    }

    writeMergedValues(
      this,
      this.destinationPath(OCP_KNOX_PROVISION_PATH, 'values', 'common.yaml'),
      common,
    );

    for (const env of Object.values(VAULT_PATH_ENV_SEGMENTS)) {
      writeMergedValues(
        this,
        this.destinationPath(
          OCP_KNOX_PROVISION_PATH,
          'values',
          `${env.short}.yaml`,
        ),
        buildEnvValues({
          projectName,
          serviceName,
          environment: env.long,
          intentionUser,
          syncSecretEnabled: syncEnabled,
          syncVaultPaths: syncEnabled
            ? deriveVaultPaths(devVaultPaths, env.short)
            : '',
          syncSecretNames: syncEnabled ? (syncSecretNames ?? '') : '',
        }),
      );
    }
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
