import {
  makeWorkflowBuildPublishPath,
  makeWorkflowBuildPublishFile,
  makeWorkflowDeployPath,
  makeWorkflowDeployFile,
  alphaDashValidate,
} from './github.js';

describe('github workflow path helpers', () => {
  it('builds a build-release file name', () => {
    expect(makeWorkflowBuildPublishFile('my-service')).toBe(
      'build-release-my-service.yaml',
    );
  });

  it('builds a build-release workflow path', () => {
    expect(makeWorkflowBuildPublishPath('my-service')).toBe(
      '.github/workflows/build-release-my-service.yaml',
    );
  });

  it('builds a deploy file name', () => {
    expect(makeWorkflowDeployFile('my-service')).toBe('deploy-my-service.yaml');
  });

  it('builds a deploy workflow path', () => {
    expect(makeWorkflowDeployPath('my-service')).toBe(
      '.github/workflows/deploy-my-service.yaml',
    );
  });
});

describe('alphaDashValidate', () => {
  it('accepts lowercase kebab-case names', () => {
    expect(alphaDashValidate('abc')).toBe(true);
    expect(alphaDashValidate('abc-def')).toBe(true);
    expect(alphaDashValidate('abc_def')).toBe(true);
    expect(alphaDashValidate('abc123')).toBe(true);
    expect(alphaDashValidate('a-b-c-1')).toBe(true);
  });

  it('rejects names that do not start with a lowercase letter', () => {
    expect(alphaDashValidate('Abc')).not.toBe(true);
    expect(alphaDashValidate('1abc')).not.toBe(true);
    expect(alphaDashValidate('_abc')).not.toBe(true);
  });

  it('rejects names with invalid characters', () => {
    expect(alphaDashValidate('abc def')).not.toBe(true);
    expect(alphaDashValidate('abc.def')).not.toBe(true);
    expect(alphaDashValidate('ABC')).not.toBe(true);
  });

  it('rejects single-character names', () => {
    expect(alphaDashValidate('a')).not.toBe(true);
  });

  it('returns a descriptive message on failure', () => {
    const result = alphaDashValidate('Bad');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/lowercase/);
  });
});
