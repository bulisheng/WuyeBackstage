const test = require('node:test');
const assert = require('node:assert/strict');
const scope = require('../project/house/service/community_scope.js');

test('community names are normalized before storage and comparison', () => {
	assert.equal(scope.normalizeCommunityName('  幸福里小区  '), '幸福里小区');
	assert.equal(scope.normalizeCommunityName(''), '');
	assert.equal(scope.normalizeCommunityName(null), '');
});

test('current community resolves from request before fallback', () => {
	assert.equal(
		scope.resolveCommunityName({ communityName: '阳光城小区' }, '幸福里小区'),
		'阳光城小区'
	);
	assert.equal(scope.resolveCommunityName({}, '幸福里小区'), '幸福里小区');
});

test('community scope filter only adds a condition when a community exists', () => {
	assert.deepEqual(scope.attachCommunityWhere({}, '幸福里小区'), { COMMUNITY_NAME: '幸福里小区' });
	assert.deepEqual(scope.attachCommunityWhere({ STATUS: 1 }, ''), { STATUS: 1 });
});
