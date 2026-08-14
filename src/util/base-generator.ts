'use strict';
import Generator from 'yeoman-generator';
import type {
  BaseOptions,
  PromptAnswers,
  PromptQuestion,
} from 'yeoman-generator';
import chalk from 'chalk';
import { nrsay } from './nrsay.js';
import {
  YEOMAN_CONFIG_NAMESPACE,
  YEOMAN_OPTION_ASK_ANSWERED,
} from './constants.js';
import { OPTION_HEADLESS, OPTION_HELP_PROMPTS } from './options.js';
import { bailOnUnansweredQuestions } from './process.js';
import { BackstageStorage } from './backstage.storage.js';
import { BACKSTAGE_FILENAME, BACKSTAGE_KIND_COMPONENT } from './yaml.js';
import { getPromptToUsage } from './prompts.js';
import { outputReport } from './report.js';

/**
 * Base generator class that handles common boilerplate:
 * - Constructor options (headless, help-prompts)
 * - Storage initialization
 * - Prompting lifecycle (nrsay banner, help prompts, bail on unanswered)
 * - Backstage documentation tracking
 * - End-of-run reporting
 *
 * Subclasses set instance properties in their constructor:
 * - this._nrsayConfig — { title, subtitle, links } or null to skip the banner
 * - this._questions — array of prompt definitions (default: [])
 * - this._storageOptions — { kind, storageOptions } for BackstageStorage
 * - writing*() methods — actual file generation logic
 * - end() — only if custom cleanup beyond reporting is needed
 */
export class BaseGenerator extends Generator {
  protected _nrsayConfig: {
    title: string;
    subtitle: string;
    links: [string, string][];
  } | null;
  protected _questions: PromptQuestion[];
  protected answers: PromptAnswers;
  protected showGeneratorDeprecationWarning = false;

  constructor(args: string | string[], opts: BaseOptions) {
    super(args as string[], opts);
    this.option(OPTION_HEADLESS);
    this.option(OPTION_HELP_PROMPTS);
    this._nrsayConfig = null;
    this._questions = [];
  }

  // Called by Yeoman during its own constructor — must be a virtual method,
  // not a constructor property, because it runs before subclass constructors.
  _getStorageOptions(): { kind: string; storageOptions: Record<string, any> } {
    return { kind: BACKSTAGE_KIND_COMPONENT, storageOptions: {} };
  }

  override _getStorage(): any {
    const { kind, storageOptions } = this._getStorageOptions();
    return new BackstageStorage(
      this.rootGeneratorName(),
      kind,
      this.destinationPath(BACKSTAGE_FILENAME),
      storageOptions,
    );
  }

  protected get backstageConfig(): BackstageStorage {
    return this.config as unknown as BackstageStorage;
  }

  /**
   * Hook called before prompting begins. Override for custom pre-prompt logic
   * (e.g., processing deprecated properties).
   */
  _prePrompt() {}

  /**
   * Hook called after prompts resolve. Override for post-prompt validation
   * (e.g., aborting on invalid answers).
   */
  _postPrompt() {}

  /**
   * Returns the generator name (without namespace prefix) for reporting.
   * @returns {string}
   */
  _getGeneratorName() {
    const name = this.rootGeneratorName();
    return name.replace('nr-repository-composer:', '');
  }

  async prompting() {
    const headless = this.options[OPTION_HEADLESS.name];
    const askAnswered = this.options[YEOMAN_OPTION_ASK_ANSWERED];
    const helpPrompts = this.options[OPTION_HELP_PROMPTS.name];
    this.answers = this.backstageConfig.getAnswers();

    // Pre-prompt hook (e.g., process deprecated properties)
    this._prePrompt();

    if (!headless && this._nrsayConfig) {
      this.log(
        nrsay(
          this._nrsayConfig.title,
          this._nrsayConfig.subtitle,
          this._nrsayConfig.links,
        ),
      );
    }

    if (helpPrompts) {
      this.log(chalk.bold('Prompts\n'));
      for (const question of this._questions) {
        this.log(getPromptToUsage(question));
      }
      this.log(
        `${chalk.bold.underline('                                       ')}\n`,
      );
    }

    bailOnUnansweredQuestions(
      this._questions,
      this.answers,
      headless,
      askAnswered,
    );
    this.answers = await this.prompt(this._questions, YEOMAN_CONFIG_NAMESPACE);

    // Post-prompt hook (e.g., validation, abort checks)
    this._postPrompt();
  }

  writingBackstage() {
    this.backstageConfig.addGeneratorToDoc(this._getGeneratorName());
    this.backstageConfig.save();
  }

  end() {
    if (!this.options[OPTION_HEADLESS.name]) {
      outputReport(this, this._getGeneratorName(), this.answers);
    }
  }
}
