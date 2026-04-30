const test = require('node:test');
const assert = require('node:assert/strict');
const audit = require('../admin_audit.js');

test('audit records redact secrets and keep route metadata', () => {
	const record = audit.buildAuditRecord({
		adminUser: { id: 7, username: 'alice', role: 'admin', _openid: 'openid-1' },
		community: { id: 3, name: '荣尊堡' },
		route: 'admin/user/save',
		rule: { module: 'permissions', action: 'admin:user:manage' },
		status: 'failed',
		message: 'nope',
		params: { username: 'alice', password: 'secret-123456', code: '1234567' }
	});

	assert.equal(record.admin_id, 7);
	assert.equal(record.username, 'alice');
	assert.equal(record.community_id, 3);
	assert.equal(record.route, 'admin/user/save');
	assert.equal(record.module_key, 'permissions');
	assert.equal(record.action_key, 'admin:user:manage');
	assert.equal(record.status, 'failed');
	assert.ok(record.params_json.includes('[REDACTED]'));
	assert.ok(!record.params_json.includes('secret-123456'));
});

test('audit params are truncated to a bounded length', () => {
	const payload = audit.summarizeParams({ text: 'x'.repeat(5000) });
	assert.ok(payload.length <= audit.MAX_PARAMS_LENGTH + 3);
});

console.log('admin audit assertions passed');
