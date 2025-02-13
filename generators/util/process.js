export function bailOnAnyQuestions(headless) {
  return (question) => {
    if (headless) {
      // Bail if any questions exist
      process.exit(1);
    }
    return question;
  };
}
