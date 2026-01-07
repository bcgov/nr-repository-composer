#!/usr/bin/env node
/**
 * Updates the README.md Generator Library sections with "Next Steps" information
 * from generators/util/report.js
 *
 * Usage: node tools/update-readme.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Import shared code from report.js
import {
  GENERATOR_REPORTS,
  GENERATOR_ANCHORS,
  expandGeneratorPattern,
} from '../generators/util/report.js';

/**
 * Generates the "Next Steps" markdown section for a generator
 * @param {string} generatorName - The generator name
 * @returns {string|null} - Markdown content or null if no next steps
 */
function generateNextStepsMarkdown(generatorName) {
  const report = GENERATOR_REPORTS[generatorName];
  if (!report || !report.nextSteps || report.nextSteps.length === 0) {
    return null;
  }

  const nextSteps =
    typeof report.nextSteps === 'function'
      ? report.nextSteps({})
      : report.nextSteps;

  if (!nextSteps || nextSteps.length === 0) {
    return null;
  }

  // Filter to only include steps with generators
  const generatorSteps = nextSteps.filter((step) => step.generator);
  if (generatorSteps.length === 0) {
    return null;
  }

  let markdown = '\n**Suggested Next Steps:**\n';

  for (const step of generatorSteps) {
    if (step.generator.includes('*')) {
      // Pattern with wildcard - expand to list of generators, excluding self
      const matchingGenerators = expandGeneratorPattern(step.generator).filter(
        (g) => g !== generatorName,
      );
      if (matchingGenerators.length === 0) {
        continue;
      }
      const generatorLinks = matchingGenerators
        .map((g) => {
          const anchor = GENERATOR_ANCHORS[g];
          return anchor ? `[\`${g}\`](#${anchor})` : `\`${g}\``;
        })
        .join(', ');
      markdown += `- ${generatorLinks} - ${step.description}\n`;
    } else {
      // Single generator
      const anchor = GENERATOR_ANCHORS[step.generator];
      const link = anchor
        ? `[\`${step.generator}\`](#${anchor})`
        : `\`${step.generator}\``;
      markdown += `- ${link} - ${step.description}\n`;
    }
  }

  return markdown;
}

/**
 * Finds the end position of a generator section in the README
 * A section ends at the next ### heading or ## heading or end of file
 * @param {string} content - README content
 * @param {number} startPos - Position after the section heading
 * @returns {number} - Position where the section ends
 */
function findSectionEnd(content, startPos) {
  // Look for next ## or ### heading
  const nextHeadingMatch = content.slice(startPos).match(/\n##+ /);
  if (nextHeadingMatch) {
    return startPos + nextHeadingMatch.index;
  }
  return content.length;
}

/**
 * Removes existing "Next Steps" sections from content
 * @param {string} content - Section content
 * @returns {string} - Content with next steps section removed
 */
function removeExistingNextSteps(content) {
  // Remove existing "**Suggested Next Steps:**" section
  const suggestedPattern = /\n\*\*Suggested Next Steps:\*\*\n(?:- [^\n]+\n)*/g;
  return content.replace(suggestedPattern, '');
}

/**
 * Updates the README with next steps for all generators
 */
function updateReadme() {
  const readmePath = join(ROOT_DIR, 'README.md');
  let content = readFileSync(readmePath, 'utf8');

  // Track what we updated
  const updated = [];
  const skipped = [];

  for (const [generatorName] of Object.entries(GENERATOR_ANCHORS)) {
    const nextStepsMarkdown = generateNextStepsMarkdown(generatorName);

    // Find the section by its anchor
    // The anchor format in headings is like: ### Backstage: `backstage`
    // We need to find by the anchor ID which is derived from the heading

    // Find heading that would produce this anchor
    // Anchors are lowercase, hyphenated versions of headings
    // We'll search for the pattern based on the generator name
    const headingPatterns = [
      new RegExp(`### [^\\n]*\`${generatorName}\``, 'i'),
    ];

    let headingMatch = null;
    let headingPos = -1;

    for (const pattern of headingPatterns) {
      const match = content.match(pattern);
      if (match) {
        headingMatch = match[0];
        headingPos = match.index;
        break;
      }
    }

    if (headingPos === -1) {
      skipped.push(`${generatorName} (heading not found)`);
      continue;
    }

    // Find the end of this section
    const sectionStart = headingPos + headingMatch.length;
    const sectionEnd = findSectionEnd(content, sectionStart);

    // Extract the section content
    let sectionContent = content.slice(sectionStart, sectionEnd);

    // Remove any existing next steps section
    sectionContent = removeExistingNextSteps(sectionContent);

    // If there are next steps, add them at the end of the section
    if (nextStepsMarkdown) {
      // Ensure section ends with a newline before adding next steps
      sectionContent = sectionContent.trimEnd() + '\n' + nextStepsMarkdown;
      updated.push(generatorName);
    } else {
      skipped.push(`${generatorName} (no generator next steps)`);
    }

    // Reconstruct the content
    content =
      content.slice(0, sectionStart) +
      sectionContent +
      content.slice(sectionEnd);
  }

  // Write the updated content
  writeFileSync(readmePath, content);

  console.log('README.md updated successfully!\n');
  console.log('Updated sections:');
  for (const name of updated) {
    console.log(`  ✓ ${name}`);
  }
  if (skipped.length > 0) {
    console.log('\nSkipped sections:');
    for (const name of skipped) {
      console.log(`  - ${name}`);
    }
  }
}

// Run the update
updateReadme();
