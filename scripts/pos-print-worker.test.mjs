import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const worker = fileURLToPath(new URL('../services/pos-print-worker/pos-print-worker.mjs', import.meta.url));
const job = {
  id: 'test-job', station: 'kitchen', job_type: 'kitchen_ticket',
  requested_at: '2026-10-26T00:00:00Z', order: { order_number: 'TEST-001' },
  payload: { items: [{ quantity: 2, product_name: 'Teh' }] },
};

async function runWorker(t, args, jobs = [job]) {
  const requests = [];
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, body: body ? JSON.parse(body) : null });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: jobs }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const child = spawn(process.execPath, [worker, '--once', ...args], {
    env: {
      PRINT_QUEUE_BASE_URL: `http://127.0.0.1:${server.address().port}`,
      POS_PRINT_WORKER_TOKEN: 'test-only-token',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const [code] = await once(child, 'close');
  assert.equal(code, 0, stderr);
  return { requests, stdout, stderr };
}

test('print dry-run previews pending jobs without changing their status', { timeout: 5000 }, async (t) => {
  const { requests, stdout, stderr } = await runWorker(t, ['--dry-run']);
  assert.deepEqual(requests.map((request) => request.method), ['GET']);
  assert.match(stdout, /TEST-001/);
  assert.match(stdout, /2x Teh/);
  assert.match(stdout, /dry-run/);
  assert.equal(stderr, '');
});

test('print dry-run never marks a job failed when rendering fails', { timeout: 5000 }, async (t) => {
  const { requests, stderr } = await runWorker(t, ['--dry-run'], [{ ...job, requested_at: 'invalid-date' }]);
  assert.deepEqual(requests.map((request) => request.method), ['GET']);
  assert.match(stderr, /test-job/);
});

test('normal mock processing keeps the existing printing and printed transitions', { timeout: 5000 }, async (t) => {
  const { requests, stdout, stderr } = await runWorker(t, []);
  assert.deepEqual(requests, [
    { method: 'GET', body: null },
    { method: 'PATCH', body: { action: 'mark_printing' } },
    { method: 'PATCH', body: { action: 'mark_printed' } },
  ]);
  assert.match(stdout, /mock adapter/);
  assert.equal(stderr, '');
});

test('print dry-run handles an empty queue without mutation', { timeout: 5000 }, async (t) => {
  const { requests, stdout, stderr } = await runWorker(t, ['--dry-run'], []);
  assert.deepEqual(requests.map((request) => request.method), ['GET']);
  assert.match(stdout, /no pending print jobs/);
  assert.equal(stderr, '');
});

test('sample tickets do not contact the API', { timeout: 5000 }, async (t) => {
  const { requests, stdout, stderr } = await runWorker(t, ['--sample']);
  assert.deepEqual(requests, []);
  assert.match(stdout, /POS-SAMPLE-001/);
  assert.equal(stderr, '');
});
