#!/usr/bin/env node
// Copies all non-TypeScript assets (templates, config files) from src/ to generators/
import { cpSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { execSync } from 'child_process';

const files = execSync("find src -type f ! -name '*.ts'", { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

for (const file of files) {
  const dest = file.replace(/^src\//, 'generators/');
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(file, dest, { force: true });
}

console.log(`Copied ${files.length} asset(s) from src/ to generators/`);
