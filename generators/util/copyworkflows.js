export function copyCommonBuildWorkflows(generator, answers) {
  const commonTemplatePath = '../../gh-common-template';

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/build-intention.json`),
    generator.destinationPath(`.github/workflows/build-intention.json`),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
      license: answers.license,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/build-intention.sh`),
    generator.destinationPath('.github/workflows/build-intention.sh'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/check-token.yaml`),
    generator.destinationPath('.github/workflows/check-token.yaml'),
  );
}

export function copyCommonDeployWorkflows(generator, answers) {
  const commonTemplatePath = '../../gh-common-template';

  const brokerJwt = answers.clientId.trim()
    ? `broker-jwt:${answers.clientId.trim()}`.replace(/[^a-zA-Z0-9_]/g, '_')
    : 'BROKER_JWT';

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/check-deploy-job-status.sh`),
    generator.destinationPath('.github/workflows/check-deploy-job-status.sh'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/deployment-intention.json`),
    generator.destinationPath(
      `.jenkins/${answers.serviceName}-deployment-intention.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
    },
  );
  generator.fs.copyTpl(
    generator.templatePath(`${commonTemplatePath}/run-deploy.yaml`),
    generator.destinationPath('.github/workflows/run-deploy.yaml'),
    {
      serviceName: answers.serviceName,
      brokerJwt,
    },
  );
}
