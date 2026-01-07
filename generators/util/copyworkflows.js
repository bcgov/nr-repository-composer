import fs from 'fs';
import { destinationGitPath, relativeGitPath, ensureRepoDirs } from './git.js';
import {
  makeWorkflowBuildPublishFile,
  makeWorkflowDeployFile,
} from '../util/github.js';

const COMMON_TEMPLATE_PATH = '../../util/gh-workflow-template';

function copyRepoSupportFiles(generator) {
  const templateBase = `${COMMON_TEMPLATE_PATH}/local-build-support`;

  // copy root scripts
  try {
    const buildTpl = generator.templatePath(`${templateBase}/build.sh`);
    const runTpl = generator.templatePath(`${templateBase}/run.sh`);
    const destBuild = destinationGitPath('build.sh');
    const destRun = destinationGitPath('run.sh');

    if (!fs.existsSync(destBuild)) {
      generator.fs.copy(buildTpl, destBuild);
      try {
        fs.chmodSync(destBuild, 0o755);
      } catch {
        /* ignore */
      }
    }

    if (!fs.existsSync(destRun)) {
      generator.fs.copy(runTpl, destRun);
      try {
        fs.chmodSync(destRun, 0o755);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }

  // copy .docker files
  try {
    const setenvTpl = generator.templatePath(
      `${templateBase}/.docker/setenv.sh`,
    );
    const dockerfileTpl = generator.templatePath(
      `${templateBase}/.docker/runtime/Dockerfile`,
    );

    const destSetenv = destinationGitPath('.docker/setenv.sh');
    const destRuntimeDir = destinationGitPath('.docker/runtime');

    if (!fs.existsSync(destRuntimeDir)) {
      fs.mkdirSync(destRuntimeDir, { recursive: true });
    }

    // Only copy setenv.sh if it does not already exist in destination
    if (!fs.existsSync(destSetenv)) {
      generator.fs.copy(setenvTpl, destSetenv);
      try {
        fs.chmodSync(destSetenv, 0o644);
      } catch {
        /* ignore */
      }
    }

    // Only copy runtime Dockerfile if it does not already exist
    const destRuntimeDockerfile = `${destRuntimeDir}/Dockerfile`;
    generator.fs.copy(dockerfileTpl, destRuntimeDockerfile);
  } catch {
    /* ignore */
  }
}

export function rmIfExists(generator, path) {
  if (generator.fs.exists(path)) {
    generator.fs.delete(path);
  }
}

export function copyCommonBuildWorkflows(generator, answers) {
  const relativePath = relativeGitPath();

  ensureRepoDirs();
  copyRepoSupportFiles(generator);

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/build-intention.json`),
    destinationGitPath(
      `.github/workflows/build-intention-${answers.serviceName}.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
      license: answers.license,
      packageArchitecture: answers.packageArchitecture,
      packageType: answers.packageType,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/build-intention.sh`),
    destinationGitPath(
      `.github/workflows/build-intention-${answers.serviceName}.sh`,
    ),
    {
      serviceName: answers.serviceName,
      relativePath,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/preflight.yaml`),
    destinationGitPath('.github/workflows/preflight.yaml'),
  );
  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/check-token.yaml`),
    destinationGitPath('.github/workflows/check-token.yaml'),
  );

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_TEMPLATE_PATH}/check-release-package.yaml`,
    ),
    destinationGitPath(`.github/workflows/check-release-package.yaml`),
  );

  // Clean up old files if they exist (may remove in future)
  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/build-intention.json'),
  );
  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/build-intention.sh'),
  );
}

export function copyCommonDeployWorkflows(generator, answers) {
  const relativePath = relativeGitPath();

  ensureRepoDirs();
  copyRepoSupportFiles(generator);

  const brokerJwt = answers.clientId.trim()
    ? `broker-jwt:${answers.clientId.trim()}`.replace(/[^a-zA-Z0-9_]/g, '_')
    : 'BROKER_JWT';

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/check-build-artifact.yaml`),
    destinationGitPath('.github/workflows/check-build-artifact.yaml'),
    {
      gitHubProjectSlug: answers.gitHubProjectSlug,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_TEMPLATE_PATH}/check-deploy-job-status.sh`,
    ),
    destinationGitPath('.github/workflows/check-deploy-job-status.sh'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/deployment-intention.json`),
    destinationGitPath(
      `.jenkins/${answers.serviceName}-deployment-intention.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_TEMPLATE_PATH}/run-deploy.yaml`),
    destinationGitPath(
      `.github/workflows/run-deploy-${answers.serviceName}.yaml`,
    ),
    {
      serviceName: answers.serviceName,
      brokerJwt,
      buildWorkflowFile: makeWorkflowBuildPublishFile(answers.serviceName),
      relativePath,
      deployWorkflowFile: makeWorkflowDeployFile(answers.serviceName),
    },
  );

  // Clean up old files if they exist (may remove in future)
  rmIfExists(
    generator,
    generator.destinationPath('.jenkins/deployment-intention.json'),
  );
}
