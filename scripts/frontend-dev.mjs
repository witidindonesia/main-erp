import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { configureFrontendDevEnv } from './frontend-dev-env.mjs';

const appRoot = fileURLToPath(new URL('../apps/frontend/', import.meta.url));
const requireFrontend = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
configureFrontendDevEnv(appRoot);

const child = spawn(process.execPath, [requireFrontend.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], {
  cwd: appRoot, env: process.env, stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1); });
