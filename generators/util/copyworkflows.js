import { destinationGitPath, relativeGitPath } from './git.js';

export function copyCommonBuildWorkflows(generator, answers) {
  const commonTemplatePath = '../../gh-common-template';
  const relativePath = relativeGitPath();

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/build-intention.json`),
    destinationGitPath(
      `.github/workflows/build-intention${relativePath ? `-${answers.serviceName}` : ''}.json`,
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
    generator.templatePath(`${commonTemplatePath}/build-intention.sh`),
    destinationGitPath(
      `.github/workflows/build-intention${relativePath ? `-${answers.serviceName}` : ''}.sh`,
    ),
    {
      serviceName: answers.serviceName,
      relativePath,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/preflight.yaml`),
    destinationGitPath('.github/workflows/preflight.yaml'),
  );
  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/check-token.yaml`),
    destinationGitPath('.github/workflows/check-token.yaml'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/check-release-package.yaml`),
    destinationGitPath(`.github/workflows/check-release-package.yaml`),
  );
}

export function copyCommonDeployWorkflows(generator, answers) {
  const commonTemplatePath = '../../gh-common-template';
  const relativePath = relativeGitPath();

  const brokerJwt = answers.clientId.trim()
    ? `broker-jwt:${answers.clientId.trim()}`.replace(/[^a-zA-Z0-9_]/g, '_')
    : 'BROKER_JWT';

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/check-deploy-job-status.sh`),
    destinationGitPath('.github/workflows/check-deploy-job-status.sh'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/deployment-intention.json`),
    destinationGitPath(
      `.jenkins/${answers.serviceName}-deployment-intention.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
    },
  );

  if (
    generator.fs.exists(
      generator.destinationPath('.jenkins/deployment-intention.json'),
    )
  ) {
    generator.fs.delete(
      generator.destinationPath('.jenkins/deployment-intention.json'),
    );
  }

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/run-deploy.yaml`),
    destinationGitPath(
      `.github/workflows/run-deploy${relativePath ? `-${answers.serviceName}` : ''}.yaml`,
    ),
    {
      serviceName: answers.serviceName,
      brokerJwt,
      deployWorkflowFile: `deploy${relativePath ? `-${answers.serviceName}` : ''}.yaml`,
    },
  );
}
