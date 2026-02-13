import path from 'path';
import * as fs from 'node:fs';
import * as ejs from 'ejs';
import { parseDocument } from 'yaml';
import {
  destinationGitPath,
  relativeGitPath,
  findGitRepoOrigin,
} from './git.js';
import {
  BACKSTAGE_FILENAME,
  BACKSTAGE_KIND_COMPONENT,
  BACKSTAGE_KIND_LOCATION,
} from './yaml.js';
import {
  makeWorkflowBuildPublishFile,
  makeWorkflowDeployFile,
} from '../util/github.js';

const COMMON_GH_TEMPLATE_PATH = '../../util/gh-workflow-template';
const COMMON_PD_TEMPLATE_PATH = '../../util/pd-template';
const POLARIS_README_TEMPLATE = '../../util/pd-template/gh-docs/README.md.tpl';

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
    generator.templatePath(`${COMMON_PD_TEMPLATE_PATH}/env-tools.sh`),
    destinationGitPath(path.join(relativePath, '.env-tools.sh')),
    {
      projectName: answers.projectName,
      serviceName: answers.serviceName,
      pomRoot: path.join(relativePath, answers.pomRoot),
      toolsLocalBuildSecrets: answers.toolsLocalBuildSecrets,
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
 * Scan the repository for all services and build information
 * Traverses Location entities to find all Component services
 */
function scanRepositoryForServices() {
  const gitConfigPath = findGitRepoOrigin(process.cwd());
  if (!gitConfigPath) {
    return { hasMavenBuild: false, services: [] };
  }

  const repoRoot = path.dirname(path.dirname(gitConfigPath)); // .git/config -> .git -> repo root
  const rootCatalogPath = path.join(repoRoot, BACKSTAGE_FILENAME);

  if (!fs.existsSync(rootCatalogPath)) {
    return { hasMavenBuild: false, services: [] };
  }

  const services = [];
  const visited = new Set();

  const loadCatalog = (catalogPath) => {
    if (visited.has(catalogPath)) {
      return;
    }
    visited.add(catalogPath);

    try {
      const content = fs.readFileSync(catalogPath, 'utf8');
      const doc = parseDocument(content);
      const kind = doc.getIn(['kind']);

      if (kind === BACKSTAGE_KIND_LOCATION) {
        // Load all targets from this location
        const targets = doc.getIn(['spec', 'targets']);
        if (targets && Array.isArray(targets)) {
          for (const target of targets) {
            const targetPath = target.startsWith('/')
              ? target.substring(1) // Remove leading slash
              : target;
            const resolvedPath = path.resolve(
              path.dirname(catalogPath),
              targetPath,
            );
            loadCatalog(resolvedPath);
          }
        }
      } else if (kind === BACKSTAGE_KIND_COMPONENT) {
        // Check if this component has Maven build
        const generators = doc.getIn([
          'metadata',
          'annotations',
          'composer.io.nrs.gov.bc.ca/generators',
        ]);
        const generatorsList = generators
          ? generators.split(',').map((g) => g.trim())
          : [];
        const hasMaven = generatorsList.includes('gh-maven-build');

        services.push({
          path: path.relative(repoRoot, catalogPath),
          hasMaven,
          name: doc.getIn(['metadata', 'name']) || 'unknown',
        });
      }
    } catch {
      // Silently skip files that can't be parsed
    }
  };

  loadCatalog(rootCatalogPath);

  return {
    hasMavenBuild: services.some((s) => s.hasMaven),
    services,
  };
}

/**
 * Update README with Polaris Pipeline guide
 * Scans repository for services and build information, then updates README
 */
export function updateReadmeWithPipelineGuide(generator) {
  const scanResults = scanRepositoryForServices();

  const templateData = {
    hasMavenBuild: scanResults.hasMavenBuild,
    services: scanResults.services,
    isMonorepo: scanResults.services.length > 1,
    isSingleServiceAtRoot:
      scanResults.services.length === 1 &&
      scanResults.services[0].path === BACKSTAGE_FILENAME,
  };

  const readmePath = generator.destinationPath('README.md');
  const readmeTemplatePath = generator.templatePath(POLARIS_README_TEMPLATE);

  if (!fs.existsSync(readmeTemplatePath)) {
    return; // Template doesn't exist, skip
  }

  const templateContent = fs.readFileSync(readmeTemplatePath, 'utf8');
  const rendered = ejs.render(templateContent, templateData);

  // Check if file exists on disk (use fs, not generator.fs for actual files)
  if (fs.existsSync(readmePath)) {
    // Read from actual filesystem for existing files
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const readmeRegex = new RegExp(
      '<!-- README\\.md\\.tpl:START -->.*<!-- README\\.md\\.tpl:END -->',
      'gs',
    );
    if (!readmeRegex.test(readmeContent)) {
      // If markers don't exist, append
      generator.fs.append(readmePath, '\n' + rendered);
    } else {
      // If markers exist, replace (preserve surrounding content)
      const updatedContent = readmeContent.replace(
        readmeRegex,
        rendered.trim(),
      );
      generator.fs.write(readmePath, updatedContent);
    }
  } else {
    // If file doesn't exist, create it
    generator.fs.write(readmePath, rendered);
  }
}
