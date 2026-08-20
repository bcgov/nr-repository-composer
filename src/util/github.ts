export function makeWorkflowBuildPublishPath(serviceName: string): string {
  return `.github/workflows/${makeWorkflowBuildPublishFile(serviceName)}`;
}

export function makeWorkflowBuildPublishFile(serviceName: string): string {
  return `build-release-${serviceName}.yaml`;
}

export function makeWorkflowDeployPath(serviceName: string): string {
  return `.github/workflows/${makeWorkflowDeployFile(serviceName)}`;
}

export function makeWorkflowDeployFile(serviceName: string): string {
  return `deploy-${serviceName}.yaml`;
}

export function alphaDashValidate(input: string): true | string {
  const regex = /^[a-z][a-z_0-9-]+$/;
  if (regex.test(input)) {
    return true;
  }
  return 'Must start with a lowercase letter and may only contain lowercase letters, digits, underscores and dashes.';
}
