import { bailOnUnansweredQuestions } from './process.js';
import type { PromptQuestion, PromptAnswers } from 'yeoman-generator';

describe('bailOnUnansweredQuestions', () => {
  const originalExit = process.exit;

  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as unknown as typeof process.exit);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exit = originalExit;
  });

  it('exits when required questions are unanswered in headless mode', () => {
    const questions: PromptQuestion[] = [
      { type: 'input', name: 'serviceName', message: 'Service:' },
    ];
    expect(() => bailOnUnansweredQuestions(questions, {}, true, false)).toThrow(
      'process.exit called',
    );
  });

  it('does not exit when there are no unanswered questions', () => {
    const questions: PromptQuestion[] = [
      { type: 'input', name: 'serviceName', message: 'Service:' },
    ];
    const answers: PromptAnswers = { serviceName: 'my-service' };
    expect(() =>
      bailOnUnansweredQuestions(questions, answers, true, false),
    ).not.toThrow();
  });

  it('does not exit in interactive mode even with unanswered questions', () => {
    const questions: PromptQuestion[] = [
      { type: 'input', name: 'serviceName', message: 'Service:' },
    ];
    expect(() =>
      bailOnUnansweredQuestions(questions, {}, false, false),
    ).not.toThrow();
  });

  it('keeps already-answered questions when askAnswered is set', () => {
    const questions: PromptQuestion[] = [
      { type: 'input', name: 'serviceName', message: 'Service:' },
    ];
    const answers: PromptAnswers = { serviceName: 'my-service' };
    // Interactive + askAnswered => keepAnswered true, so answered questions are
    // not filtered out, but headless is false so no exit occurs.
    expect(() =>
      bailOnUnansweredQuestions(questions, answers, false, true),
    ).not.toThrow();
  });

  it('skips questions whose when() predicate returns false', () => {
    const questions: PromptQuestion[] = [
      {
        type: 'input',
        name: 'serviceName',
        message: 'Service:',
        when: (answers: PromptAnswers) => answers.enable === true,
      },
    ];
    // Question is gated off, so it should not trigger an exit.
    expect(() =>
      bailOnUnansweredQuestions(questions, {}, true, false),
    ).not.toThrow();
  });
});
