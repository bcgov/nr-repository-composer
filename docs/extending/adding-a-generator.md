# Adding a New Generator

A generator is a Yeoman generator that prompts for information and writes
templated files. This guide scaffolds a new generator from scratch.

## 1. Create the generator directory

Create a new directory under `src/`, for example `src/gh-my-generator/`. Each
subdirectory of `src/` becomes a generator.

## 2. Add the generator class

Create `src/gh-my-generator/index.ts`. Extend `BaseGenerator` and set the
instance properties in the constructor:

```ts
import { BaseGenerator } from '../util/base-generator.js';
import { PROMPT_PROJECT, PROMPT_SERVICE } from '../util/prompts.js';

const questions = [PROMPT_PROJECT, PROMPT_SERVICE];

/**
 * Generate a my-generator file
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'My Generator',
      subtitle: 'Does a thing',
      links: [
         ['Generator', 'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#gh-my-generator'],
         ['Documentation', 'https://example.com'],
        ],
      };
    this._questions = questions;
    }

  writing() {
    this.fs.copyTpl(
      this.templatePath('template.yaml'),
      this.destinationPath('output.yaml'),
       { variable: this.answers.variable },
      );
    }
}
```

The `BaseGenerator` handles the prompting lifecycle, storage, and reporting for
you. You only need to implement the `writing*()` methods that generate files.

## 3. Add templates

Create a `templates/` folder inside the generator directory with EJS templates.
Templates are copied to the destination with `this.fs.copyTpl`, substituting
prompt answers from `this.answers`.

## 4. Map prompt answers to YAML (if needed)

If your generator writes to `catalog-info.yaml`, add entries to `pathToProps` in
`src/util/yaml.ts`. See [YAML Path Mappings](yaml-mappings.md).

## 5. Build and test

```bash
npm run build
npx yo nr-repository-composer:gh-my-generator --help-prompts
```

## 6. Document it

Add the generator to the [Generators](../using/generators.md) reference table and
write a short description. Keep the description focused on what the generator
does, where its output appears, and suggested next steps.

## Generator structure reference

All generators extend Yeoman's `Generator` class (via `BaseGenerator`):

```ts
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);    // For CI/CD
    this.option(OPTION_HELP_PROMPTS);    // Show prompt help
    }

  async prompting() {
    // Display help and collect answers
    this.answers = await this.prompt(questions, YEOMAN_CONFIG_NAMESPACE);
    }

  writing() {
    // Generate files from templates
    this.fs.copyTpl(
      this.templatePath('template.yaml'),
      this.destinationPath('output.yaml'),
       { variable: this.answers.value },
      );
    }
}
```
