import {
  TOOLS_DEFAULT_PROPERTIES,
  YEOMAN_OPTION_ASK_ANSWERED,
  YEOMAN_CONFIG_NAMESPACE,
} from './constants.js';

describe('constants', () => {
  it('exposes the default tooling properties', () => {
    expect(TOOLS_DEFAULT_PROPERTIES).toBe(
      'ARTIFACTORY_USERNAME,ARTIFACTORY_PASSWORD',
    );
  });

  it('exposes the Yeoman ask-answered option name', () => {
    expect(YEOMAN_OPTION_ASK_ANSWERED).toBe('ask-answered');
  });

  it('exposes the Yeoman config namespace', () => {
    expect(YEOMAN_CONFIG_NAMESPACE).toBe('config');
  });
});
