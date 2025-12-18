# GitHub Copilot Instructions for NR Repository Composer

## Project Overview

The NR Repository Composer is a Yeoman-based generator suite for scaffolding NRIDS applications. It creates GitHub Actions workflows, Backstage catalog files, database migrations, and deployment configurations for repositories.

## Architecture

### Core Components

- **Generators**: Located in `generators/` - each subdirectory is a Yeoman generator
- **Utilities**: Shared code in `generators/util/`
  - `prompts.js`: Prompt definitions and validation
  - `yaml.js`: Backstage catalog-info.yaml manipulation
  - `backstage.storage.js`: Reading/writing Backstage files
  - `git.js`: Git repository operations
  - `github.js`: GitHub API interactions
- **Templates**: Each generator has a `templates/` folder with EJS templates
- **Container**: Dockerfile packages the tool for distribution

### Key Files

- `generators/backstage/index.js`: Creates Backstage catalog files
- `generators/gh-maven-build/index.js`: Java/Maven pipeline generation
- `generators/gh-nodejs-build/index.js`: Node.js pipeline generation
- `generators/gh-common-mono-build/index.js`: Monorepo build orchestration
- `generators/util/yaml.js`: Central configuration for YAML path mappings

## Development Patterns

### Adding a New Prompt

1. **Define the prompt** in `generators/util/prompts.js`:
```javascript
export const PROMPT_NAME = {
  type: 'input',  // or 'confirm', 'list', 'checkbox'
  name: 'propertyName',
  message: 'User-facing question:',
  default: 'default-value',
};
```

2. **Add documentation** to `PROMPT_TO_USAGE` in same file:
```javascript
propertyName: {
  description: 'What this prompt is for',
  example: 'example-value',
}
```

3. **Import and add to generator** (e.g., `generators/backstage/index.js`):
```javascript
import { PROMPT_NAME } from '../util/prompts.js';
const questions = [
  // ... other prompts
  PROMPT_NAME,
];
```

4. **Map to YAML path** in `generators/util/yaml.js`:
```javascript
export const pathToProps = [
  // ... other mappings
  {
    path: ['metadata', 'annotations', 'custom/key'],  // YAML path
    prop: 'propertyName',  // Property from prompt
    writeEmpty: false,  // Whether to write empty values
    csv: false,  // Set true to split comma-separated values into array
  },
];
```

### Generator Structure

All generators extend Yeoman's Generator class:

```javascript
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);  // For CI/CD
    this.option(OPTION_HELP_PROMPTS);  // Show prompt help
  }

  async prompting() {
    // Display help and collect answers
    this.answers = await this.prompt(questions, 'config');
  }

  writing() {
    // Generate files from templates
    this.fs.copyTpl(
      this.templatePath('template.yaml'),
      this.destinationPath('output.yaml'),
      { variable: this.answers.value }
    );
  }
}
```

### YAML Path Mappings

The `pathToProps` array in `yaml.js` controls how prompt answers map to catalog-info.yaml:

- **Standard Backstage fields**: `spec.*`, `metadata.name`, `metadata.description`
- **Annotations**: `metadata.annotations.*` for custom data
- **CSV fields**: Set `csv: true` to automatically split/join comma-separated values
- **Transforms**: Add `transform: (val) => ...` for custom value processing

### Workflow Templates

GitHub Actions workflows use EJS templating:

```yaml
name: <%= serviceName %>

on:
  push:
    branches:
      - main
<% if (relativePath) { -%>
    paths:
      - '<%= relativePath %>/**'
<% } -%>
```

Key template variables:
- `serviceName`: Service identifier
- `projectName`: Project identifier
- `gitHubProjectSlug`: org/repo format
- `brokerJwt`: Secret name for authentication
- `relativePath`: Path for monorepo components

## Workflow Input Parameters

### preflight.yaml
- `preflight_context`: 'build', or 'deploy'
- `catalog_info`: Path to catalog file

