import { BaseGenerator } from './base-generator.js';
import { YEOMAN_OPTION_ASK_ANSWERED } from './constants.js';
import { OPTION_HEADLESS } from './options.js';
import { PROMPT_CUSTOM_RUNNER } from './prompts.js';
import type { PromptQuestion } from 'yeoman-generator';

jest.mock('yeoman-generator', () => ({
  __esModule: true,
  default: class {},
}));

describe('BaseGenerator prompting', () => {
  function makeGenerator(headless: boolean) {
    const storedAnswers: Record<string, unknown> = {};
    const backstageConfig = {
      getAnswers: jest.fn(() => ({ ...storedAnswers })),
      processAssumeDefaultValue: jest.fn(
        (questions: PromptQuestion[], persist?: boolean) => {
          const runnerQuestion = questions.find(
            (question) => question.name === PROMPT_CUSTOM_RUNNER.name,
          );
          if (
            runnerQuestion &&
            !persist &&
            !(PROMPT_CUSTOM_RUNNER.name in storedAnswers)
          ) {
            storedAnswers[PROMPT_CUSTOM_RUNNER.name] = runnerQuestion.default;
          }
        },
      ),
    };
    const generator = {
      options: {
        [OPTION_HEADLESS.name]: headless,
        [YEOMAN_OPTION_ASK_ANSWERED]: false,
      },
      backstageConfig,
      _questions: [PROMPT_CUSTOM_RUNNER],
      _prePrompt: jest.fn(),
      _printIntro: jest.fn(),
      prompt: jest.fn(async () => backstageConfig.getAnswers()),
      _postPrompt: jest.fn(),
    } as unknown as BaseGenerator;

    return { generator, backstageConfig };
  }

  it('uses assumed defaults in headless mode before validation', async () => {
    const { generator, backstageConfig } = makeGenerator(true);

    await BaseGenerator.prototype.prompting.call(generator);

    expect(backstageConfig.processAssumeDefaultValue).toHaveBeenCalledWith(
      [PROMPT_CUSTOM_RUNNER],
      false,
    );
    expect(generator.prompt).toHaveBeenCalled();
    expect(generator.answers).toEqual({
      [PROMPT_CUSTOM_RUNNER.name]: PROMPT_CUSTOM_RUNNER.default,
    });
  });

  it('also assumes defaults in interactive mode', async () => {
    const { generator, backstageConfig } = makeGenerator(false);

    await BaseGenerator.prototype.prompting.call(generator);

    expect(backstageConfig.processAssumeDefaultValue).toHaveBeenCalledWith(
      [PROMPT_CUSTOM_RUNNER],
      false,
    );
  });
});
