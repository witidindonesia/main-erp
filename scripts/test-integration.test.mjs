import assert from 'node:assert/strict';
import test from 'node:test';
import { validateTestDatabaseUrl } from './test-integration.mjs';

test('integration command refuses an empty test database instead of skipping tests', () => {
  assert.throws(() => validateTestDatabaseUrl(''), /TEST_DATABASE_URL/);
});

test('integration command refuses a remote database', () => {
  assert.throws(() => validateTestDatabaseUrl('postgres://user@example.com/production'), /lokal/);
});

test('integration command refuses connection-target query overrides', () => {
  for (const option of ['host', 'hostaddr', 'service']) {
    assert.throws(() => validateTestDatabaseUrl(`postgres://localhost/test?${option}=example.com`), /override/);
  }
});

test('integration command accepts an explicit local PostgreSQL test database', () => {
  const url = 'postgres://postgres@127.0.0.1:55432/mizu_test';
  assert.equal(validateTestDatabaseUrl(url), url);
});
