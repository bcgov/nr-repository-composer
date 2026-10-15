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
  PROMPT_AUTO_DEPLOY_EPHEMERAL,
  PROMPT_INSTANCES_ENVS,
  PROMPT_INSTANCE_URL,
  PROMPT_INSTANCES_CUSTOM,
  PROMPT_TO_USAGE,
  getPromptToUsage,
} from './prompts.js';
import { STANDARD_ENVIRONMENTS } from './instances.js';

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
    expect(PROMPT_AUTO_DEPLOY_EPHEMERAL.default).toBe(false);
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

  it('offers the standard instance environments and gates their URL prompts', () => {
    expect(PROMPT_INSTANCES_ENVS.choices).toEqual(STANDARD_ENVIRONMENTS);

    const urlPrompt = PROMPT_INSTANCE_URL('tools');
    expect(urlPrompt.when?.({ instanceEnvs: ['tools'] })).toBe(true);
    expect(urlPrompt.when?.({ instanceEnvs: ['production'] })).toBe(false);
  });

  it('validates custom instances as an array of environment names and optional URLs', () => {
    const validate = PROMPT_INSTANCES_CUSTOM.validate as (
      _input: string,
    ) => true | string;

    expect(validate('')).toBe(true);
    expect(validate('[{"env":"staging"}]')).toBe(true);
    expect(validate('[{"env":"staging","url":"https://stage.example"}]')).toBe(
      true,
    );
    expect(validate('[{"url":"https://stage.example"}]')).toEqual(
      expect.any(String),
    );
    expect(validate('{invalid')).toEqual(expect.any(String));
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
