const assert = require('node:assert/strict');
const community = require('../miniprogram/utils/community.js');

const authState = {
	currentCommunity: {
		id: 'rzb-001',
		name: '荣尊堡',
		schemaName: 'rzb'
	},
	schemaName: 'rzb'
};

assert.equal(community.getCommunityDisplayName(authState, '幸福里小区'), '荣尊堡');
assert.equal(community.getCommunityDisplayName({}, '幸福里小区'), '幸福里小区');

const params = community.buildCommunityRequestParams(
	{ page: 1 },
	authState
);

assert.deepEqual(params, {
	page: 1,
	communityId: 'rzb-001',
	communityName: '荣尊堡',
	schemaName: 'rzb'
});

const updatedState = community.setCurrentCommunity({
	id: 'oljd-001',
	name: '欧陆经典',
	schemaName: 'oljd'
}, authState);

assert.deepEqual(updatedState.currentCommunity, {
	id: 'oljd-001',
	name: '欧陆经典',
	schemaName: 'oljd'
});

assert.equal(updatedState.schemaName, 'oljd');

console.log('community context assertions passed');
