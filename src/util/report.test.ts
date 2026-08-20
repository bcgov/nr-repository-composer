import {
  ALL_GENERATORS,
  GENERATOR_ANCHORS,
  GENERATOR_REPORTS,
  patternToRegex,
  expandGeneratorPattern,
  outputReport,
} from './report.js';

describe('patternToRegex', () => {
  it('converts a wildcard pattern to an anchored regex', () => {
    const regex = patternToRegex('gh-*-build');
    expect(regex.test('gh-maven-build')).toBe(true);
    expect(regex.test('gh-nodejs-build')).toBe(true);
    expect(regex.test('gh-oci-deploy-onprem')).toBe(false);
  });

  it('escapes regex special characters in the pattern', () => {
    const regex = patternToRegex('a.b');
    expect(regex.test('a.b')).toBe(true);
    expect(regex.test('axb')).toBe(false);
  });
});

describe('expandGeneratorPattern', () => {
  it('returns the pattern itself when it contains no wildcard', () => {
    expect(expandGeneratorPattern('backstage')).toEqual(['backstage']);
  });

  it('expands a wildcard pattern to matching generator names', () => {
    const matches = expandGeneratorPattern('gh-*-build');
    expect(matches).toContain('gh-maven-build');
    expect(matches).toContain('gh-nodejs-build');
    expect(matches).not.toContain('gh-oci-deploy-onprem');
  });

  it('returns an empty array when nothing matches', () => {
    expect(expandGeneratorPattern('no-such-*-generator')).toEqual([]);
  });
});

describe('report metadata', () => {
  it('includes every generator in ALL_GENERATORS in GENERATOR_ANCHORS', () => {
    for (const gen of ALL_GENERATORS) {
      expect(GENERATOR_ANCHORS[gen]).toBeDefined();
      expect(typeof GENERATOR_ANCHORS[gen]).toBe('string');
    }
  });

  it('includes every generator in ALL_GENERATORS in GENERATOR_REPORTS', () => {
    for (const gen of ALL_GENERATORS) {
      expect(GENERATOR_REPORTS[gen]).toBeDefined();
      expect(typeof GENERATOR_REPORTS[gen].description).toBe('string');
    }
  });
});

describe('outputReport', () => {
  it('logs a report for a known generator', () => {
    const logs: string[] = [];
    const generator = { log: (msg: string) => logs.push(msg) };
    outputReport(generator, 'backstage', { serviceName: 'my-service' });
    expect(logs.join('\n')).toMatch(/Generator Complete/);
    expect(logs.join('\n')).toMatch(/Backstage component catalog/);
  });

  it('does nothing for an unknown generator', () => {
    const logs: string[] = [];
    const generator = { log: (msg: string) => logs.push(msg) };
    outputReport(generator, 'does-not-exist', {});
    expect(logs).toHaveLength(0);
  });

  it('resolves function-valued workflows using answers', () => {
    const logs: string[] = [];
    const generator = { log: (msg: string) => logs.push(msg) };
    outputReport(generator, 'gh-nodejs-build', { serviceName: 'svc' });
    expect(logs.join('\n')).toMatch(
      /\.github\/workflows\/build-release-svc\.yaml/,
    );
  });
});
