const API_BASE = import.meta.env.VITE_ADMIN_API_BASE
	|| 'https://cloudbase-d9g78eneac709f5a5.service.tcloudbase.com/sxmini';

const TOKEN_KEY = 'sxwy_admin_token';
const ADMIN_ID_KEY = 'sxwy_admin_user_id';
const SCHEMA_KEY = 'sxwy_admin_schema';

function getAdminToken() {
	let token = window.localStorage.getItem(TOKEN_KEY) || '';
	if (!token) {
		token = window.prompt('请输入后台管理令牌') || '';
		if (token) window.localStorage.setItem(TOKEN_KEY, token);
	}
	return token;
}

function getSchemaName() {
	return window.localStorage.getItem(SCHEMA_KEY) || '';
}

function getCurrentAdminId() {
	return window.localStorage.getItem(ADMIN_ID_KEY) || '';
}

function setCurrentAdminId(adminId) {
	const next = String(adminId || '').trim();
	if (next) {
		window.localStorage.setItem(ADMIN_ID_KEY, next);
	} else {
		window.localStorage.removeItem(ADMIN_ID_KEY);
	}
}

function setSchemaName(schemaName) {
	const next = String(schemaName || '').trim();
	if (next) {
		window.localStorage.setItem(SCHEMA_KEY, next);
	} else {
		window.localStorage.removeItem(SCHEMA_KEY);
	}
}

async function request(route, params = {}) {
	const schemaName = getSchemaName();
	const res = await fetch(API_BASE, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-SXWY-ADMIN-TOKEN': getAdminToken(),
			...(getCurrentAdminId() ? { 'X-SXWY-ADMIN-USER-ID': getCurrentAdminId() } : {})
		},
		body: JSON.stringify({
			route,
			params: Object.assign({}, params, schemaName ? { schemaName } : {})
		})
	});
	const data = await res.json();
	if (!res.ok) {
		throw new Error(data.msg || `请求失败：${res.status}`);
	}
	if (data.code && data.code !== 0) {
		if (data.msg && data.msg.includes('令牌')) {
			window.localStorage.removeItem(TOKEN_KEY);
		}
		throw new Error(data.msg || '请求失败');
	}
	return data.data || {};
}

export const adminApi = {
	getSchemaName,
	setSchemaName,
	getCurrentAdminId,
	setCurrentAdminId,
	login: (payload) => request('admin/login', payload),
	dashboard: () => request('admin/dashboard'),
	ownerList: (payload = {}) => request('admin/owner/list', payload),
	ownerDetail: (id) => request('admin/owner/detail', { id }),
	ownerSave: (payload) => request('admin/owner/save', payload),
	ownerImport: (payload) => request('admin/owner/import', payload),
	ownerLookup: (payload) => request('admin/owner/lookup', payload),
	feeOwnerLookup: (payload) => request('admin/fee/owner_lookup', payload),
	auditOwner: (id, auditStatus) => request('admin/owner/audit', { id, auditStatus }),
	tenantList: (payload = {}) => request('admin/tenant/list', payload),
	tenantDetail: (id) => request('admin/tenant/detail', { id }),
	tenantSave: (payload) => request('admin/tenant/save', payload),
	tenantMoveOut: (payload) => request('admin/tenant/move_out', payload),
	tenantImport: (payload) => request('admin/tenant/import', payload),
	residentChangeLogList: (payload = {}) => request('admin/resident/change_log/list', payload),
	communityList: () => request('admin/community/list'),
	bootstrapCommunityList: () => request('bootstrap/communities'),
	saveCommunity: (payload) => request('admin/community/save', payload),
	deleteCommunity: (id) => request('admin/community/delete', { id }),
	communityModuleList: () => request('admin/community/module/list'),
	saveCommunityModule: (payload) => request('admin/community/module/save', payload),
	batchSaveCommunityModules: (payload) => request('admin/community/module/batch_save', payload),
	roleList: () => request('admin/role/list'),
	accessProfile: () => request('admin/access/profile'),
	adminList: () => request('admin/user/list'),
	saveAdmin: (payload) => request('admin/user/save', payload),
	deleteAdmin: (id) => request('admin/user/delete', { id }),
	permissionList: () => request('admin/permission/list'),
	savePermission: (payload) => request('admin/permission/save', payload),
	deletePermission: (id) => request('admin/permission/delete', { id }),
	auditList: () => request('admin/audit/list'),
	staffList: () => request('admin/staff/list'),
	staffSave: (payload) => request('admin/staff/save', payload),
	repairList: () => request('admin/repair/list'),
	repairDetail: (id) => request('admin/repair/detail', { id }),
	repairAction: (payload) => request('admin/repair/action', payload),
	repairStaffList: () => request('admin/repair/staff/list'),
	repairStaffSave: (payload) => request('admin/repair/staff/save', payload),
	repairSlaScan: () => request('admin/repair/sla_scan'),
	repairExport: () => request('admin/repair/export'),
	feeList: () => request('admin/fee/list'),
	feePayments: (payload = {}) => request('admin/fee/payments', payload),
	saveFee: (payload) => request('admin/fee/save', payload),
	feeImport: (payload) => request('admin/fee/import', payload),
	feeExport: () => request('admin/fee/export'),
	feeReconcile: () => request('admin/fee/reconcile'),
	deleteFee: (id) => request('admin/fee/delete', { id }),
	remindFee: (payload) => request('admin/fee/remind', payload),
	complaintList: () => request('admin/complaint/list'),
	complaintDetail: (id) => request('admin/complaint/detail', { id }),
	complaintAction: (payload) => request('admin/complaint/action', payload),
	serviceList: () => request('admin/service/list'),
	serviceDetail: (id) => request('admin/service/detail', { id }),
	serviceAction: (payload) => request('admin/service/action', payload),
	customerList: () => request('admin/customer/list'),
	customerDetail: (id) => request('admin/customer/detail', { id }),
	customerAction: (payload) => request('admin/customer/action', payload),
	noticeConfigList: () => request('admin/notice_config/list'),
	noticeConfigSave: (payload) => request('admin/notice_config/save', payload),
	noticeList: () => request('admin/notice/list'),
	noticeSend: (payload) => request('admin/notice/send', payload),
	noticeRetry: (payload) => request('admin/notice/retry', payload),
	announcementList: () => request('admin/announcement/list'),
	saveAnnouncement: (payload) => request('admin/announcement/save', payload),
	deleteAnnouncement: (id) => request('admin/announcement/delete', { id })
};
