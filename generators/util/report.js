'use strict';
import chalk from 'chalk';

const README_BASE_URL =
  'https://github.com/bcgov/nr-repository-composer/blob/main/README.md';

/**
 * All available generators for pattern matching
 */
export const ALL_GENERATORS = [
  'nr-repository-composer',
  'backstage',
  'backstage-location',
  'gh-common-mono-build',
  'gh-docs-deploy',
  'gh-maven-build',
  'gh-tomcat-deploy-onprem',
  'gh-nodejs-build',
  'gh-oci-deploy-onprem',
  'migrations',
];

/**
 * Generator to README anchor mapping
 * Maps generator names to their README section anchors
 */
export const GENERATOR_ANCHORS = {
  'nr-repository-composer': 'nr-repository-composer-nr-repository-composer',
  backstage: 'backstage-backstage',
  'backstage-location': 'backstage-backstage-location',
  'gh-common-mono-build': 'github-gh-common-mono-build',
  'gh-docs-deploy': 'github-docs-deploy-gh-docs-deploy',
  'gh-maven-build': 'github-maven-build-gh-maven-build',
  'gh-tomcat-deploy-onprem':
    'github-tomcat-on-prem-deploy-gh-tomcat-deploy-onprem',
  'gh-nodejs-build': 'github-nodejs-build-gh-nodejs-build',
  'gh-oci-deploy-onprem': 'github-oci-on-prem-deploy-gh-oci-deploy-onprem',
  migrations: 'db-migrations-migrations',
};

/**
 * Returns the README URL for a generator
 * @param {string} generatorName - The generator name
 * @returns {string} - Full URL to the README section
 */
function getGeneratorUrl(generatorName) {
  const anchor = GENERATOR_ANCHORS[generatorName];
  if (anchor) {
    return `${README_BASE_URL}#${anchor}`;
  }
  return README_BASE_URL;
}

/**
 * Converts a glob-like pattern to a regex
 * Supports * as wildcard
 * @param {string} pattern - Pattern like 'gh-*-build'
 * @returns {RegExp}
 */
