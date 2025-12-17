'use strict';
import Generator from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from '../util/nrsay.js';
import { BackstageStorage } from '../util/backstage.storage.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from '../util/options.js';
import { bailOnUnansweredQuestions } from '../util/process.js';
import { destinationGitPath } from '../util/git.js';
import {
  PROMPT_PROJECT,
  PROMPT_SERVICE,
  getPromptToUsage,
} from '../util/prompts.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from '../util/yaml.js';

const questions = [PROMPT_PROJECT, PROMPT_SERVICE];

/**
 * Generate the CI workflow and NR Broker intention files needed for Java/Tomcat Maven builds in GitHub
 */
export default class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option(OPTION_HEADLESS);
    this.option(OPTION_HELP_PROMPTS);
  }

  _getStorage() {
    return new BackstageStorage(
      this.rootGeneratorName(),
      BACKSTAGE_KIND_COMPONENT,
      this.destinationPath(BACKSTAGE_FILENAME),
    );
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options['ask-answered'];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = this.config.getAnswers();

    if (!headless) {
      this.log(
        nrsay(
          'NR GitHub Docs Deploy Generator',
          'Create workflow for GitHub Docs deployment',
          [
            'Generator',
            'https://github.com/bcgov/nr-repository-composer/blob/main/README.md#github-docs-deploy-gh-docs-deploy',
          ],
        ),
      );
    }

    if (helpPrompts) {
      this.log(chalk.bold('Prompts\n'));
      for (const question of questions) {
        this.log(getPromptToUsage(question));
      }
      this.log(
        `${chalk.bold.underline('                                       ')}\n`,
      );
    }

    bailOnUnansweredQuestions(questions, this.answers, headless, askAnswered);
    this.answers = await this.prompt(questions, 'config');
  }

  // Generate GitHub workflows
  writingWorkflow() {
    this.fs.copyTpl(
      this.templatePath('docs-deploy.yaml'),
      destinationGitPath('.github/workflows/docs-deploy.yaml'),
      {
        projectName: this.answers.projectName,
        serviceName: this.answers.serviceName,
      },
    );
  }

  writingBackstage() {
    this.config.addGeneratorToDoc('gh-docs-deploy');
    this.config.save();
  }
}
