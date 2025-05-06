import chalk from 'chalk';

export function nrsay(title, subtitle, ...args) {
  return `
${chalk.bold.underline(title)}

${subtitle}

${args.map((arg) => `${arg[0]}: ${arg[1]}`).join('\n')}
${chalk.bold.underline('                                       ')}
`;
}
