import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from './options.js';

describe('generator options', () => {
  it('defines the headless option', () => {
    expect(OPTION_HEADLESS.name).toBe('headless');
    expect(OPTION_HEADLESS.type).toBe(Boolean);
    expect(OPTION_HEADLESS.required).toBe(false);
    expect(OPTION_HEADLESS.default).toBe(false);
  });

  it('defines the help-prompts option', () => {
    expect(OPTION_HELP_PROMPTS.name).toBe('help-prompts');
    expect(OPTION_HELP_PROMPTS.type).toBe(Boolean);
    expect(OPTION_HELP_PROMPTS.required).toBe(false);
    expect(OPTION_HELP_PROMPTS.default).toBe(false);
  });
});
