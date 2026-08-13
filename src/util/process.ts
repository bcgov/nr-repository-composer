import { generateSetAnswerPropPredicate } from '../util/yaml.js';

function bailOnAnyQuestions(questions, headless) {
  if (questions.length > 0 && headless) {
    const questionNames = Array.from(
      new Set(questions.map((question) => question.name).filter(Boolean)),
    );

    console.error('Headless mode failed: required prompt values are missing.');
    if (questionNames.length > 0) {
      console.error(`Missing prompt values: ${questionNames.join(', ')}`);
    }
    console.error(
      'Run without --headless, or run with --ask-answered to set and persist required values first.',
    );

    process.exit(1);
  }
}

export function bailOnUnansweredQuestions(
  questions,
  answers,
  headless,
  askAnswered,
) {
  /**
   * Whether prompts that have already been answered should be preserved.
   *
   * This boolean is true only when the process is interactive (not running in
   * headless mode) and the `askAnswered` option/flag is enabled. Otherwise it is
   * false.
   */
  const keepAnswered = !headless && askAnswered;
  bailOnAnyQuestions(
    questions
      .filter(generateSetAnswerPropPredicate(answers, keepAnswered))
      .filter(
        (question) => question.when === undefined || question.when(answers),
      ),
    headless,
  );
}
