import { createRequire } from 'node:module';

const requireFrontend = createRequire(new URL('../apps/frontend/package.json', import.meta.url));

export function configureFrontendDevEnv(appRoot) {
  const { loadEnvConfig } = requireFrontend('@next/env');
  loadEnvConfig(appRoot, true, { info() {}, error: console.error });
  if (!process.env.BACKEND_URL?.trim()) process.env.BACKEND_URL = 'http://127.0.0.1:8080';
}
