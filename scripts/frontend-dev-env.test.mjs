import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const helper = new URL('./frontend-dev-env.mjs', import.meta.url).href;

function resolveOrigin(shellValue, fileValue) {
  const dir = mkdtempSync(path.join(tmpdir(), 'mizu-dev-env-'));
  try {
    if (fileValue !== undefined) writeFileSync(path.join(dir, '.env.local'), `BACKEND_URL=${fileValue}\n`);
    const env = { PATH: process.env.PATH, NODE_ENV: 'development' };
    if (shellValue !== undefined) env.BACKEND_URL = shellValue;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import { configureFrontendDevEnv } from ${JSON.stringify(helper)};
       configureFrontendDevEnv(${JSON.stringify(dir)});
       console.log(JSON.stringify(process.env.BACKEND_URL));`], { env, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout.trim());
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('frontend dev keeps the shell backend origin ahead of app env', () => {
  assert.equal(resolveOrigin('http://127.0.0.1:9080', 'http://127.0.0.1:9081'), 'http://127.0.0.1:9080');
});

test('frontend dev keeps the backend origin from app env when shell is absent', () => {
  assert.equal(resolveOrigin(undefined, 'http://127.0.0.1:9081'), 'http://127.0.0.1:9081');
});

test('frontend dev defaults to local Go only when no backend origin is configured', () => {
  assert.equal(resolveOrigin(undefined, undefined), 'http://127.0.0.1:8080');
});
