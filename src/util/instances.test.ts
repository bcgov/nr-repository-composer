import {
  mergeInstances,
  parseInstances,
  prefillInstancePrompts,
  shouldSkipInstancePrompts,
  STANDARD_ENVIRONMENTS,
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

  it('prefills standard environments and URL values from stored instances', () => {
    const prefill = prefillInstancePrompts([
      { env: 'production', url: 'https://app.example.gov.bc.ca' },
      {
        env: 'production',
        name: 'blue',
        url: 'https://blue.example.gov.bc.ca',
      },
      { env: 'staging', url: 'https://staging.example.gov.bc.ca' },
    ]);

    expect(prefill.selectedEnvs).toEqual(['production']);
    expect(prefill.urlByEnv.get('production')).toBe(
      'https://app.example.gov.bc.ca',
    );
    expect(prefill.urlByEnv.get('staging')).toBe(
      'https://staging.example.gov.bc.ca',
    );
  });

  it('merges current standard selections and custom entries with stored values', () => {
    const instances = mergeInstances({
      stored: [
        { env: 'development', url: 'https://old-dev.example.gov.bc.ca' },
        { env: 'test', url: 'https://test.example.gov.bc.ca' },
        { env: 'staging', url: 'https://old-staging.example.gov.bc.ca' },
        {
          env: 'development',
          name: 'canary',
          url: 'https://old-canary.example.gov.bc.ca',
        },
      ],
      selectedEnvs: ['tools', 'development', 'production'],
      urlByEnv: {
        production: 'https://app.example.gov.bc.ca',
      },
      custom: [
        { env: 'staging', url: 'https://staging.example.gov.bc.ca' },
        {
          env: 'development',
          name: 'canary',
          url: 'https://canary.example.gov.bc.ca',
        },
      ],
    });

    expect(instances).toEqual([
      { env: 'tools' },
      { env: 'development', url: 'https://old-dev.example.gov.bc.ca' },
      { env: 'production', url: 'https://app.example.gov.bc.ca' },
      { env: 'staging', url: 'https://staging.example.gov.bc.ca' },
      {
        env: 'development',
        name: 'canary',
        url: 'https://canary.example.gov.bc.ca',
      },
    ]);
    expect(STANDARD_ENVIRONMENTS).toEqual([
      'tools',
      'development',
      'test',
      'production',
    ]);
  });

  it('removes custom instances omitted from the edited custom list', () => {
    expect(
      mergeInstances({
        stored: [{ env: 'staging', url: 'https://staging.example.gov.bc.ca' }],
        selectedEnvs: [],
        urlByEnv: {},
        custom: [],
      }),
    ).toEqual([]);
  });

  it('uses the environment as the default name and permits multiple named instances per environment', () => {
    expect(
      mergeInstances({
        stored: [],
        selectedEnvs: ['test'],
        urlByEnv: { test: 'https://test.example.gov.bc.ca' },
        custom: [
          { env: 'test', name: 'blue', url: 'https://blue.example.gov.bc.ca' },
          {
            env: 'test',
            name: 'green',
            url: 'https://green.example.gov.bc.ca',
          },
        ],
      }),
    ).toEqual([
      { env: 'test', url: 'https://test.example.gov.bc.ca' },
      { env: 'test', name: 'blue', url: 'https://blue.example.gov.bc.ca' },
      { env: 'test', name: 'green', url: 'https://green.example.gov.bc.ca' },
    ]);
  });

  it('skips instance prompts when values exist unless answered prompts are requested', () => {
    const storedInstances = [
      { env: 'production', name: 'APM' },
      { env: 'production', name: 'Knox' },
      { env: 'production', name: 'Polaris' },
    ];

    expect(shouldSkipInstancePrompts(storedInstances, false)).toBe(true);
    expect(shouldSkipInstancePrompts(storedInstances, true)).toBe(false);
    expect(shouldSkipInstancePrompts([], false)).toBe(false);
  });
});