export function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`);
}

/**
 * Expands a generator pattern to matching generator names
 * @param {string} pattern - Pattern like 'gh-*-build' or exact name like 'backstage'
 * @returns {string[]} - Array of matching generator names
 */
export function expandGeneratorPattern(pattern) {
  if (!pattern.includes('*')) {
    return [pattern];
  }
  const regex = patternToRegex(pattern);
  return ALL_GENERATORS.filter((gen) => regex.test(gen));
}

/**
 * Generator report configuration
 * Each generator has:
 * - workflows: Array of workflow file paths created by this generator
 * - nextSteps: Array of suggested next steps with generator names/patterns and descriptions
 * - description: Brief description of what the generator accomplished
 *
 * Generator patterns support * wildcard (e.g., 'gh-*-build' matches 'gh-maven-build', 'gh-nodejs-build')
 */
export const GENERATOR_REPORTS = {
  'nr-repository-composer': {
    description: 'Copied NR Repository Composer tool to repository root',
    workflows: [],
    nextSteps: [
      {
        generator: 'backstage',
        description: 'Create Backstage component catalog file',
      },
      {
        generator: 'backstage-location',
        description: 'Create Backstage location catalog for monorepos',
      },
      {
        generator: 'gh-maven-build',
        description: 'Set up Maven build pipeline',
      },
      {
        generator: 'gh-nodejs-build',
        description: 'Set up Node.js build pipeline',
      },
    ],
  },
  backstage: {
    description: 'Created Backstage component catalog file',
    workflows: [],
    nextSteps: [
      {
        generator: 'gh-*-build',
        description: 'Set up build pipeline',
      },
      {
        generator: 'gh-docs-deploy',
        description: 'Set up GitHub Pages documentation deployment',
      },
      {
        generator: 'migrations',
        description: 'Set up database migration files',
      },
    ],
  },
  'backstage-location': {
    description: 'Created Backstage location catalog file for monorepo',
    workflows: [],
    nextSteps: [
      {
        generator: 'backstage',
        description:
          'Run in each component directory to create component catalog files',
      },
      {
        generator: 'gh-common-mono-build',
        description:
          'Set up unified build orchestration workflow (after component catalogs exist)',
      },
      {
        generator: 'gh-docs-deploy',
        description: 'Set up GitHub Pages documentation deployment',
      },
    ],
  },
  'gh-common-mono-build': {
    description: 'Created unified build orchestration workflow for monorepo',
    workflows: ['.github/workflows/build-release.yaml'],
    nextSteps: [
      {
        generator: 'gh-*-build',
        description:
          'Run in each component directory to create individual build workflows',
      },
    ],
  },
  'gh-docs-deploy': {
    description: 'Created GitHub Pages documentation deployment workflow',
    workflows: ['.github/workflows/docs-deploy.yaml'],
    nextSteps: [
      {
        generator: null,
        description:
          'Enable GitHub Pages in repository Settings > Pages and set source to "GitHub Actions"',
      },
      {
        generator: null,
        description: 'Add static documentation content to the docs/ folder',
      },
    ],
  },
  'gh-maven-build': {
    description: 'Created Maven build workflow and NR Broker intention files',
    workflows: (answers) => [
      `.github/workflows/build-release-${answers.serviceName}.yaml`,
    ],
    nextSteps: [
      {
        generator: 'gh-tomcat-deploy-onprem',
        description: 'Set up on-premises Tomcat deployment workflow',
      },
      {
        generator: null,
        description:
          'Configure repository secrets for NR Broker JWT and any other required credentials',
      },
    ],
  },
  'gh-tomcat-deploy-onprem': {
    description:
      'Created on-premises deployment workflow for Java/Tomcat applications',
    workflows: (answers) => [
      `.github/workflows/deploy-${answers.serviceName}.yaml`,
    ],
    nextSteps: [
      {
        generator: null,
        description:
          'Ensure gh-maven-build has been run first to create the build workflow',
      },
      {
        generator: null,
        description:
          'Configure deployment environments in repository Settings > Environments',
      },
    ],
  },
  'gh-nodejs-build': {
    description: 'Created Node.js build workflow and NR Broker intention files',
    workflows: (answers) => [
      `.github/workflows/build-release-${answers.serviceName}.yaml`,
    ],
    nextSteps: [
      {
        generator: 'gh-oci-deploy-onprem',
        description: 'Set up on-premises deployment workflow',
      },
      {
        generator: null,
        description:
          'Configure repository secrets for NR Broker JWT and any other required credentials',
      },
    ],
  },
  'gh-oci-deploy-onprem': {
    description:
      'Created on-premises deployment workflow for OCI artifacts (Node.js or Tomcat)',
    workflows: (answers) => [
      `.github/workflows/deploy-${answers.serviceName}.yaml`,
    ],
    nextSteps: [
      {
        generator: null,
        description:
          'Ensure a build generator (gh-nodejs-build, gh-maven-build) has been run first',
      },
      {
        generator: null,
        description:
          'Configure deployment environments in repository Settings > Environments',
      },
    ],
  },
};

/**
 * Creates a clickable hyperlink using OSC 8 escape sequences
 * Format: \e]8;;URL\e\\TEXT\e]8;;\e\\
 * @param {string} text - The text to display
 * @param {string} url - The URL to link to
 * @returns {string} - The formatted hyperlink string
 */
function hyperlink(text, url) {
  return `\u001B]8;;${url}\u0007${text}\u001B]8;;\u0007`;
}

/**
 * Outputs a formatted report after generator execution
 * @param {object} generator - The Yeoman generator instance (for logging)
 * @param {string} generatorName - Name of the generator (e.g., 'backstage', 'gh-maven-build')
 * @param {object} answers - The answers/configuration from the generator prompts
 */
export function outputReport(generator, generatorName, answers = {}) {
  const report = GENERATOR_REPORTS[generatorName];
  if (!report) {
    return;
  }

  const workflows =
    typeof report.workflows === 'function'
      ? report.workflows(answers)
      : report.workflows;

  const nextSteps =
    typeof report.nextSteps === 'function'
      ? report.nextSteps(answers)
      : report.nextSteps;

  generator.log('\n' + chalk.green.bold('═'.repeat(60)));
  generator.log(chalk.green.bold('  Generator Complete'));
  generator.log(chalk.green.bold('═'.repeat(60)));

  // Description
  generator.log('\n' + chalk.white(report.description));

  // Workflows created
  if (workflows && workflows.length > 0) {
    generator.log('\n' + chalk.cyan.bold('📁 Files Created:'));
    for (const workflow of workflows) {
      generator.log(chalk.cyan(`   • ${workflow}`));
    }
  }

  // Next steps
  if (nextSteps && nextSteps.length > 0) {
    generator.log('\n' + chalk.yellow.bold('📋 Suggested Next Steps:'));
    let stepNum = 1;
    for (const step of nextSteps) {
      if (step.generator) {
        if (step.generator.includes('*')) {
          // Pattern with wildcard
          const matchingGenerators = expandGeneratorPattern(step.generator);
          const generatorList = matchingGenerators
            .map((g) => hyperlink(chalk.yellow.bold(g), getGeneratorUrl(g)))
            .join(chalk.yellow(', '));
          generator.log(
            chalk.yellow(`   ${stepNum}. Run `) +
              generatorList +
              chalk.yellow(` - ${step.description}`),
          );
        } else {
          // Single generator - link directly to its section
          const url = getGeneratorUrl(step.generator);
          const linkedName = hyperlink(chalk.yellow.bold(step.generator), url);
          generator.log(
            chalk.yellow(`   ${stepNum}. Run `) +
              linkedName +
              chalk.yellow(` - ${step.description}`),
          );
        }
      } else {
        generator.log(chalk.yellow(`   ${stepNum}. ${step.description}`));
      }
      stepNum++;
    }
  }

  generator.log('');
}
