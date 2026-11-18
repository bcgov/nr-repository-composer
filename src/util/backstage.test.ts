import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { findSystemDefault } from './backstage.js';

describe('System defaults', () => {
  let directory: string;
  let repo: string;
  let component: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'backstage-system-'));
    repo = path.join(directory, 'repo');
    component = path.join(repo, 'services', 'web');
    fs.mkdirSync(component, { recursive: true });
    fs.mkdirSync(path.join(repo, '.git'));
    fs.writeFileSync(path.join(repo, '.git', 'config'), '[core]\n');
    process.chdir(component);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(directory, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  function writeSystem(target: string, name: string) {
    fs.writeFileSync(
      path.join(target, 'catalog-info.yaml'),
      `kind: Location\nmetadata:\n  name: services\n---\nkind: System\nmetadata:\n  name: ${name}\nspec:\n  owner: artists\n`,
    );
  }

  it('finds a System in a multi-document catalog at the repository root', () => {
    writeSystem(repo, 'artist-portal');
    expect(findSystemDefault()).toBe('artist-portal');
  });

  it('uses the first System in scan order rather than the nearest ancestor', () => {
    writeSystem(repo, 'root-system');
    writeSystem(path.dirname(component), 'parent-system');
    writeSystem(component, 'local-system');
    expect(findSystemDefault()).toBe('root-system');
  });

  it('does not use a System outside the repository', () => {
    writeSystem(directory, 'outside-system');
    fs.writeFileSync(
      path.join(repo, 'catalog-info.yaml'),
      'kind: Component\nmetadata:\n  name: artist-web\n',
    );
    expect(findSystemDefault()).toBeUndefined();
  });

  it('follows Location targets and ignores unnamed Systems', () => {
    fs.writeFileSync(
      path.join(repo, 'catalog-info.yaml'),
      'kind: Component\nmetadata:\n  name: artist-web\n---\nkind: System\n---\nkind: Location\nspec:\n  targets:\n    - services/web/catalog-info.yaml\n',
    );
    writeSystem(component, 'artist-portal');
    expect(findSystemDefault()).toBe('artist-portal');
  });

  it('reports malformed catalogs through the shared scanner', () => {
    fs.writeFileSync(
      path.join(repo, 'catalog-info.yaml'),
      'kind: System\nmetadata: [\n',
    );
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(findSystemDefault()).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Invalid catalog'),
    );
  });
});
