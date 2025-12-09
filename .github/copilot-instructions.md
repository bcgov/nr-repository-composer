# GitHub Copilot Instructions

## Project Overview

This is the NR Repository Composer, a suite of Yeoman generators for scaffolding NRIDS applications with GitHub Actions workflows, Backstage catalog files, and deployment configurations.

## Code Style & Conventions

- Use ES6+ module syntax (`import`/`export`)
- Use async/await for asynchronous operations
- Prefer template literals for string interpolation
- Use descriptive variable names
- Follow existing indentation (2 spaces)

## Architecture

### Generators

Each generator extends Yeoman's `Generator` class and follows this structure:

1. **Constructor** - Define options with `this.option()`
2. **initializing()** - Set up BackstageStorage for reading/writing catalog-info.yaml
3. **prompting()** - Present interactive prompts to users
4. **writing()** - Generate files from templates using `this.fs.copyTpl()`

### Key Components

- **BackstageStorage** (`generators/util/backstage.storage.js`) - Manages reading/writing to catalog-info.yaml files
- **Prompts** (`generators/util/prompts.js`) - Reusable prompt definitions
- **YAML Mapping** (`generators/util/yaml.js`) - Maps prompt properties to catalog-info.yaml paths via `pathToProps` array

## Adding New Prompts

When adding a new prompt:

1. **Define the prompt** in `generators/util/prompts.js`:
   ```javascript
   export const PROMPT_MY_FIELD = {
     type: 'input',
     name: 'myField',
     message: 'My field:',
     default: 'default-value',
   };
   ```

2. **Add usage documentation** in `PROMPT_TO_USAGE` object:
   ```javascript
   myField: {
     description: 'Description of what this field does',
     example: 'example-value',
   },
   ```

3. **Add YAML mapping** in `generators/util/yaml.js` `pathToProps` array:
   ```javascript
   {
     path: ['metadata', 'annotations', 'playbook.io.nrs.gov.bc.ca/myField'],
     prop: 'myField',
     writeEmpty: false,
   },
   ```

4. **Import and use** in generator's questions array and template parameters

## Template Variables

Templates use EJS syntax (`<%= variable %>`). Common variables:

- `projectName` - Project/system name (from `spec.system`)
- `serviceName` - Service/component name (from `metadata.name`)
- `pomRoot` - Path to pom.xml for Maven projects
- `javaVersion` - Java version (8, 11, 17, 21)
- `relativePath` - Relative path in monorepos
- `isMonoRepo` - Boolean indicating monorepo structure

## Catalog-info.yaml Structure

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: service-name
  annotations:
    license: Apache-2.0
    github.com/project-slug: org/repo
    playbook.io.nrs.gov.bc.ca/pomRoot: ./
    playbook.io.nrs.gov.bc.ca/javaVersion: "11"
spec:
  system: project-name
  type: service
  lifecycle: production
  owner: team-name
```

## Generator Composition

Generators can compose other generators using `this.composeWith()`:

```javascript
this.composeWith(
  'nr-repository-composer:pd-java-playbook',
  [projectName, serviceName, playbookPath],
  { javaVersion: this.answers.javaVersion }
);
```

Pass options that child generators need via the third parameter.

## Testing

Run tests with `npm test`. Test files are in `__tests__/` directory.

## Building

Run `./build.sh` to build the Docker/Podman container image.

## Common Patterns

### Reading from catalog-info.yaml
```javascript
this.backstageStorage = new BackstageStorage(
  this.answers.serviceName,
  BACKSTAGE_KIND_COMPONENT,
  this.destinationPath(BACKSTAGE_FILENAME),
);
this.answers = this.config.getAnswers();
```

### Writing to catalog-info.yaml
```javascript
for (const prop of Object.keys(this.answers)) {
  this.backstageStorage.setPath(prop, this.answers[prop]);
}
this.backstageStorage.save();
```

### Conditional Template Content
```ejs
<% if (condition) { -%>
  content when true
<% } else { -%>
  content when false
<% } -%>
```

## Troubleshooting

- **"Mapping from X to YAML document path not found"** - Add the field to `pathToProps` in `yaml.js`
- **Template variable undefined** - Ensure it's passed in the template parameters object
- **Generator not composing** - Check that options are passed correctly to child generator
