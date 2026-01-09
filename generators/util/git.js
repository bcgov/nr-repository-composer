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
      if (
        fs.existsSync(gitConfigPath) &&
        fs.lstatSync(gitConfigPath).isFile()
      ) {
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

/**
 * Join a path to the destination git root.
 * @param  {...any} dest
 */
export function destinationGitPath(...dest) {
  let filepath = path.join.apply(path, dest);

  if (!path.isAbsolute(filepath)) {
    filepath = path.join(findGitRepoOrigin(), '..', '..', filepath);
  }

  return filepath;
}

/**
 * Compute a path relative to the repository's git destination directory.
 *
 * Joins the provided path segments into a single filepath and returns the path
 * relative to destinationGitPath('.').
 *
 * @param {...string} dest - One or more path segments to join into the target filepath.
 * @returns {string} The relative path from the repository git destination root to the joined filepath.
 */
export function relativeGitPath(...dest) {
  let filepath = path.join.apply(path, dest);

  return path.relative(destinationGitPath('.'), filepath);
}

/**
 * Determine whether the current repository is a monorepo.
 *
 * This function infers monorepo status by calling `relativeGitPath()` and
 * coercing its result to a boolean. If `relativeGitPath()` returns a truthy
 * value (e.g., a non-empty path), this function returns `true`; otherwise it
 * returns `false`.
 *
 * @returns {boolean} `true` if the repository appears to be a monorepo, `false` otherwise.
 *
 * @see relativeGitPath
 */
export function isMonoRepo() {
  return !!relativeGitPath();
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

/**
 * Ensure repository-level directories exist (creates them if missing).
 * @param {Array<string>} dirs
 */
export function ensureLocalMavenSupportDirs(dirs = ['.docker', '.m2repo']) {
  dirs.forEach((dir) => {
    try {
      const dest = destinationGitPath(dir);
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
    } catch (err) {
      console.error(`Failed to create directory ${dir}: ${err.message}`);
    }
  });
}
