import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateTestDatabaseUrl(value) {
  if (!value?.trim()) throw new Error('TEST_DATABASE_URL wajib diisi; tes integrasi tidak boleh diam-diam dilewati.');
  let url;
  try { url = new URL(value); } catch { throw new Error('TEST_DATABASE_URL harus berupa URL PostgreSQL lokal yang valid.'); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('TEST_DATABASE_URL harus menunjuk PostgreSQL lokal/disposable.');
  }
  if (['host', 'hostaddr', 'service'].some((option) => url.searchParams.has(option))) {
    throw new Error('TEST_DATABASE_URL tidak boleh memakai override target koneksi.');
  }
  return value;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const testUrl = validateTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    const backend = fileURLToPath(new URL('../apps/backend/', import.meta.url));
    // Some packages test migrations using global DDL; sharing one disposable
    // database requires serial package execution to avoid cross-package locks.
    const result = spawnSync('go', ['-C', backend, 'test', './...', '-count=1', '-p=1'], {
      stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: testUrl },
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
