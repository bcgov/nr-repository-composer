'use strict';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs';
import Generator from 'yeoman-generator';
// Generator<any> accepts any subclass passed as `this`
type AnyGenerator = Generator<any, any, any>;
import { destinationGitPath } from './git.js';
import { updateReadmeWithPipelineGuide, rmIfExists } from './copyworkflows.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve a template path within the co-located pd-*-templates directories
function pdTemplatePath(genName: string, ...parts: string[]) {
  return path.join(__dirname, `${genName}-templates`, ...parts);
}

export function writeJavaMavenFiles(generator: AnyGenerator) {
  generator.fs.copyTpl(
    pdTemplatePath('pd-java-maven', 'mvn_maven.config'),
    destinationGitPath('.mvn/maven.config'),
    {},
  );

  generator.fs.copyTpl(
    pdTemplatePath('pd-java-maven', 'mvn_settings.xml'),
    destinationGitPath('.mvn/settings.xml'),
    {},
  );

  generator.fs.copyTpl(
    pdTemplatePath('pd-java-maven', 'mvn_wrapper_maven-wrapper.properties'),
    destinationGitPath('.mvn/wrapper/maven-wrapper.properties'),
    {},
  );

  generator.fs.copyTpl(
    pdTemplatePath('pd-java-maven', 'mvnw'),
    destinationGitPath('mvnw'),
    {},
    { mode: 0o755 } as any,
  );

  updateReadmeWithPipelineGuide(generator);
  rmIfExists(
    generator,
    destinationGitPath('.github/polaris-maven-settings.xml'),
  );
}

export function writeJavaPlaybookFiles(
  generator: AnyGenerator,
  options: Record<string, any> = {},
) {
  const playbookPath = options.playbookPath || 'playbooks';

  const varsCustomPath = pdTemplatePath('pd-java-playbook', 'vars', 'custom');
  if (fs.existsSync(varsCustomPath)) {
    for (const file of fs.readdirSync(varsCustomPath)) {
      const destPath = generator.destinationPath(
        `${playbookPath}/vars/custom/${file}`,
      );
      if (!fs.existsSync(destPath)) {
        generator.fs.copyTpl(path.join(varsCustomPath, file), destPath, {});
      }
    }
  }

  generator.fs.copyTpl(
    pdTemplatePath('pd-java-playbook', 'playbook.yaml'),
    generator.destinationPath(`${playbookPath}/playbook.yaml`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      addWebadeConfig: options.addWebadeConfig,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-java-playbook', 'vars', 'standard', '**'),
    generator.destinationPath(`${playbookPath}/vars/standard`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      projectNameUpperCase: options.projectName?.toUpperCase(),
      tomcatContext: options.tomcatContext,
      altAppDirName: options.altAppDirName,
      addWebadeConfig: options.addWebadeConfig,
      javaVersion: options.javaVersion,
    },
  );

  updateReadmeWithPipelineGuide(generator);
}

export function writeOciPlaybookFiles(
  generator: AnyGenerator,
  options: Record<string, any> = {},
) {
  const playbookPath = options.playbookPath || 'playbooks';

  const varsCustomPath = pdTemplatePath('pd-oci-playbook', 'vars', 'custom');
  if (fs.existsSync(varsCustomPath)) {
    for (const file of fs.readdirSync(varsCustomPath)) {
      const destPath = generator.destinationPath(
        `${playbookPath}/vars/custom/${file}`,
      );
      if (!fs.existsSync(destPath)) {
        generator.fs.copyTpl(path.join(varsCustomPath, file), destPath, {});
      }
    }
  }

  const deployType = options.deployType || 'nodejs';
  const templateFile =
    deployType === 'tomcat' ? 'playbook-tomcat.yaml' : 'playbook-nodejs.yaml';

  generator.fs.copyTpl(
    pdTemplatePath('pd-oci-playbook', templateFile),
    generator.destinationPath(`${playbookPath}/playbook.yaml`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      addWebadeConfig: options.addWebadeConfig,
      deployType: deployType,
      addLog4j2Config: options.addLog4j2Config,
      addTomcatContext: options.addTomcatContext,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-oci-playbook', 'vars', 'standard', '**'),
    generator.destinationPath(`${playbookPath}/vars/standard`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      projectNameUpperCase: options.projectName?.toUpperCase(),
      addWebadeConfig: options.addWebadeConfig,
      deployType: deployType,
      shutdownScript: options.shutdownScript || '',
      javaVersion: options.javaVersion,
      tomcatContext: options.tomcatContext,
      altAppDirName: options.altAppDirName,
      createDataTmpDir: options.createDataTmpDir,
    },
  );

  updateReadmeWithPipelineGuide(generator);
}

export function writeJasperReportsFiles(
  generator: AnyGenerator,
  options: Record<string, any> = {},
) {
  const playbookPath = options.playbookPath || 'playbooks';
  const jasperReportsWorkflowFile = `jasper-reports-${options.projectName}.yaml`;

  generator.fs.copyTpl(
    pdTemplatePath('pd-jasper-reports', 'jasper-reports-workflow.yaml'),
    destinationGitPath(`.github/workflows/${jasperReportsWorkflowFile}`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      brokerJwt: options.brokerJwt,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-jasper-reports', 'run-jasper-reports-workflow.yaml'),
    destinationGitPath(`.github/workflows/run-${jasperReportsWorkflowFile}`),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
      brokerJwt: options.brokerJwt,
      jasperReportsWorkflowFile,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-jasper-reports', 'jasper-reports-intention.json'),
    generator.destinationPath(
      `.jenkins/${options.projectName}-jasper-reports-intention.json`,
    ),
    {
      projectName: options.projectName,
      serviceName: options.serviceName,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-jasper-reports', 'jasper-reports-playbook.yaml'),
    generator.destinationPath(`${playbookPath}/jasper-reports.yaml`),
    {
      projectNameUpperCase: options.jasperProjectName?.toUpperCase(),
      jasperServerInstanceUpperCase:
        options.jasperServerInstance?.toUpperCase(),
      jasperSourcePath: options.jasperSourcePath,
      jasperPauseSeconds: options.jasperPauseSeconds,
      jasperAdditionalDataSources: options.jasperAdditionalDataSources,
    },
  );
  generator.fs.copyTpl(
    pdTemplatePath('pd-jasper-reports', 'jasper-reports-datasource.yaml'),
    generator.destinationPath(`${playbookPath}/jasper-datasource.yaml`),
    {
      projectNameUpperCase: options.jasperProjectName?.toUpperCase(),
      jasperServerInstanceUpperCase:
        options.jasperServerInstance?.toUpperCase(),
      jasperAdditionalDataSources: options.jasperAdditionalDataSources,
    },
  );

  updateReadmeWithPipelineGuide(generator);

  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/jasper-reports.yaml'),
  );
  rmIfExists(
    generator,
    destinationGitPath('.github/workflows/run-jasper-reports.yaml'),
  );
}
