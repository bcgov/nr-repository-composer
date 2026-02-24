import path from 'path';
import * as fs from 'node:fs';
import * as ejs from 'ejs';
import { destinationGitPath, relativeGitPath } from './git.js';
import { scanRepositoryForComponents, hasGeneratorInDoc } from './yaml.js';
import {
  makeWorkflowBuildPublishFile,
  makeWorkflowDeployFile,
} from '../util/github.js';

const COMMON_GH_TEMPLATE_PATH = '../../util/gh-workflow-template';
const COMMON_PD_TEMPLATE_PATH = '../../util/pd-template';
const README_TEMPLATES = [
  {
    name: 'README.md.tpl',
    path: '../../util/pd-template/gh-docs/README.md.tpl',
    markerName: 'README.md.tpl',
  },
  {
    name: 'README-buildenv.md.tpl',
    path: '../../util/pd-template/gh-docs/README-buildenv.md.tpl',
    markerName: 'README-buildenv.md.tpl',
  },
  {
    name: 'README-localenv.md.tpl',
    path: '../../util/pd-template/gh-docs/README-localenv.md.tpl',
    markerName: 'README-localenv.md.tpl',
  },
];

export function rmIfExists(generator, path) {
  if (generator.fs.exists(path)) {
    generator.fs.delete(path);
  }
}

export function copyCommonBuildWorkflows(generator, answers) {
  const relativePath = relativeGitPath();

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_GH_TEMPLATE_PATH}/build-intention.json`),
    destinationGitPath(
      `.github/workflows/build-intention-${answers.serviceName}.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
      license: answers.license,
      packageArchitecture: answers.packageArchitecture,
      packageType: answers.packageType,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_GH_TEMPLATE_PATH}/build-intention.sh`),
    destinationGitPath(
      `.github/workflows/build-intention-${answers.serviceName}.sh`,
    ),
    {
      serviceName: answers.serviceName,
      relativePath,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_GH_TEMPLATE_PATH}/preflight.yaml`),
    destinationGitPath('.github/workflows/preflight.yaml'),
  );
  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_GH_TEMPLATE_PATH}/check-token.yaml`),
    destinationGitPath('.github/workflows/check-token.yaml'),
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_PD_TEMPLATE_PATH}/env.sh`),
    destinationGitPath('env.sh'),
    {},
    { mode: 0o755 },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_PD_TEMPLATE_PATH}/env-build.sh`),
    destinationGitPath(path.join(relativePath, '.env-build.sh')),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
      pomRoot: answers.pomRoot
        ? path.join(relativePath, answers.pomRoot)
        : undefined,
      toolsLocalBuildSecrets: answers.toolsLocalBuildSecrets,
      artifactRepositoryPath: answers.artifactRepositoryPath,
    },
    { mode: 0o755 },
  );

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_GH_TEMPLATE_PATH}/check-release-package.yaml`,
    ),
    destinationGitPath(`.github/workflows/check-release-package.yaml`),
  );

  // Clean up old files if they exist (may remove in future)
  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/build-intention.json'),
  );
  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/build-intention.sh'),
  );
}

export function copyCommonDeployWorkflows(generator, answers) {
  const relativePath = relativeGitPath();

  const brokerJwt = answers.clientId.trim()
    ? `broker-jwt:${answers.clientId.trim()}`.replace(/[^a-zA-Z0-9_]/g, '_')
    : 'BROKER_JWT';

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_GH_TEMPLATE_PATH}/check-build-artifact.yaml`,
    ),
    destinationGitPath('.github/workflows/check-build-artifact.yaml'),
    {
      gitHubProjectSlug: answers.gitHubProjectSlug,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_GH_TEMPLATE_PATH}/check-deploy-job-status.sh`,
    ),
    destinationGitPath('.github/workflows/check-deploy-job-status.sh'),
  );

  generator.fs.copyTpl(
    generator.templatePath(
      `${COMMON_GH_TEMPLATE_PATH}/deployment-intention.json`,
    ),
    destinationGitPath(
      `.jenkins/${answers.serviceName}-deployment-intention.json`,
    ),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
    },
  );

  generator.fs.copyTpl(
    generator.templatePath(`${COMMON_GH_TEMPLATE_PATH}/run-deploy.yaml`),
    destinationGitPath(
      `.github/workflows/run-deploy-${answers.serviceName}.yaml`,
    ),
    {
      serviceName: answers.serviceName,
      brokerJwt,
      buildWorkflowFile: makeWorkflowBuildPublishFile(answers.serviceName),
      relativePath,
      deployWorkflowFile: makeWorkflowDeployFile(answers.serviceName),
    },
  );

  // Clean up old files if they exist (may remove in future)
  rmIfExists(
    generator,
    generator.destinationPath('.jenkins/deployment-intention.json'),
  );
}

/**
 * Update a section of README with rendered template content
 * @param {string} readmeContent - Existing README content (or empty string if file doesn't exist)
 * @param {string} templateContent - Rendered template content
 * @param {string} markerName - Template marker name (e.g., 'README.md.tpl')
 * @returns {string} Updated README content
 */
function updateReadmeSection(readmeContent, templateContent, markerName) {
  const markerPattern = `<!-- ${markerName}:START -->.*<!-- ${markerName}:END -->`;
  const markerRegex = new RegExp(markerPattern, 'gs');

  if (!readmeContent) {
    // If content is empty, start with the template
    return templateContent;
  }

  if (!markerRegex.test(readmeContent)) {
    // If markers don't exist, append
    return readmeContent + '\n' + templateContent;
  }

  // If markers exist, replace (preserve surrounding content)
  return readmeContent.replace(markerRegex, templateContent.trim());
}

/**
 * Update README with Polaris Pipeline guide
 * Scans repository for services and build information, then updates README
 * with content from multiple templates (README.md.tpl, README-buildenv.md.tpl, README-localenv.md.tpl)
 */
export function updateReadmeWithPipelineGuide(generator) {
  const services = scanRepositoryForComponents();

  const templateData = {
    hasMavenBuild: services.some((s) =>
      hasGeneratorInDoc(s.doc, 'gh-maven-build'),
    ),
    services,
    isMonorepo: services.length > 1,
  };

  const readmePath = destinationGitPath('README.md');

  // Read the existing README content once (or empty string if it doesn't exist)
  let readmeContent = '';
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  }

  // Process each template and accumulate changes
  for (const template of README_TEMPLATES) {
    const readmeTemplatePath = generator.templatePath(template.path);

    if (!fs.existsSync(readmeTemplatePath)) {
      continue; // Skip if template doesn't exist
    }

    const templateContent = fs.readFileSync(readmeTemplatePath, 'utf8');
    const rendered = ejs.render(templateContent, templateData);

    // Update content in memory
    readmeContent = updateReadmeSection(
      readmeContent,
      rendered,
      template.markerName,
    );
  }

  // Write the file once with all accumulated changes
  generator.fs.write(readmePath, readmeContent);
}
