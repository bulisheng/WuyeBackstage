function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function buildCommunitySchemaName(value) {
	return normalizeText(value)
		.toLowerCase()
		.replace(/[^a-z0-9_]+/g, '_')
		.replace(/^_+|_+$/g, '') || 'community';
}

function buildCommunityPayload(form = {}) {
	const code = normalizeText(form.code);
	const name = normalizeText(form.name);
	const schemaName = normalizeText(form.schemaName) || buildCommunitySchemaName(code || name);
	const address = normalizeText(form.address);
	const phone = normalizeText(form.phone);
	const sortValue = Number(form.sort);

	return {
		code,
		name,
		schemaName,
		address,
		phone,
		active: form.active === false || form.active === 0 || form.active === '0' ? 0 : 1,
		sort: Number.isFinite(sortValue) ? sortValue : 100
	};
}

function buildCommunityLabel(item = {}) {
	const name = normalizeText(item.name);
	const schemaName = normalizeText(item.schemaName);
	if (!name && !schemaName) return '';
	return schemaName ? `${name} · ${schemaName}` : name;
}

function createCommunityForm(item = {}) {
	return {
		id: item.id || '',
		code: item.code || '',
		name: item.name || '',
		schemaName: item.schemaName || '',
		address: item.address || '',
		phone: item.phone || '',
		active: item.active === false || item.active === 0 ? 0 : 1,
		sort: Number(item.sort || 100)
	};
}

export {
	buildCommunityPayload,
	buildCommunityLabel,
	createCommunityForm,
	buildCommunitySchemaName
};