### check-build-artifact.yaml
- `service`: Service name (empty for top-level workflow detection)
  - Empty: Checks top-level build-release.yaml workflow
  - Provided: Checks monorepo job for that service

### Monorepo vs Single Service

**Top-level workflows**: Used when repository has one service
- `service` parameter is empty or not provided
- Workflow runs at repository root

**Monorepo workflows**: Used when repository has multiple services
- `service` parameter contains service name
- Workflow runs as job within build-release.yaml
- Script detects git root and sets container working directory

## Shell Script (nr-repository-composer.sh)

The runner script provides containerized execution:

### Features
- **Auto-detects** Podman or Docker (prefers Podman)
- **Finds git root** from working directory
- **Mounts entire repo** as `/src`
- **Sets working directory** to relative path within repo
- **Auto-prefixes** generator names with `nr-repository-composer:`
- **Pulls images** by default (configurable with `PULL_IMAGE`)

### Usage Pattern
```bash
nr-repository-composer.sh <working-directory> <generator> [options]
```

### Configuration Variables
```bash
IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"
PULL_IMAGE="true"  # Set to "false" to skip pulling
```

## Testing

Test files in `test/` directory:
- `test/catalog-info.yaml`: Location entity for monorepo
- `test/mod1/catalog-info.yaml`: Component entity example
- `test/mod2/catalog-info.yaml`: Component entity example

Run generators against test directory:
```bash
./nr-repository-composer.sh ./test/mod1 backstage --ask-answered
```

## Common Tasks

### Adding a New Generator
1. Create directory: `generators/new-generator/`
2. Add `index.js` with generator class
3. Add `templates/` folder with template files
4. Update README.md with generator documentation

### Adding Workflow Parameters
1. Add to workflow's `inputs:` section
2. Pass to reusable workflow via `with:`
3. Use in workflow: `${{ inputs.parameter }}`

### Modifying Catalog Structure
1. Update `pathToProps` in `yaml.js`
2. Add/modify prompt in `prompts.js`
3. Update generator's `questions` array
4. Test with `--ask-answered` flag

### Working with Monorepos
- Root has Location entity (`backstage-location` generator)
- Each component has Component entity (`backstage` generator)
- Build orchestration uses `gh-common-mono-build` generator
- Reads `spec.subcomponentOf` for build order

## Code Style

- Use ES6 modules (`import`/`export`)
- Async/await for promises
- Destructure imports: `import { CONST } from './file.js'`
- Add JSDoc comments for utility functions
- Keep generators focused on single responsibility
- Use chalk for colored terminal output
- Validate user input early

## Container Considerations

- Working directory is `/src` (mounted from git root)
- User permissions handled by `--userns keep-id` (Podman)
- Image pulled on each run unless `PULL_IMAGE="false"`
- Scripts must be executable (`chmod +x`)

## Git Integration

- Always works within a git repository
- Walks up directory tree to find `.git` folder
- Extracts GitHub slug from remote URL
- Validates repository structure

## Best Practices

1. **Always use absolute paths** when working with files
2. **Validate inputs** using `validate:` in prompts
3. **Provide helpful defaults** from existing config
4. **Support rerunning** generators (don't re-ask unless `--ask-answered`)
5. **Store state** in catalog-info.yaml annotations
6. **Use relative paths** for monorepo components
7. **Test with both Podman and Docker**
8. **Keep workflows reusable** via `workflow_call`
9. **Document all prompts** in `PROMPT_TO_USAGE`
10. **Follow Backstage spec** for catalog files

## Debugging

- Set `PULL_IMAGE="false"` for faster iteration
- Use `--help-prompts` to see prompt documentation
- Use `--ask-answered` to re-prompt all questions
- Check generator output in `.yo-rc.json` and `catalog-info.yaml`
- Container logs available via `podman logs` or `docker logs`
- Test generators locally with `npm link`

## References

- [Yeoman Documentation](http://yeoman.io)
- [Backstage Catalog](https://backstage.io/docs/features/software-catalog/)
- [GitHub Actions Reusable Workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
- [EJS Templating](https://ejs.co/)
