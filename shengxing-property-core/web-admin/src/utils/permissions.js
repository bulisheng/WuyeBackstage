const ROLE_OPTIONS = [
	{ value: 'super_admin', label: '超级管理员', scope: '全部小区、全部模块、全部权限' },
	{ value: 'admin', label: '管理员', scope: '按分配小区管理业务' },
	{ value: 'finance', label: '财务', scope: '缴费、账单、催缴情境' },
	{ value: 'customer_service', label: '客服', scope: '报修、投诉、通知' },
	{ value: 'repairman', label: '维修', scope: '工单处理' }
];

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function listRoleOptions() {
	return ROLE_OPTIONS.map((item) => Object.assign({}, item));
}

function parsePermissions(value) {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeText(item)).filter(Boolean);
	}
	return normalizeText(value)
		.split(/[\s,，]+/)
		.map((item) => normalizeText(item))
		.filter(Boolean);
}

function buildPermissionRecord(form = {}) {
	const adminId = Number(form.adminId);
	const communityId = Number(form.communityId);
	const role = normalizeText(form.role) || 'admin';
	return {
		adminId: Number.isFinite(adminId) && adminId > 0 ? adminId : 0,
		communityId: Number.isFinite(communityId) && communityId > 0 ? communityId : 0,
		role,
		permissions: parsePermissions(form.permissions),
		active: form.active === false || form.active === 0 || form.active === '0' ? 0 : 1
	};
}

function buildRoleLabel(role) {
	const found = ROLE_OPTIONS.find((item) => item.value === normalizeText(role));
	return found ? found.label : normalizeText(role);
}

function summarizePermissions(records = []) {
	if (!Array.isArray(records) || !records.length) return '无';
	const activeCount = records.filter((item) => item && item.active !== false && item.active !== 0 && item.active !== '0').length;
	const first = records[0] || {};
	const scope = parsePermissions(first.permissions).slice(0, 3).join(', ');
	const roleLabel = buildRoleLabel(first.role);
	return `${roleLabel}${activeCount}/${records.length}${scope ? ` · ${scope}` : ''}`;
}

function buildPermissionMatrix(communities = [], permissions = [], roles = ROLE_OPTIONS) {
	const roleColumns = (Array.isArray(roles) ? roles : ROLE_OPTIONS).map((item) => ({
		value: item.value,
		label: item.label
	}));
	const communityRows = (Array.isArray(communities) ? communities : []).map((community) => {
		const cells = roleColumns.map((role) => {
			const records = (Array.isArray(permissions) ? permissions : []).filter((item) =>
				Number(item.communityId) === Number(community.id) && String(item.role || '').trim() === role.value
			);
			return {
				role: role.value,
				label: role.label,
				count: records.length,
				summary: summarizePermissions(records),
				records
			};
		});
		return {
			communityId: Number(community.id),
			communityName: normalizeText(community.name),
			schemaName: normalizeText(community.schemaName),
			cells
		};
	});
	return { roleColumns, communityRows };
}

export {
	ROLE_OPTIONS,
	listRoleOptions,
	buildPermissionRecord,
	buildRoleLabel,
	parsePermissions,
	buildPermissionMatrix,
	summarizePermissions
};
