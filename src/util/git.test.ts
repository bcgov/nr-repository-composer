import {
  extractGitHubSlug,
  findGitRepoOrigin,
  destinationGitPath,
  relativeGitPath,
  isMonoRepo,
  getGitRepoOriginUrl,
} from './git.js';
import path from 'path';

describe('extractGitHubSlug', () => {
  it('extracts the slug from an https GitHub URL', () => {
    expect(extractGitHubSlug('https://github.com/bcgov-c/edqa-war')).toBe(
      'bcgov-c/edqa-war',
    );
  });

  it('extracts the slug from an http GitHub URL', () => {
    expect(extractGitHubSlug('http://github.com/bcgov-c/edqa-war')).toBe(
      'bcgov-c/edqa-war',
    );
  });

  it('extracts the slug from a www-prefixed URL', () => {
    expect(extractGitHubSlug('https://www.github.com/bcgov-c/edqa-war')).toBe(
      'bcgov-c/edqa-war',
    );
  });

  it('extracts the slug from a protocol-less URL', () => {
    expect(extractGitHubSlug('github.com/bcgov-c/edqa-war')).toBe(
      'bcgov-c/edqa-war',
    );
  });

  it('returns null for non-GitHub URLs', () => {
    expect(extractGitHubSlug('https://gitlab.com/bcgov-c/edqa-war')).toBeNull();
    expect(extractGitHubSlug('https://example.com/foo/bar')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(extractGitHubSlug(null)).toBeNull();
    expect(extractGitHubSlug(undefined)).toBeNull();
    expect(extractGitHubSlug(123 as unknown as string)).toBeNull();
  });
});

describe('findGitRepoOrigin', () => {
  it('finds the .git/config when run from within a git repository', () => {
    const result = findGitRepoOrigin(process.cwd());
    expect(result).not.toBeNull();
    expect(result).toBe(path.join(process.cwd(), '.git', 'config'));
  });
});

describe('destinationGitPath', () => {
  it('returns absolute paths unchanged', () => {
    const abs = path.join(process.cwd(), 'some', 'file.yaml');
    expect(destinationGitPath(abs)).toBe(abs);
  });
});

describe('relativeGitPath / isMonoRepo', () => {
  it('computes a relative path from the git root', () => {
    const rel = relativeGitPath(process.cwd());
    expect(typeof rel).toBe('string');
  });

  it('returns a boolean', () => {
    expect(typeof isMonoRepo()).toBe('boolean');
  });
});

describe('getGitRepoOriginUrl', () => {
  it('returns the configured origin URL (or null when absent)', () => {
    const url = getGitRepoOriginUrl();
    expect(url === null || typeof url === 'string').toBe(true);
  });
});
