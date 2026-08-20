import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  PROMPT_DESCRIPTION,
  PROMPT_LIFECYCLE,
  PROMPT_LICENSE,
  PROMPT_NODE_VERSION,
  PROMPT_JAVA_VERSION,
  PROMPT_ARTIFACT_REPOSITORY_PATH,
  PROMPT_TOOLS_LOCAL_BUILD_SECRETS,
  PROMPT_TO_USAGE,
  getPromptToUsage,
} from './prompts.js';

describe('prompt definitions', () => {
  it('validates project and service names with alphaDashValidate', () => {
    expect(PROMPT_PROJECT.validate).toBeDefined();
    expect(PROMPT_SERVICE.validate).toBeDefined();
    expect(PROMPT_PROJECT.validate('good-name')).toBe(true);
    expect(PROMPT_SERVICE.validate('Bad')).not.toBe(true);
  });

  it('provides sensible defaults', () => {
    expect(PROMPT_LIFECYCLE.default).toBe('production');
    expect(PROMPT_LICENSE.default).toBe('Apache-2.0');
    expect(PROMPT_NODE_VERSION.default).toBe('24');
    expect(PROMPT_JAVA_VERSION.default).toBe('8');
  });

  it('derives the artifact repository path from the repository type', () => {
    const defaultFn = PROMPT_ARTIFACT_REPOSITORY_PATH.default as (
      _answers: Record<string, unknown>,
    ) => string;
    expect(
      defaultFn({
        artifactRepositoryType: 'GitHubPackages',
        gitHubProjectSlug: 'bcgov-c/edqa-war',
      }),
    ).toBe('https://maven.pkg.github.com/bcgov-c/edqa-war');
  });

  it('derives local build secrets from the build secrets', () => {
    const defaultFn = PROMPT_TOOLS_LOCAL_BUILD_SECRETS.default as (
      _answers: Record<string, unknown>,
    ) => string;
    expect(defaultFn({ toolsBuildSecrets: 'FOO,BAR' })).toBe('FOO,BAR');
  });
});

describe('getPromptToUsage', () => {
  it('renders a usage string with message, key, and description', () => {
    const usage = getPromptToUsage(PROMPT_PROJECT);
    expect(usage).toContain(PROMPT_PROJECT.message);
    expect(usage).toContain('key: projectName');
    expect(usage).toContain(PROMPT_TO_USAGE.projectName.description);
  });

  it('includes an example when one is defined', () => {
    const usage = getPromptToUsage(PROMPT_PROJECT);
    expect(usage).toContain('Example:');
    expect(usage).toContain(PROMPT_TO_USAGE.projectName.example);
  });

  it('omits the example line when none is defined', () => {
    const usage = getPromptToUsage(PROMPT_DESCRIPTION);
    expect(usage).not.toContain('Example:');
  });
});
