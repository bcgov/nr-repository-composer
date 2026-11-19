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
  PROMPT_INSTANCE_ENV,
  PROMPT_INSTANCE_NAME,
  PROMPT_INSTANCE_URL,
  PROMPT_API_DEFINITION,
  PROMPT_API_OWNER,
  PROMPT_API_TYPE,
  PROMPT_SYSTEM_NAME,
  PROMPT_SYSTEM_DESCRIPTION,
  PROMPT_SYSTEM_OWNER,
  PROMPT_SYSTEM_DOMAIN,
  PROMPT_TO_USAGE,
  getPromptToLongMessage,
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

  it('limits the instance environment to the standard environments and documents each instance prompt', () => {
    expect(PROMPT_INSTANCE_ENV.type).toBe('select');
    expect(PROMPT_INSTANCE_ENV.choices).toEqual([...STANDARD_ENVIRONMENTS]);

    for (const prompt of [
      PROMPT_INSTANCE_ENV,
      PROMPT_INSTANCE_NAME,
      PROMPT_INSTANCE_URL,
    ]) {
      expect(PROMPT_TO_USAGE[prompt.name]).toBeDefined();
    }
  });

  it('requires an absolute URL for each deployed instance link', () => {
    expect(PROMPT_INSTANCE_URL.validate('https://app.example.gov.bc.ca')).toBe(
      true,
    );
    expect(PROMPT_INSTANCE_URL.validate('')).not.toBe(true);
    expect(PROMPT_INSTANCE_URL.validate('/relative/path')).not.toBe(true);
  });

  it('requires API type, owner, and definition values', () => {
    expect(PROMPT_API_TYPE.validate('openapi')).toBe(true);
    expect(PROMPT_API_TYPE.validate('')).not.toBe(true);
    expect(PROMPT_API_OWNER.validate('artist-relations-team')).toBe(true);
    expect(PROMPT_API_OWNER.validate('')).not.toBe(true);
    expect(PROMPT_API_DEFINITION.validate('openapi: "3.0.0"')).toBe(true);
    expect(PROMPT_API_DEFINITION.validate('')).not.toBe(true);
  });

  it('requires valid System names and non-empty owners', () => {
    expect(PROMPT_SYSTEM_NAME.validate('artist-portal')).toBe(true);
    expect(PROMPT_SYSTEM_NAME.validate('Bad name')).not.toBe(true);
    expect(PROMPT_SYSTEM_NAME.validate('')).not.toBe(true);
    expect(PROMPT_SYSTEM_OWNER.validate('group:artists')).toBe(true);
    expect(PROMPT_SYSTEM_OWNER.validate('  ')).not.toBe(true);
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

describe('getPromptToLongMessage', () => {
  it.each([
    [PROMPT_SYSTEM_NAME, 'metadata.name'],
    [PROMPT_SYSTEM_DESCRIPTION, 'metadata.description'],
    [PROMPT_SYSTEM_OWNER, 'spec.owner'],
    [PROMPT_SYSTEM_DOMAIN, 'spec.domain'],
  ])('formats $0.name with its Backstage path', (prompt, path) => {
    const message = getPromptToLongMessage(prompt);
    expect(message).toContain(prompt.message);
    expect(message).toContain('\n❯');
    expect(message).toContain(`Backstage: ${path}`);
  });

  it('includes the Backstage path for document-backed prompts', () => {
    const message = getPromptToLongMessage(PROMPT_DESCRIPTION);
    expect(message).toContain(PROMPT_DESCRIPTION.message);
    expect(message).toContain('Backstage: metadata.description');
  });

  it('omits the Backstage path for composer-owned prompts', () => {
    const message = getPromptToLongMessage(PROMPT_NODE_VERSION);
    expect(message).toContain(PROMPT_NODE_VERSION.message);
    expect(message).not.toContain('Backstage:');
  });
});
