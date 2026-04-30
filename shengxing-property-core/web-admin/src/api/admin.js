const API_BASE = import.meta.env.VITE_ADMIN_API_BASE
	|| 'https://cloudbase-d9g78eneac709f5a5.service.tcloudbase.com/sxmini';

const TOKEN_KEY = 'sxwy_admin_token';
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
			'X-SXWY-ADMIN-TOKEN': getAdminToken()
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
	dashboard: () => request('admin/dashboard'),
	ownerList: () => request('admin/owner/list'),
	auditOwner: (id, auditStatus) => request('admin/owner/audit', { id, auditStatus }),
	communityList: () => request('admin/community/list'),
	repairList: () => request('admin/repair/list'),
	feeList: () => request('admin/fee/list'),
	complaintList: () => request('admin/complaint/list'),
	noticeConfigList: () => request('admin/notice_config/list'),
	announcementList: () => request('admin/announcement/list'),
	saveAnnouncement: (payload) => request('admin/announcement/save', payload),
	deleteAnnouncement: (id) => request('admin/announcement/delete', { id })
};
