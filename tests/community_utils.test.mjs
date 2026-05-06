import assert from 'node:assert/strict';
import { buildCommunityPayload, buildCommunityLabel } from '../src/utils/community.js';

const payload = buildCommunityPayload({
	code: '  rzb-002  ',
	name: '  融华世家小区二期  ',
	address: '  北京市海淀区  ',
	phone: '  010-88888888  ',
	active: 0,
	sort: '12'
});

assert.deepEqual(payload, {
	code: 'rzb-002',
	name: '融华世家小区二期',
	schemaName: 'rzb_002',
	address: '北京市海淀区',
	phone: '010-88888888',
	active: 0,
	sort: 12
});

assert.equal(buildCommunityLabel({
	name: '融华世家小区',
	schemaName: 'rzb'
}), '融华世家小区 · rzb');

console.log('community utils assertions passed');
