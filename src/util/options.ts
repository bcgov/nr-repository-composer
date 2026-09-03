export const OPTION_HEADLESS = {
  name: 'headless',
  type: Boolean,
  required: false,
  description: 'Exit with error if any prompt is required',
  default: false,
};

export const OPTION_HELP_PROMPTS = {
  name: 'help-prompts',
  type: Boolean,
  required: false,
  description: "Print the generator's prompts and usage",
  default: false,
};

export const OPTION_SKIP_WRITE = {
  name: 'skip-write',
  type: Boolean,
  required: false,
  description: 'Skip writing generator answers back to catalog-info.yaml',
  default: false,
};
