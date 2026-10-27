import { parseDocument } from 'yaml';
import {
  getInstanceName,
  instanceFromDoc,
  parseInstances,
} from './instances.js';

describe('instance catalog helpers', () => {
  it('parses valid instances and ignores malformed entries', () => {
    expect(
      parseInstances(
        '[{"env":"production","url":" https://app.example.gov.bc.ca "},{"env":"production","name":"blue","url":"https://blue.example.gov.bc.ca"},{"env":"tools","name":"tools"},{"url":"https://invalid.example"}]',
      ),
    ).toEqual([
      { env: 'production', url: 'https://app.example.gov.bc.ca' },
      {
        env: 'production',
        name: 'blue',
        url: 'https://blue.example.gov.bc.ca',
      },
      { env: 'tools' },
    ]);
    expect(parseInstances('not-json')).toEqual([]);
  });

  it('defaults the instance name to its environment', () => {
    expect(getInstanceName({ env: 'test' })).toBe('test');
    expect(getInstanceName({ env: 'test', name: 'blue' })).toBe('blue');
  });

  it('reads the instance described by an Instance document', () => {
    const doc = parseDocument(`kind: Instance
spec:
  env: production
  url: https://app.example.gov.bc.ca
`);
    expect(instanceFromDoc(doc)).toEqual({
      env: 'production',
      url: 'https://app.example.gov.bc.ca',
    });
    expect(instanceFromDoc(parseDocument('kind: Instance'))).toBeUndefined();
  });
});
