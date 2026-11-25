const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { createApp } = require('../src/app');

test('GET /health - DB 연결 성공', async () => {
  const pool = { query: async () => ({ rows: [{ '?column?': 1 }] }) };

  const response = await request(createApp(pool)).get('/health');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', database: 'connected' });
});

test('GET /health - DB 연결 실패', async () => {
  const pool = {
    query: async () => {
      throw new Error('DB connection failed');
    },
  };

  const response = await request(createApp(pool)).get('/health');

  assert.equal(response.status, 503);
  assert.equal(response.body.status, 'error');
});
