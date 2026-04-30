const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../task_engine.js');

test('task engine exposes billing and repair status presets', () => {
	assert.equal(engine.TASK_TYPES.repair, '报修');
	assert.equal(engine.TASK_TYPES.complaint, '投诉建议');
	assert.equal(engine.TASK_STATUSES.pending, '待受理');
	assert.equal(engine.TASK_STATUSES.completed, '已完成');
});

test('task logs normalize the change payload', () => {
	const payload = engine.buildTaskLogPayload({
		taskId: 9,
		communityId: 3,
		operatorId: 88,
		operatorType: 'admin',
		action: 'assign',
		fromStatus: 'pending',
		toStatus: 'assigned',
		content: '派给维修人员'
	});
	assert.equal(payload.taskId, 9);
	assert.equal(payload.communityId, 3);
	assert.equal(payload.toStatus, 'assigned');
});

test('task records normalize the canonical task fields', () => {
	const record = engine.buildTaskRecord({
		communityId: 7,
		type: 'repair',
		title: '灯坏了',
		content: '单元楼走廊灯不亮',
		category: 'public_area',
		status: 'pending',
		priority: 2,
		isAnonymous: false
	});
	assert.equal(record.communityId, 7);
	assert.equal(record.type, 'repair');
	assert.equal(record.status, 'pending');
	assert.equal(record.priority, 2);
});

console.log('task engine assertions passed');
