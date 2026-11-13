import chalk from 'chalk';
import { BaseGenerator } from '../util/base-generator.js';

import {
  PROMPT_PROJECT,
  PROMPT_CLIENT_ID,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_DEPLOY_JASPER_REPORTS,
  PROMPT_PLAYBOOK_PATH,
  PROMPT_JASPER_PAUSE_SECONDS,
  PROMPT_JASPER_PROJECT_NAME,
  PROMPT_JASPER_SERVICE_NAME,
  PROMPT_JASPER_SOURCE_PATH,
  PROMPT_JASPER_ADDITIONAL_DATA_SOURCES,
  PROMPT_JASPER_SERVER_INSTANCE,
  PROMPT_CUSTOM_RUNNER,
} from '../util/prompts.js';
import {
  writeJasperReportsFiles,
} from '../util/pd-helpers.js';

const questions = [
  PROMPT_PROJECT,
  PROMPT_CLIENT_ID,
  PROMPT_GITHUB_PROJECT_SLUG,
  PROMPT_CUSTOM_RUNNER,
  PROMPT_DEPLOY_JASPER_REPORTS,
  {
    ...PROMPT_JASPER_PROJECT_NAME,
    default: (answers) => answers.projectName,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SERVICE_NAME,
    default: (answers) => `${answers.projectName}-jasper-reports`,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SOURCE_PATH,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_ADDITIONAL_DATA_SOURCES,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_SERVER_INSTANCE,
    when: (answers) => answers.deployJasperReports,
  },
  {
    ...PROMPT_JASPER_PAUSE_SECONDS,
    when: (answers) => answers.deployJasperReports,
  },
];

/**
 * Generate the deploy workflow and NR Broker intention files for on-prem Java/Tomcat Maven deployments in GitHub
 */
export default class extends BaseGenerator {
  constructor(args, opts) {
    super(args, opts);
    this._nrsayConfig = {
      title: 'NR GitHub Jasper Reports On-Prem Deploy Generator',
      subtitle:
        'Create deploy workflow and NR Broker intention files for on-prem Jasper Reports deployments',
      links: [
        [
          'Generator',
          'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-jasper-on-prem-deploy-gh-jasper-deploy-onprem',
        ],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-collection'],
        ['Documentation', 'https://github.com/bcgov/nr-polaris-pipelines'],
      ],
    };
    this._questions = questions;
  }

  _prePrompt() {
    const removedProps = this.backstageConfig.processDeprecated();
    this.showGeneratorDeprecationWarning =
      removedProps.indexOf(PROMPT_PLAYBOOK_PATH.name) !== -1;
  }

  async prompting() {
    return super.prompting();
  }

  // Generate GitHub deploy workflow and NR Broker intention files
  writingWorkflow() {
    const brokerJwt = this.answers.clientId.trim()
      ? `broker-jwt:${this.answers.clientId.trim()}`.replace(
          /[^a-zA-Z0-9_]/g,
          '_',
        )
      : 'BROKER_JWT';

    if (this.answers.deployJasperReports) {
      writeJasperReportsFiles(this, {
        projectName: this.answers.projectName,
        serviceName: this.answers.jasperServiceName,
        jasperProjectName: this.answers.jasperProjectName,
        jasperServerInstance: this.answers.jasperServerInstance,
        jasperSourcePath: this.answers.jasperSourcePath,
        jasperPauseSeconds: this.answers.jasperPauseSeconds,
        jasperAdditionalDataSources: this.answers.jasperAdditionalDataSources,
        brokerJwt: brokerJwt,
        customRunner: this.answers.customRunner,
      });
    }
  }

  writingBackstage() {
    super.writingBackstage();
  }

  end() {
    super.end();
  }
}
