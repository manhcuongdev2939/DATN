import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPagination } from '../utils/response.js';

test('buildPagination calculates totals correctly', () => {
  const pagination = buildPagination({ page: 2, limit: 10, total: 45 });
  assert.equal(pagination.totalPages, 5);
  assert.equal(pagination.page, 2);
  assert.equal(pagination.limit, 10);
  assert.equal(pagination.total, 45);
});

test('buildPagination handles zero limit safely', () => {
  const pagination = buildPagination({ page: 1, limit: 0, total: 0 });
  assert.equal(pagination.totalPages, 0);
  assert.equal(pagination.limit, 0);
});

