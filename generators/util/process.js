export function bailOnAnyQuestions(questions, headless) {
  if (questions.length > 0 && headless) {
    // Bail if any questions exist
    process.exit(1);
  }
}
