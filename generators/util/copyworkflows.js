import * as fs from 'fs';
import {
  destinationGitPath,
  relativeGitPath,
  ensureLocalMavenSupportDirs,
} from './git.js';
import {
  makeWorkflowBuildPublishFile,
  makeWorkflowDeployFile,
} from '../util/github.js';

const COMMON_TEMPLATE_PATH = '../../util/gh-workflow-template';

export function rmIfExists(generator, path) {
  if (generator.fs.exists(path)) {
    generator.fs.delete(path);
  }
}

export function copyCommonBuildWorkflows(generator, answers, opts = {}) {
  const relativePath = relativeGitPath();

  if (opts && opts.copyRepoSupportFiles) {
    ensureLocalMavenSupportDirs();
    copyLocalMavenSupportFiles(generator);
  }

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

export function copyCommonDeployWorkflows(generator, answers, opts = {}) {
  const relativePath = relativeGitPath();

  if (opts && opts.copyRepoSupportFiles) {
    ensureLocalMavenSupportDirs();
    copyLocalMavenSupportFiles(generator);
  }

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

function copyLocalMavenSupportFiles(generator) {
  const templateBase = `${COMMON_TEMPLATE_PATH}/local-maven-build-support`;
  const destM2Repo = destinationGitPath('.m2repo');

  // Ensure .m2repo directory exists
  if (!fs.existsSync(destM2Repo)) {
    fs.mkdirSync(destM2Repo, { recursive: true });
  }

  // copy root scripts and .docker files to disk so they're immediately available
  try {
    const buildTpl = generator.templatePath(`${templateBase}/build.sh`);
    const destBuild = destinationGitPath('build.sh');
    // Always copy build.sh to disk
    if (!fs.existsSync(destBuild)) {
      try {
        fs.copyFileSync(buildTpl, destBuild);
        fs.chmodSync(destBuild, 0o755);
        generator.log("Copied local Maven support 'build.sh' script.");
      } catch (err) {
        generator.log('Warn: failed to copy build.sh to disk: ' + err);
      }
    }

    const setenvTpl = generator.templatePath(
      `${templateBase}/.docker/setenv.sh`,
    );
    const dockerfileTpl = generator.templatePath(
      `${templateBase}/.docker/runtime/Dockerfile`,
    );

    const destSetenv = destinationGitPath('.docker/setenv.sh');
    const destRuntimeDir = destinationGitPath('.docker/runtime');
    // copy .docker files (ensure runtime dir exists)
    if (!fs.existsSync(destRuntimeDir)) {
      try {
        fs.mkdirSync(destRuntimeDir, { recursive: true });
      } catch (err) {
        generator.log(
          'Warn: failed to create .docker/runtime directory: ' + err,
        );
      }
    }
    generator.log('Ensured local Maven support runtime folder exists.');

    const destRuntimeDockerfile = `${destRuntimeDir}/Dockerfile`;
    try {
      if (!fs.existsSync(destRuntimeDockerfile)) {
        fs.copyFileSync(dockerfileTpl, destRuntimeDockerfile);
        generator.log("Copied local Maven support 'Dockerfile' file.");
      }
    } catch (err) {
      generator.log('Warn: failed to copy Dockerfile to disk: ' + err);
    }

    // Only copy setenv.sh if it does not already exist on disk
    try {
      if (!fs.existsSync(destSetenv)) {
        fs.copyFileSync(setenvTpl, destSetenv);
        fs.chmodSync(destSetenv, 0o644);
        generator.log("Copied local Maven support 'setenv.sh' script.");
      }
    } catch (err) {
      generator.log('Warn: failed to copy setenv.sh to disk: ' + err);
    }
  } catch (err) {
    generator.log('Warn: failed to set local support folder and files: ' + err);
  }
}
