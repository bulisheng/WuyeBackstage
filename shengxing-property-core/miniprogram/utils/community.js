function normalizeCommunity(value) {
	if (value == null) return '';
	return String(value).trim();
}

function getCurrentCommunity(state = {}) {
	if (!state || typeof state !== 'object') return null;
	const current = state.currentCommunity && typeof state.currentCommunity === 'object'
		? state.currentCommunity
		: null;
	if (!current) return null;
	const name = normalizeCommunity(current.name);
	const schemaName = normalizeCommunity(current.schemaName || state.schemaName);
	const id = normalizeCommunity(current.id);
	if (!name && !schemaName && !id) return null;
	return Object.assign({}, current, {
		id,
		name,
		schemaName
	});
}

function getCommunityDisplayName(state = {}, fallback = '') {
	const current = getCurrentCommunity(state);
	if (current && current.name) return current.name;
	return normalizeCommunity(fallback);
}

function buildCommunityRequestParams(params = {}, state = {}) {
	const next = Object.assign({}, params);
	const current = getCurrentCommunity(state);
	if (current) {
		if (!next.communityId && current.id) next.communityId = current.id;
		if (!next.communityName && current.name) next.communityName = current.name;
		if (!next.schemaName && current.schemaName) next.schemaName = current.schemaName;
	} else if (!next.schemaName && normalizeCommunity(state.schemaName)) {
		next.schemaName = normalizeCommunity(state.schemaName);
	}
	return next;
}

module.exports = {
	normalizeCommunity,
	getCurrentCommunity,
	getCommunityDisplayName,
	buildCommunityRequestParams
};
