import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

fs.mkdirSync('qa', { recursive: true });
const url = process.argv[2] || 'http://localhost:3000/';
const result = spawnSync(process.execPath, [
  'node_modules/lighthouse/cli/index.js', url,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--form-factor=mobile', '--output=html', '--output=json',
  '--output-path=./qa/lighthouse-mobile', '--chrome-flags=--headless',
], { stdio: 'inherit' });
process.exit(result.status ?? 1);
