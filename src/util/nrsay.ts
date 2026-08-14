import chalk from 'chalk';

export function nrsay(
  title: string,
  subtitle: string,
  links: [string, string][] = [],
) {
  return `
${chalk.bold.underline(title)}

${subtitle}

${links.map(([label, url]) => `${label}: ${url}`).join('\n')}
${chalk.bold.underline('                                       ')}
`;
}
