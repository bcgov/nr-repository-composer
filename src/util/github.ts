export function makeWorkflowBuildPublishPath(serviceName) {
  return `.github/workflows/${makeWorkflowBuildPublishFile(serviceName)}`;
}

export function makeWorkflowBuildPublishFile(serviceName) {
  return `build-release-${serviceName}.yaml`;
}

export function makeWorkflowDeployPath(serviceName) {
  return `.github/workflows/${makeWorkflowDeployFile(serviceName)}`;
}

export function makeWorkflowDeployFile(serviceName) {
  return `deploy-${serviceName}.yaml`;
}

export function alphaDashValidate(input) {
  const regex = /^[a-z][a-z_0-9-]+$/;
  if (regex.test(input)) {
    return true;
  }
  return 'Must start with a lowercase letter and may only contain lowercase letters, digits, underscores and dashes.';
}
