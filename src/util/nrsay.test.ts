import { nrsay } from './nrsay.js';

describe('nrsay', () => {
  it('includes the title and subtitle', () => {
    const output = nrsay('Title', 'Subtitle');
    expect(output).toContain('Title');
    expect(output).toContain('Subtitle');
  });

  it('renders provided links as label: url pairs', () => {
    const output = nrsay('Title', 'Subtitle', [
      ['Docs', 'https://example.com/docs'],
      ['Repo', 'https://example.com/repo'],
    ]);
    expect(output).toContain('Docs: https://example.com/docs');
    expect(output).toContain('Repo: https://example.com/repo');
  });

  it('works with no links', () => {
    const output = nrsay('Title', 'Subtitle');
    expect(typeof output).toBe('string');
    expect(output).toContain('Title');
  });
});
