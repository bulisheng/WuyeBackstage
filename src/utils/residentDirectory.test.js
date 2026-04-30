import assert from 'node:assert/strict';
import test from 'node:test';

import {
	buildResidentSearchTokens,
	matchesResidentKeyword,
	normalizeResidentImportRow
} from './residentDirectory.js';

const row = { mobile: '13800000000', name: '张三', house: '1-2-301' };

test('resident row is searchable by mobile', () => {
	assert.equal(matchesResidentKeyword(row, '13800000000'), true);
});

test('resident row is searchable by house', () => {
	assert.equal(matchesResidentKeyword(row, '1-2-301'), true);
});

test('resident row is searchable by name as secondary token', () => {
	const tokens = buildResidentSearchTokens(row);
	assert.equal(tokens.secondary.includes('张三'), true);
	assert.equal(matchesResidentKeyword(row, '张三'), true);
});

test('import normalization keeps mobile as upsert key and name as display data', () => {
	const result = normalizeResidentImportRow(row, 'owner');
	assert.equal(result.upsertKey, '13800000000');
	assert.equal(result.mobile, '13800000000');
	assert.equal(result.name, '张三');
	assert.equal(result.identityType, 'owner');
});
