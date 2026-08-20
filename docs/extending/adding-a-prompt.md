# Adding a New Prompt

Prompts are defined once in `src/util/prompts.ts` and reused across generators.
Adding a new prompt is a four-step process.

## 1. Define the prompt

Add a new `PromptQuestion` to `src/util/prompts.ts`:

```ts
export const PROMPT_NAME: PromptQuestion = {
  type: 'input',   // or 'confirm', 'list', 'checkbox'
  name: 'propertyName',
  message: 'User-facing question:',
  default: 'default-value',
  validate: alphaDashValidate,   // optional
};
```

Common prompt types:

- `input` — free-text entry
- `confirm` — yes/no
- `list` — single choice from a list
- `checkbox` — multiple choices

## 2. Add documentation

Add an entry to `PROMPT_TO_USAGE` in the same file so `--help-prompts` can
describe it:

```ts
propertyName: {
  description: 'What this prompt is for',
  example: 'example-value',
},
```

## 3. Import and add to the generator

Import the prompt and add it to the generator's `questions` array (for example,
`src/backstage/index.ts`):

```ts
import { PROMPT_NAME } from '../util/prompts.js';

const questions = [
  // ... other prompts
  PROMPT_NAME,
];
```

## 4. Map to a YAML path

Map the prompt answer into `catalog-info.yaml` by adding an entry to
`pathToProps` in `src/util/yaml.ts`. See
[YAML Path Mappings](yaml-mappings.md) for the full details.

```ts
export const pathToProps = [
  // ... other mappings
  {
    path: ['metadata', 'annotations', 'custom/key'],   // YAML path
    prop: 'propertyName',   // Property from prompt
    writeEmpty: false,   // Whether to write empty values
    csv: false,   // Set true to split comma-separated values into an array
   },
];
```

## Verify

Rebuild and run the generator with `--help-prompts` to confirm the new prompt
appears and is documented:

```bash
npm run build
npx yo nr-repository-composer:backstage --help-prompts
```
