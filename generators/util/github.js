export function makeWorkflowBuildPublishPath(serviceName, isMonoRepo) {
  return `.github/workflows/build-release${isMonoRepo ? `-${serviceName}` : ''}.yaml`;
}

export function makeWorkflowDeployPath(serviceName, isMonoRepo) {
  return `.github/workflows/deploy${isMonoRepo ? `-${serviceName}` : ''}.yaml`;
}

export function alphaDashValidate(input) {
  const regex = /^[a-z][a-z_0-9-]+$/;
  if (regex.test(input)) {
    return true;
  }
  return 'Must start with a lowercase letter and may only contain lowercase letters, digits, underscores and dashes.';
}
