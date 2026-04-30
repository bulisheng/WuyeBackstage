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
	dashboard: () => request('admin/dashboard'),
	ownerList: () => request('admin/owner/list'),
	auditOwner: (id, auditStatus) => request('admin/owner/audit', { id, auditStatus }),
	communityList: () => request('admin/community/list'),
	saveCommunity: (payload) => request('admin/community/save', payload),
	deleteCommunity: (id) => request('admin/community/delete', { id }),
	roleList: () => request('admin/role/list'),
	accessProfile: () => request('admin/access/profile'),
	adminList: () => request('admin/user/list'),
	saveAdmin: (payload) => request('admin/user/save', payload),
	deleteAdmin: (id) => request('admin/user/delete', { id }),
	permissionList: () => request('admin/permission/list'),
	savePermission: (payload) => request('admin/permission/save', payload),
	deletePermission: (id) => request('admin/permission/delete', { id }),
	repairList: () => request('admin/repair/list'),
	feeList: () => request('admin/fee/list'),
	complaintList: () => request('admin/complaint/list'),
	noticeConfigList: () => request('admin/notice_config/list'),
	announcementList: () => request('admin/announcement/list'),
	saveAnnouncement: (payload) => request('admin/announcement/save', payload),
	deleteAnnouncement: (id) => request('admin/announcement/delete', { id })
};
