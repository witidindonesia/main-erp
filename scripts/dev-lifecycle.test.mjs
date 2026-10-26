import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import test from 'node:test';

const require = createRequire(import.meta.url);
const turbo = require.resolve('turbo/bin/turbo');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };

async function waitUntil(check, message) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (check()) return;
    await delay(30);
  }
  assert.fail(message);
}

async function lifecycle(fail) {
  const dir = mkdtempSync(path.join(tmpdir(), 'mizu-dev-lifecycle-'));
  let runner;
  const pids = [];
  try {
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'lifecycle', private: true, packageManager: 'pnpm@9.15.0' }));
    writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n");
    writeFileSync(path.join(dir, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\nimporters:\n  .: {}\n  apps/frontend: {}\n  apps/backend: {}\n");
    writeFileSync(path.join(dir, 'turbo.json'), JSON.stringify({ tasks: { dev: { persistent: true, cache: false } } }));
    for (const name of ['frontend', 'backend']) {
      const app = path.join(dir, 'apps', name); mkdirSync(app, { recursive: true });
      writeFileSync(path.join(app, 'package.json'), JSON.stringify({ name: `@mizu/${name}`, scripts: { dev: 'node dev.mjs' } }));
      writeFileSync(path.join(app, 'dev.mjs'), `
        import { writeFileSync, existsSync } from 'node:fs';
        import { spawn } from 'node:child_process';
        const pids = [process.pid];
        if (${JSON.stringify(name)} === 'backend') {
          const worker = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
          pids.push(worker.pid);
        }
        writeFileSync(${JSON.stringify(path.join(dir, name + '.json'))}, JSON.stringify(pids));
        setInterval(() => {
          if (${fail && name === 'frontend'} && existsSync(${JSON.stringify(path.join(dir, 'backend.json'))})) process.exit(7);
        }, 30);
      `);
    }
    runner = spawn(process.execPath, [turbo, 'run', 'dev', '--filter=@mizu/frontend', '--filter=@mizu/backend', '--ui=stream'], {
      cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
      env: { ...process.env, TURBO_TELEMETRY_DISABLED: '1', CI: 'true' },
    });
    let output = ''; runner.stdout.on('data', (v) => { output += v; }); runner.stderr.on('data', (v) => { output += v; });
    const exited = once(runner, 'exit');
    await waitUntil(() => ['frontend', 'backend'].every((n) => existsSync(path.join(dir, n + '.json'))), 'Dev tasks failed to start: ' + output);
    for (const n of ['frontend', 'backend']) pids.push(...JSON.parse(readFileSync(path.join(dir, n + '.json'), 'utf8')));
    // A terminal sends Ctrl+C to the foreground process group, including the Turbo native child.
    if (!fail) process.kill(-runner.pid, 'SIGINT');
    let timer;
    try {
      await Promise.race([exited, new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Dev runner did not stop: ' + output)), 15_000);
      })]);
    } finally { clearTimeout(timer); }
    await waitUntil(() => pids.every((pid) => !alive(pid)), 'Dev runner left a task or grandchild running: ' + output);
    if (fail) assert.notEqual(runner.exitCode, 0, output);
  } finally {
    if (runner && runner.exitCode === null && runner.signalCode === null) process.kill(-runner.pid, 'SIGTERM');
    // Only processes created by this isolated fixture may be cleaned up.
    for (const pid of pids) if (alive(pid)) process.kill(pid, 'SIGKILL');
    rmSync(dir, { recursive: true, force: true });
  }
}

test('dev Ctrl+C stops both tasks and backend grandchildren', { timeout: 35_000 }, () => lifecycle(false));
test('a failed dev task stops its sibling and backend grandchildren', { timeout: 35_000 }, () => lifecycle(true));
