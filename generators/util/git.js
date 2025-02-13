import * as fs from 'fs';
import path from 'path';

export function extractGitHubSlug(gitUrl) {
  if (typeof gitUrl !== 'string') {
    return null;
  }
  // Regular expression to match GitHub repository URL
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9-]+\/[a-zA-Z0-9-]+)/;

  // Match the URL with the regular expression
  const match = gitUrl.match(regex);

  // If there's a match, return the GitHub slug, else return null
  return match ? match[1] : null;
}

export function findGitRepoOrigin(startPath = process.cwd()) {
  let currentPath = startPath;

  while (currentPath !== path.parse(currentPath).root) {
    const gitConfigPath = path.join(currentPath, '.git', 'config');

    try {
      if (fs.statSync(gitConfigPath).isFile()) {
        return gitConfigPath;
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // If the file isn't found, continue walking up
    }

    currentPath = path.dirname(currentPath);
  }

  console.error('No .git/config file found');
  return null;
}

export function getGitRepoOriginUrl() {
  try {
    // Read the contents of the .git/config file
    const gitConfigPath = findGitRepoOrigin();
    if (gitConfigPath === null) {
      return null;
    }
    const configContent = fs.readFileSync(gitConfigPath, 'utf8');

    // Regular expression to match the remote "origin" URL
    const regex = /\[remote "origin"\]\s+url\s*=\s*(.*)/g;
    const match = regex.exec(configContent);

    // If there's a match, return the origin URL, else return null
    return match ? match[1].trim() : null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}
