const MAX_PARAMS_LENGTH = 2000;

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function redactValue(key, value) {
	const lowerKey = normalizeText(key).toLowerCase();
	if (!lowerKey) return value;
	if (lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
		return '[REDACTED]';
	}
	if (lowerKey === 'code' && typeof value === 'string' && value.length > 6) {
		return '[REDACTED]';
	}
	return value;
}

function redactPayload(input) {
	if (Array.isArray(input)) {
		return input.map((item) => redactPayload(item));
	}
	if (!input || typeof input !== 'object') {
		return input;
	}
	const output = {};
	for (const [key, value] of Object.entries(input)) {
		output[key] = redactValue(key, redactPayload(value));
	}
	return output;
}

function summarizeParams(params = {}) {
	try {
		const redacted = redactPayload(params);
		const text = JSON.stringify(redacted);
		if (text.length <= MAX_PARAMS_LENGTH) return text;
		return `${text.slice(0, MAX_PARAMS_LENGTH)}...`;
	} catch (err) {
		return '{}';
	}
}

function buildAuditDescriptor(route = '', rule = null) {
	const routeName = normalizeText(route);
	return {
		route: routeName,
		moduleKey: rule && rule.module ? normalizeText(rule.module) : '',
		actionKey: rule && rule.action ? normalizeText(rule.action) : ''
	};
}

function buildAuditRecord({
	adminUser = null,
	community = null,
	route = '',
	rule = null,
	status = 'success',
	message = '',
	params = {}
} = {}) {
	const descriptor = buildAuditDescriptor(route, rule);
	return {
		_openid: normalizeText(adminUser && adminUser._openid) || '',
		admin_id: adminUser && adminUser.id != null ? Number(adminUser.id) : null,
		username: normalizeText(adminUser && adminUser.username),
		role: normalizeText(adminUser && adminUser.role) || 'admin',
		community_id: community && community.id != null ? Number(community.id) : null,
		community_name: normalizeText(community && community.name),
		route: descriptor.route,
		module_key: descriptor.moduleKey,
		action_key: descriptor.actionKey,
		status: normalizeText(status) === 'failed' ? 'failed' : 'success',
		message: normalizeText(message).slice(0, 255),
		params_json: summarizeParams(params)
	};
}

module.exports = {
	MAX_PARAMS_LENGTH,
	buildAuditDescriptor,
	buildAuditRecord,
	redactPayload,
	summarizeParams
};
