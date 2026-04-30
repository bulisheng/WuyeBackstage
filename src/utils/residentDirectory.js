function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function normalizeSearchToken(value) {
	return normalizeText(value).toLowerCase();
}

function normalizeMobile(value) {
	return normalizeText(value).replace(/\s+/g, '');
}

function pickValue(row = {}, keys = []) {
	for (const key of keys) {
		const value = row[key];
		if (value != null && normalizeText(value)) return normalizeText(value);
	}
	return '';
}

function normalizeResidentType(value) {
	const next = normalizeText(value);
	if (next === 'tenant' || next === '租户') return 'tenant';
	return 'owner';
}

function buildResidentSearchTokens(row = {}) {
	const mobile = normalizeMobile(row.mobile || row.ownerMobile || row.tenantMobile);
	const house = normalizeText(row.house || row.primaryHouse || row.room);
	const name = normalizeText(row.name || row.ownerName || row.tenantName);
	return {
		primary: [mobile].filter(Boolean),
		house: [house].filter(Boolean),
		secondary: [name].filter(Boolean),
		all: [mobile, house, name].filter(Boolean)
	};
}

function matchesToken(values = [], keyword = '') {
	const target = normalizeSearchToken(keyword);
	if (!target) return true;
	return values.some((value) => normalizeSearchToken(value).includes(target));
}

function matchesResidentKeyword(row = {}, keyword = '') {
	const target = normalizeSearchToken(keyword);
	if (!target) return true;
	const tokens = buildResidentSearchTokens(row);
	if (matchesToken(tokens.primary, target)) return true;
	if (matchesToken(tokens.house, target)) return true;
	return matchesToken(tokens.secondary, target);
}

function buildResidentDisplayLabel(row = {}, fallbackType = 'owner') {
	const type = normalizeResidentType(row.identityType || row.residentType || fallbackType);
	const typeLabel = type === 'tenant' ? '租户' : '业主';
	const name = normalizeText(row.name) || '未填姓名';
	const mobile = normalizeMobile(row.mobile) || '无手机号';
	const house = normalizeText(row.house) || '无房号';
	return `${typeLabel} · ${name} · ${mobile} · ${house}`;
}

function normalizeResidentImportRow(row = {}, fallbackType = 'owner') {
	const mobile = normalizeMobile(pickValue(row, ['mobile', '手机号', '电话', '联系电话', 'ownerMobile', 'tenantMobile']));
	const name = pickValue(row, ['name', '姓名', '业主姓名', '租户姓名', 'ownerName', 'tenantName']);
	const house = pickValue(row, ['house', '房号', '房屋', '房屋地址', 'room', 'primaryHouse']);
	const identityType = normalizeResidentType(row.identityType || row.residentType || row['住户类型'] || fallbackType);
	const errors = [];
	if (!mobile) errors.push('手机号不能为空');
	if (!house) errors.push('房号不能为空');
	return {
		identityType,
		upsertKey: mobile,
		mobile,
		name,
		house,
		mode: errors.length ? 'manual_review' : 'upsert',
		errors
	};
}

function normalizeResidentImportRows(rows = [], fallbackType = 'owner') {
	return (Array.isArray(rows) ? rows : []).map((row) => normalizeResidentImportRow(row, fallbackType));
}

export {
	buildResidentDisplayLabel,
	buildResidentSearchTokens,
	matchesResidentKeyword,
	normalizeResidentImportRow,
	normalizeResidentImportRows,
	normalizeResidentType,
	normalizeSearchToken
};
