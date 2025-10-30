import { generateSetAnswerPropPredicate } from '../util/yaml.js';

function bailOnAnyQuestions(questions, headless) {
  if (questions.length > 0 && headless) {
    // Bail if any questions exist
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
