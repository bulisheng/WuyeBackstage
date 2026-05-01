import { computed, proxyRefs, ref } from 'vue';
import { adminApi } from '../api/admin.js';
import { buildCommunityLabel, buildCommunityPayload, createCommunityForm } from '../utils/community.js';
import { MODULE_CATALOG, buildModuleMatrix, buildModuleToggleSummary } from '../utils/modules.js';
import {
	buildActionLabel,
	buildEffectiveAccess,
	buildMenuLabel,
	buildPermissionRecord,
	buildPermissionTokensFromSelections,
	buildRoleAccessProfile,
	listRoleOptions,
	parsePermissions
} from '../utils/permissions.js';

const routeLabels = {
	login: '后台登录',
	dashboard: '数据看板',
	owners: '住户管理',
	communities: '小区管理',
	permissions: '权限管理',
	repairs: '报修管理',
	fees: '缴费管理',
	notices: '通知中心'
};

const routeOrder = ['dashboard', 'owners', 'communities', 'permissions', 'repairs', 'fees', 'notices'];
const routerReady = { value: false };

const activeRoute = ref('login');
const stats = ref([]);
const dashboardTodos = ref([]);
const dashboardTodoLists = ref({ repairs: [], bills: [], notices: [] });
const dashboardCrossModuleStats = ref({});
const owners = ref([]);
const ownerRecords = owners;
const tenantRecords = ref([]);
const residentChangeLogs = ref([]);
const residentActiveTab = ref('owner_audit');
const residentSearchKeyword = ref('');
const residentTypeFilter = ref('all');
const residentStatusFilter = ref('');
const residentSelectedId = ref('');
const communities = ref([]);
const communityForm = ref(createCommunityForm());
const editingCommunityId = ref('');
const admins = ref([]);
const permissions = ref([]);
const auditLogs = ref([]);
const moduleRecords = ref([]);
const roleOptions = ref(listRoleOptions());
const currentAdminId = ref(adminApi.getCurrentAdminId());
const adminAccess = ref(null);
const loginForm = ref({ username: '', password: '' });
const editingAdminId = ref('');
const editingPermissionId = ref('');
const activePermissionTab = ref('admins');
const adminForm = ref(emptyAdmin());
const permissionForm = ref(emptyPermission());
const repairs = ref([]);
const selectedRepairId = ref('');
const repairDetail = ref(null);
const repairLogs = ref([]);
const repairActions = ref({});
const repairActionForm = ref(emptyRepairAction());
const repairStaff = ref([]);
const repairStaffForm = ref(emptyRepairStaff());
const editingRepairStaffId = ref('');
const repairSlaSummary = ref(null);
const fees = ref([]);
const selectedFeeId = ref('');
const paymentRecords = ref([]);
const selectedFeePayments = ref([]);
const feeForm = ref(emptyFee());
const editingFeeId = ref('');
const feeOwnerLookupText = ref('请输入手机号后自动带出姓名和房号');
const feeSaving = ref(false);
const feeLookupLoading = ref(false);
const feeImportText = ref('');
const feeImportSummary = ref(null);
const feeReconcileResult = ref(null);
const noticeConfigs = ref([]);
const noticeRecords = ref([]);
const noticeConfigForm = ref(emptyNoticeConfig());
const editingNoticeConfigId = ref('');
const noticeSendForm = ref(emptyNoticeSend());
const selectedSchema = ref(adminApi.getSchemaName());

const activeCommunities = computed(() => communities.value.filter((item) => item.active));
const activeCommunity = computed(() => communities.value.find((item) => item.schemaName === selectedSchema.value) || null);
const isLoggedIn = computed(() => Boolean(currentAdminId.value));
const currentAdminInfo = computed(() => adminAccess.value && adminAccess.value.admin ? adminAccess.value.admin : null);
const pageTitle = computed(() => routeLabels[activeRoute.value] || '数据看板');
const pendingCount = computed(() => owners.value.filter((item) => item.auditStatus === 'pending').length);
const currentCommunityModuleMatrix = computed(() => {
	if (!activeCommunity.value) return { moduleColumns: MODULE_CATALOG, rows: [] };
	return buildModuleMatrix([activeCommunity.value], MODULE_CATALOG, moduleRecords.value);
});
const currentCommunityModules = computed(() => currentCommunityModuleMatrix.value.rows[0]?.modules || []);
const currentCommunityModuleSummary = computed(() => buildModuleToggleSummary(currentCommunityModules.value));
const adminRoleAccess = computed(() => buildRoleAccessProfile(adminForm.value.role));
const adminPermissionAccess = computed(() => buildEffectiveAccess(adminForm.value.permissionRole || adminForm.value.role, adminForm.value.permissions));
const allowedMenus = computed(() => (adminAccess.value && adminAccess.value.access && Array.isArray(adminAccess.value.access.menus) ? adminAccess.value.access.menus : []));
const allowedActions = computed(() => (adminAccess.value && adminAccess.value.access && Array.isArray(adminAccess.value.access.actions) ? adminAccess.value.access.actions : []));
const adminMenuOptions = computed(() => MODULE_CATALOG.map((item) => ({
	key: item.key,
	label: item.name || buildMenuLabel(item.key),
	description: item.description || ''
})));
const quickPermissionTokens = ['community:edit', 'owner:manage', 'owner:audit', 'tenant:manage', 'resident:import', 'resident:change_log:view', 'repair:view', 'repair:assign', 'repair:update', 'repair:close', 'fee:view', 'fee:collect', 'fee:remind', 'fee:export', 'complaint:handle', 'notice:publish'];
const adminActionOptions = computed(() => quickPermissionTokens.map((item) => ({
	key: item,
	label: buildActionLabel(item)
})));
const communityLabel = buildCommunityLabel;
const visibleRoutes = computed(() => routeOrder.filter((route) => canMenu(route)).map((route) => ({
	key: route,
	label: routeLabels[route] || route
})));

function emptyAnnouncement() {
	return {
		title: '',
		summary: '',
		content: '',
		coverUrl: '',
		status: 'published',
		isPinned: true,
		sort: 0
	};
}

function emptyFee() {
	return {
		billNo: '',
		title: '',
		ownerMobile: '',
		ownerName: '',
		house: '',
		billType: '物业费',
		amount: 0,
		status: 'pending',
		dueDate: ''
	};
}

function emptyRepairAction() {
	return {
		action: 'assign',
		assignee: '',
		content: ''
	};
}

function emptyRepairStaff() {
	return {
		name: '',
		mobile: '',
		skillTags: '',
		active: 1
	};
}

function emptyAdmin() {
	return {
		username: '',
		password: '',
		role: 'admin',
		communityId: 0,
		permissionId: '',
		permissionCommunityId: 0,
		permissionRole: 'admin',
		permissions: '',
		permissionActive: 1,
		active: 1
	};
}

function emptyPermission() {
	return {
		adminId: 0,
		communityId: 0,
		role: 'admin',
		permissions: '',
		active: 1
	};
}

function emptyNoticeConfig() {
	return {
		id: '',
		scene: 'bill_created',
		channel: 'dingtalk',
		templateName: '',
		robotName: '',
		webhookUrl: '',
		secret: '',
		retryLimit: 3,
		alarmEnabled: 1,
		enabled: 1
	};
}

function emptyNoticeSend() {
	return {
		scene: 'manual',
		channel: 'system',
		targetType: 'manual',
		targetId: '',
		title: '后台手动通知',
		content: '这是一条后台测试通知'
	};
}

function statusText(status) {
	return {
		pending: '待审核',
		approved: '已通过',
		rejected: '已驳回',
		disabled: '已禁用'
	}[status] || status;
}

function workStatusText(status) {
	return {
		pending: '待处理',
		assigned: '已派单',
		processing: '处理中',
		completed: '已完成',
		confirmed: '用户已确认',
		rated: '已评价',
		closed: '已关闭',
		cancelled: '已取消'
	}[status] || status;
}

function feeStatusText(status) {
	return {
		pending: '待支付',
		unpaid: '待缴',
		paid: '已缴',
		overdue: '逾期',
		cancelled: '已取消',
		refunded: '已退款',
		void: '已作废'
	}[status] || status;
}

function noticeStatusText(status) {
	return {
		pending: '待发送',
		sent: '已发送',
		failed: '失败'
	}[status] || status;
}

function money(value) {
	return `￥${Number(value || 0).toFixed(2)}`;
}

function downloadTextFile(filename, content, contentType = 'text/plain;charset=utf-8') {
	const blob = new Blob([content || ''], { type: contentType });
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename || `export-${Date.now()}.csv`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	window.URL.revokeObjectURL(url);
}

function parsePastedTable(text = '') {
	const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	if (!lines.length) return [];
	const splitLine = (line) => line.includes('\t') ? line.split('\t') : line.split(',');
	const first = splitLine(lines[0]).map((item) => item.trim());
	const hasHeader = first.some((item) => ['手机号', '标题', '金额', '类型', '截止日期', 'mobile', 'title', 'amount'].includes(item));
	const headers = hasHeader ? first : ['mobile', 'title', 'amount', 'billType', 'dueDate'];
	const rows = hasHeader ? lines.slice(1) : lines;
	const pick = (row, names) => {
		for (const name of names) {
			if (row[name] !== undefined) return row[name];
		}
		return '';
	};
	return rows.map((line) => {
		const values = splitLine(line).map((item) => item.trim());
		const raw = {};
		headers.forEach((header, index) => {
			raw[header] = values[index] || '';
		});
		return {
			ownerMobile: pick(raw, ['mobile', '手机号', '业主手机号', 'ownerMobile']),
			title: pick(raw, ['title', '标题', '账单标题']),
			amount: pick(raw, ['amount', '金额']),
			billType: pick(raw, ['billType', '类型', '账单类型']) || '物业费',
			dueDate: pick(raw, ['dueDate', '截止日期', '到期日'])
		};
	});
}

function canMenu(menu) {
	if (!adminAccess.value) return true;
	return allowedMenus.value.includes(menu);
}

function canAction(action) {
	if (!adminAccess.value) return true;
	return allowedActions.value.includes('*') || allowedActions.value.includes(action);
}

function auditParamsLabel(item) {
	const params = item && item.params ? item.params : {};
	const keys = ['username', 'role', 'communityId', 'adminId', 'id', 'status', 'auditStatus', 'title', 'scene'];
	const pairs = keys
		.filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
		.slice(0, 4)
		.map((key) => `${key}:${params[key]}`);
	if (pairs.length) return pairs.join(' · ');
	try {
		const text = JSON.stringify(params);
		return text.length > 120 ? `${text.slice(0, 120)}…` : text;
	} catch (err) {
		return '{}';
	}
}

function communityNameById(id) {
	const item = communities.value.find((entry) => Number(entry.id) === Number(id));
	return item ? buildCommunityLabel(item) : '未设置';
}

function setCurrentAdminId(adminId) {
	const next = String(adminId || '').trim();
	currentAdminId.value = next;
	adminApi.setCurrentAdminId(next);
}

function routeToHash(route) {
	return route === 'login' ? '#/login' : `#/${route}`;
}

function syncRouteFromHash() {
	if (typeof window === 'undefined') return;
	const raw = String(window.location.hash || '').replace(/^#\/?/, '').trim();
	let next = routeOrder.includes(raw) || raw === 'login' ? raw : '';
	if (!next) next = isLoggedIn.value ? 'dashboard' : 'login';
	if (next !== 'login' && !canMenu(next) && isLoggedIn.value) {
		next = visibleRoutes.value[0]?.key || 'dashboard';
	}
	activeRoute.value = next;
	if (!window.location.hash || String(window.location.hash).replace(/^#\/?/, '').trim() !== next) {
		window.location.hash = routeToHash(next);
	}
}

function navigate(route) {
	const next = route === 'login' ? 'login' : route;
	activeRoute.value = next;
	if (typeof window !== 'undefined') {
		window.location.hash = routeToHash(next);
	}
}

function ensureVisibleRoute() {
	if (!isLoggedIn.value) {
		activeRoute.value = 'login';
		return;
	}
	if (!canMenu(activeRoute.value)) {
		activeRoute.value = visibleRoutes.value[0]?.key || 'dashboard';
	}
}

function syncSelectedAdminId(adminId) {
	setCurrentAdminId(adminId);
}

function selectedAdminMenus() {
	const access = adminPermissionAccess.value || {};
	return new Set(Array.isArray(access.menus) ? access.menus : []);
}

function selectedAdminActions() {
	const access = adminPermissionAccess.value || {};
	const actions = Array.isArray(access.actions) ? access.actions : [];
	if (actions.includes('*')) {
		return new Set(adminActionOptions.value.map((item) => item.key));
	}
	return new Set(actions);
}

function updateAdminPermissionSelections(nextMenus, nextActions) {
	const tokens = buildPermissionTokensFromSelections(
		adminForm.value.permissionRole || adminForm.value.role,
		Array.from(nextMenus),
		Array.from(nextActions)
	);
	adminForm.value.permissions = tokens.join(', ');
}

function toggleAdminMenu(menuKey) {
	const menus = selectedAdminMenus();
	const actions = selectedAdminActions();
	if (menus.has(menuKey)) menus.delete(menuKey);
	else menus.add(menuKey);
	updateAdminPermissionSelections(menus, actions);
}

function toggleAdminAction(actionKey) {
	const menus = selectedAdminMenus();
	const actions = selectedAdminActions();
	if (actions.has(actionKey)) actions.delete(actionKey);
	else actions.add(actionKey);
	updateAdminPermissionSelections(menus, actions);
}

function resetAdminPermissionToRole() {
	adminForm.value.permissionRole = adminForm.value.role;
	adminForm.value.permissions = '';
	adminForm.value.permissionActive = 1;
}

function syncAdminPermissionRole() {
	resetAdminPermissionToRole();
}

function resetLoginForm() {
	loginForm.value = { username: '', password: '' };
}

async function loadAdminDirectory() {
	const roleData = await adminApi.roleList().catch(() => ({ list: [] }));
	roleOptions.value = roleData.list && roleData.list.length ? roleData.list : listRoleOptions();
}

async function loadAccessProfile() {
	if (!currentAdminId.value) {
		adminAccess.value = null;
		try {
			const bootstrap = await adminApi.bootstrapCommunityList();
			communities.value = bootstrap.list || [];
		} catch (err) {
			communities.value = [];
		}
		if (!communities.value.some((item) => item.schemaName === selectedSchema.value)) {
			selectedSchema.value = activeCommunities.value[0]?.schemaName || '';
		}
		adminApi.setSchemaName(selectedSchema.value);
		return;
	}
	let profile;
	try {
		profile = await adminApi.accessProfile();
	} catch (err) {
		if ((err.message || '').includes('无权访问该小区')) {
			selectedSchema.value = '';
			adminApi.setSchemaName('');
			profile = await adminApi.accessProfile();
		} else {
			throw err;
		}
	}
	adminAccess.value = profile;
	communities.value = profile.communities || [];
	if (!communities.value.some((item) => item.schemaName === selectedSchema.value)) {
		selectedSchema.value = activeCommunities.value[0]?.schemaName || '';
	}
	adminApi.setSchemaName(selectedSchema.value);
	ensureVisibleRoute();
}

async function loadOwnerRecords(params = {}) {
	const data = await adminApi.ownerList(params);
	owners.value = data.list || [];
	return owners.value;
}

async function loadTenantRecords(params = {}) {
	const data = await adminApi.tenantList(params);
	tenantRecords.value = data.list || [];
	return tenantRecords.value;
}

async function loadResidentChangeLogs(params = {}) {
	const data = await adminApi.residentChangeLogList(params);
	residentChangeLogs.value = data.list || [];
	return residentChangeLogs.value;
}

async function loginAdmin() {
	try {
		const res = await adminApi.login(loginForm.value);
		const admin = res.admin || {};
		syncSelectedAdminId(admin.id || '');
		loginForm.value.password = '';
		navigate('dashboard');
		await reload();
	} catch (err) {
		window.alert(err.message || '登录失败');
	}
}

async function logoutAdmin() {
	setCurrentAdminId('');
	adminApi.setSchemaName('');
	adminAccess.value = null;
	communities.value = [];
	stats.value = [];
	dashboardTodos.value = [];
	dashboardTodoLists.value = { repairs: [], bills: [], notices: [] };
	dashboardCrossModuleStats.value = {};
	owners.value = [];
	tenantRecords.value = [];
	residentChangeLogs.value = [];
	residentSelectedId.value = '';
	admins.value = [];
	permissions.value = [];
	auditLogs.value = [];
	moduleRecords.value = [];
	repairs.value = [];
	selectedRepairId.value = '';
	repairDetail.value = null;
	repairLogs.value = [];
	repairActions.value = {};
	repairStaff.value = [];
	repairStaffForm.value = emptyRepairStaff();
	editingRepairStaffId.value = '';
	repairSlaSummary.value = null;
	fees.value = [];
	selectedFeeId.value = '';
	paymentRecords.value = [];
	selectedFeePayments.value = [];
	feeImportText.value = '';
	feeImportSummary.value = null;
	feeReconcileResult.value = null;
	noticeConfigs.value = [];
	noticeRecords.value = [];
	editingCommunityId.value = '';
	editingAdminId.value = '';
	editingPermissionId.value = '';
	editingFeeId.value = '';
	editingNoticeConfigId.value = '';
	communityForm.value = createCommunityForm();
	adminForm.value = emptyAdmin();
	permissionForm.value = emptyPermission();
	feeForm.value = emptyFee();
	repairActionForm.value = emptyRepairAction();
	noticeConfigForm.value = emptyNoticeConfig();
	noticeSendForm.value = emptyNoticeSend();
	selectedSchema.value = '';
	navigate('login');
	await loadAccessProfile();
}

function editCommunity(item) {
	editingCommunityId.value = String(item.id || '');
	communityForm.value = createCommunityForm(item);
}

function resetCommunityForm() {
	editingCommunityId.value = '';
	communityForm.value = createCommunityForm();
}

async function saveCommunity() {
	const payload = buildCommunityPayload(communityForm.value);
	const result = await adminApi.saveCommunity({
		...payload,
		id: editingCommunityId.value || undefined
	});
	communities.value = result.list || communities.value;
	resetCommunityForm();
	await reload();
}

async function toggleCommunityActive(item) {
	const payload = buildCommunityPayload({
		...item,
		active: item.active ? 0 : 1
	});
	await adminApi.saveCommunity({
		...payload,
		id: item.id
	});
	await reload();
}

async function removeCommunity(item) {
	const confirmed = window.confirm(`确认删除/停用小区「${buildCommunityLabel(item)}」？`);
	if (!confirmed) return;
	await adminApi.deleteCommunity(item.id);
	await reload();
}

async function auditOwner(owner, auditStatus) {
	await adminApi.auditOwner(owner.id, auditStatus);
	owner.auditStatus = auditStatus;
}

function editAdmin(item) {
	editingAdminId.value = String(item.id || '');
	activePermissionTab.value = 'admins';
	adminForm.value = {
		username: item.username || '',
		password: '',
		role: item.role || 'admin',
		communityId: Number(item.communityId || 0),
		permissionId: '',
		permissionCommunityId: Number(item.communityId || activeCommunity.value?.id || 0),
		permissionRole: item.role || 'admin',
		permissions: '',
		permissionActive: 1,
		active: item.active ? 1 : 0
	};
	loadAdminPermissionForForm();
}

function applyPermissionToAdminForm(item) {
	editingPermissionId.value = String(item.id || '');
	adminForm.value.permissionId = String(item.id || '');
	adminForm.value.permissionCommunityId = Number(item.communityId || adminForm.value.communityId || 0);
	adminForm.value.permissionRole = item.role || adminForm.value.role || 'admin';
	adminForm.value.permissions = Array.isArray(item.permissions) ? item.permissions.join(', ') : '';
	adminForm.value.permissionActive = item.active ? 1 : 0;
}

function loadAdminPermissionForForm() {
	if (!editingAdminId.value) {
		adminForm.value.permissionId = '';
		adminForm.value.permissionRole = adminForm.value.role || 'admin';
		adminForm.value.permissions = '';
		adminForm.value.permissionActive = 1;
		return;
	}
	const communityId = Number(adminForm.value.permissionCommunityId || adminForm.value.communityId || activeCommunity.value?.id || 0);
	const record = permissions.value.find((item) =>
		Number(item.adminId) === Number(editingAdminId.value) && Number(item.communityId) === communityId
	);
	if (record) {
		applyPermissionToAdminForm(record);
		return;
	}
	adminForm.value.permissionId = '';
	adminForm.value.permissionCommunityId = communityId;
	adminForm.value.permissionRole = adminForm.value.role || 'admin';
	adminForm.value.permissions = '';
	adminForm.value.permissionActive = 1;
}

function resetAdminForm() {
	editingAdminId.value = '';
	editingPermissionId.value = '';
	adminForm.value = emptyAdmin();
}

async function saveAdmin() {
	const payload = {
		id: editingAdminId.value || undefined,
		username: adminForm.value.username,
		password: adminForm.value.password,
		role: adminForm.value.role,
		communityId: adminForm.value.communityId || undefined,
		active: adminForm.value.active
	};
	const result = await adminApi.saveAdmin(payload);
	admins.value = result.list || admins.value;
	const savedAdminId = Number(editingAdminId.value || (admins.value.find((item) => item.username === adminForm.value.username) || {}).id || 0);
	const permissionCommunityId = Number(adminForm.value.permissionCommunityId || adminForm.value.communityId || activeCommunity.value?.id || 0);
	if (savedAdminId && permissionCommunityId && canAction('admin:permission:manage')) {
		const permissionPayload = buildPermissionRecord({
			adminId: savedAdminId,
			communityId: permissionCommunityId,
			role: adminForm.value.permissionRole || adminForm.value.role,
			permissions: adminForm.value.permissions,
			active: adminForm.value.permissionActive
		});
		const permissionResult = await adminApi.savePermission({
			id: adminForm.value.permissionId || undefined,
			adminId: permissionPayload.adminId,
			communityId: permissionPayload.communityId,
			role: permissionPayload.role,
			permissions: permissionPayload.permissions,
			active: permissionPayload.active
		});
		permissions.value = permissionResult.list || permissions.value;
	}
	resetAdminForm();
	await reload();
}

async function removeAdmin(item) {
	const confirmed = window.confirm(`确认停用管理员「${item.username}」？`);
	if (!confirmed) return;
	await adminApi.deleteAdmin(item.id);
	await reload();
}

function editPermission(item) {
	editingPermissionId.value = String(item.id || '');
	activePermissionTab.value = 'permissions';
	permissionForm.value = {
		adminId: Number(item.adminId || 0),
		communityId: Number(item.communityId || 0),
		role: item.role || 'admin',
		permissions: Array.isArray(item.permissions) ? item.permissions.join(', ') : '',
		active: item.active ? 1 : 0
	};
}

function resetPermissionForm() {
	editingPermissionId.value = '';
	permissionForm.value = emptyPermission();
}

async function savePermission() {
	const payload = buildPermissionRecord(permissionForm.value);
	const result = await adminApi.savePermission({
		id: editingPermissionId.value || undefined,
		adminId: payload.adminId,
		communityId: payload.communityId,
		role: payload.role,
		permissions: payload.permissions,
		active: payload.active
	});
	permissions.value = result.list || permissions.value;
	resetPermissionForm();
	await reload();
}

async function removePermission(item) {
	const confirmed = window.confirm(`确认删除权限记录「${item.username} / ${item.communityName}」？`);
	if (!confirmed) return;
	await adminApi.deletePermission(item.id);
	await reload();
}

async function loadPermissionTables() {
	const [adminData, permissionData, auditData, moduleData] = await Promise.all([
		canAction('admin:user:view') ? adminApi.adminList() : Promise.resolve({ list: [] }),
		canAction('admin:permission:view') ? adminApi.permissionList() : Promise.resolve({ list: [] }),
		canAction('admin:audit:view') ? adminApi.auditList() : Promise.resolve({ list: [] }),
		canAction('community:module:view') || canAction('community:module:manage') ? adminApi.communityModuleList() : Promise.resolve({ list: [] })
	]);
	admins.value = adminData.list || [];
	permissions.value = permissionData.list || [];
	auditLogs.value = auditData.list || [];
	moduleRecords.value = moduleData.list || [];
}

async function loadModuleRecords() {
	if (!selectedSchema.value) {
		moduleRecords.value = [];
		return;
	}
	const result = await adminApi.communityModuleList();
	moduleRecords.value = result.list || [];
}

function moduleDisplayLabel(item) {
	return item.name || item.moduleName || item.key || item.moduleKey || '';
}

function moduleDisplayDescription(item) {
	return item.description || item.moduleDescription || '';
}

function moduleEnabledLabel(item) {
	return item.enabled ? '已开启' : '已关闭';
}

async function saveModuleState(item, enabled) {
	await adminApi.saveCommunityModule({
		moduleKey: item.key,
		enabled
	});
	await loadModuleRecords();
}

async function toggleModule(item) {
	if (!canAction('community:module:manage')) return;
	await saveModuleState(item, item.enabled ? 0 : 1);
}

async function batchUpdateModules(enabled) {
	if (!canAction('community:module:manage')) return;
	await adminApi.batchSaveCommunityModules({
		modules: currentCommunityModules.value.map((item) => ({
			moduleKey: item.key,
			enabled
		}))
	});
	await loadModuleRecords();
}

async function restoreAllModules() {
	const confirmed = window.confirm(`确认将「${buildCommunityLabel(activeCommunity.value || {})}」恢复为全部模块开启？`);
	if (!confirmed) return;
	await batchUpdateModules(1);
}

async function saveFee() {
	if (feeSaving.value) return;
	try {
		feeSaving.value = true;
		const mobile = String(feeForm.value.ownerMobile || '').trim();
		if (!editingFeeId.value && mobile.length < 11) {
			throw new Error('请输入完整的 11 位业主手机号');
		}
		const owner = mobile ? await resolveFeeOwnerByMobile(mobile, { silent: true }) : null;
		if (mobile && !owner) {
			throw new Error('请输入有效的业主手机号，并先完成手机号匹配');
		}
		const payload = {
			id: editingFeeId.value || undefined,
			billNo: feeForm.value.billNo,
			title: feeForm.value.title,
			ownerMobile: feeForm.value.ownerMobile,
			houseId: owner.houseId || null,
			userId: owner.id || null,
			ownerName: feeForm.value.ownerName,
			house: feeForm.value.house,
			billType: feeForm.value.billType,
			amount: feeForm.value.amount,
			status: feeForm.value.status,
			dueDate: feeForm.value.dueDate
		};
		const result = await adminApi.saveFee(payload);
		fees.value = result.list || fees.value;
		window.alert(`账单已保存${result.billNo ? `，账单号：${result.billNo}` : ''}`);
		resetFeeForm();
		await loadFeePayments();
	} catch (err) {
		window.alert(err.message || '保存账单失败');
	} finally {
		feeSaving.value = false;
	}
}

function editFee(item) {
	editingFeeId.value = String(item.id || '');
	feeForm.value = {
		billNo: item.billNo || '',
		title: item.title || '',
		ownerMobile: item.ownerMobile || '',
		ownerName: item.ownerName || '',
		house: item.house || '',
		billType: item.billType || '物业费',
		amount: Number(item.amount || 0),
		status: item.status || 'pending',
		dueDate: item.dueDate || ''
	};
	feeOwnerLookupText.value = item.ownerName || item.house ? `已匹配：${item.ownerName || '-'} / ${item.house || '-'}` : '请输入手机号后自动带出姓名和房号';
}

function resetFeeForm() {
	editingFeeId.value = '';
	feeForm.value = emptyFee();
	feeOwnerLookupText.value = '请输入手机号后自动带出姓名和房号';
}

async function resolveFeeOwnerByMobile(mobileValue = feeForm.value.ownerMobile, options = {}) {
	const mobile = String(mobileValue || '').trim();
	if (!mobile) {
		feeForm.value.ownerName = '';
		feeForm.value.house = '';
		feeOwnerLookupText.value = '请输入手机号后自动带出姓名和房号';
		return null;
	}
	if (mobile.length < 11) {
		feeForm.value.ownerName = '';
		feeForm.value.house = '';
		feeOwnerLookupText.value = '请输入完整的 11 位手机号';
		return null;
	}
	try {
		feeLookupLoading.value = true;
		feeOwnerLookupText.value = '正在查询业主信息...';
		const result = await adminApi.feeOwnerLookup({ mobile });
		const owner = result.owner || null;
		if (!owner) {
			feeForm.value.ownerName = '';
			feeForm.value.house = '';
			feeOwnerLookupText.value = '未找到对应业主，请核对手机号或先完成业主认证';
			if (!options.silent) {
				window.alert('未找到对应业主，请核对手机号或先完成业主认证');
			}
			return null;
		}
		feeForm.value.ownerName = owner.name || '';
		feeForm.value.house = owner.primaryHouse || owner.house || '';
		feeOwnerLookupText.value = `已匹配：${feeForm.value.ownerName || '-'} / ${feeForm.value.house || '-'}`;
		return owner;
	} catch (err) {
		feeForm.value.ownerName = '';
		feeForm.value.house = '';
		feeOwnerLookupText.value = err.message || '业主信息查询失败';
		if (!options.silent) {
			window.alert(err.message || '业主信息查询失败');
		}
		return null;
	} finally {
		feeLookupLoading.value = false;
	}
}

async function removeFee(item) {
	const confirmed = window.confirm(`确认删除账单「${item.billNo || item.title}」？`);
	if (!confirmed) return;
	await adminApi.deleteFee(item.id);
	await reload();
}

async function remindFee(item) {
	await adminApi.remindFee({
		id: item.id,
		title: item.title,
		content: `您有一笔待缴账单：${item.title || item.billNo || ''}`,
		sendNow: true
	});
	window.alert('已创建催缴记录');
}

async function importFeesFromText() {
	const rows = parsePastedTable(feeImportText.value);
	if (!rows.length) {
		window.alert('请先粘贴账单数据');
		return;
	}
	const result = await adminApi.feeImport({ rows });
	feeImportSummary.value = result.summary || null;
	fees.value = result.list || fees.value;
	await loadFeePayments();
}

async function exportFees() {
	const result = await adminApi.feeExport();
	downloadTextFile(result.filename, result.content, result.contentType);
}

async function reconcileFees() {
	const result = await adminApi.feeReconcile();
	feeReconcileResult.value = result;
	window.alert(`对账完成，异常 ${result.summary?.anomalyCount || 0} 条`);
}

async function selectFee(item) {
	selectedFeeId.value = String(item && item.id ? item.id : '');
	if (!selectedFeeId.value) {
		selectedFeePayments.value = [];
		return;
	}
	const result = await adminApi.feePayments({ billId: selectedFeeId.value });
	selectedFeePayments.value = result.list || [];
}

async function loadFeePayments(params = {}) {
	if (!canMenu('fees') || !selectedSchema.value) {
		paymentRecords.value = [];
		return;
	}
	const result = await adminApi.feePayments(params);
	paymentRecords.value = result.list || [];
}

async function openRepairDetail(item) {
	const nextId = String(item && item.id ? item.id : '');
	if (nextId && selectedRepairId.value === nextId && repairDetail.value) {
		closeRepairDetail();
		return;
	}
	selectedRepairId.value = nextId;
	if (!selectedRepairId.value) {
		closeRepairDetail();
		return;
	}
	const result = await adminApi.repairDetail(selectedRepairId.value);
	repairDetail.value = result.repair || null;
	repairLogs.value = result.logs || result.timeline || [];
	repairActions.value = result.actions || {};
	repairActionForm.value = {
		action: 'assign',
		assignee: repairDetail.value?.assignee || '',
		content: ''
	};
}

function closeRepairDetail() {
	selectedRepairId.value = '';
	repairDetail.value = null;
	repairLogs.value = [];
	repairActions.value = {};
	repairActionForm.value = emptyRepairAction();
}

async function saveRepairAction() {
	if (!selectedRepairId.value) return;
	const payload = {
		id: selectedRepairId.value,
		action: repairActionForm.value.action,
		assignee: repairActionForm.value.assignee,
		content: repairActionForm.value.content
	};
	const result = await adminApi.repairAction(payload);
	repairDetail.value = result.repair || repairDetail.value;
	repairLogs.value = result.logs || result.timeline || repairLogs.value;
	repairActions.value = result.actions || repairActions.value;
	repairActionForm.value.content = '';
	const listResult = await adminApi.repairList();
	repairs.value = listResult.list || repairs.value;
}

function editRepairStaff(item) {
	editingRepairStaffId.value = String(item.id || '');
	repairStaffForm.value = {
		name: item.name || '',
		mobile: item.mobile || '',
		skillTags: item.skillTags || '',
		active: item.active ? 1 : 0
	};
}

function resetRepairStaffForm() {
	editingRepairStaffId.value = '';
	repairStaffForm.value = emptyRepairStaff();
}

async function saveRepairStaff() {
	const result = await adminApi.repairStaffSave({
		id: editingRepairStaffId.value || undefined,
		name: repairStaffForm.value.name,
		mobile: repairStaffForm.value.mobile,
		skillTags: repairStaffForm.value.skillTags,
		active: repairStaffForm.value.active
	});
	repairStaff.value = result.list || repairStaff.value;
	resetRepairStaffForm();
}

async function scanRepairSla() {
	const result = await adminApi.repairSlaScan();
	repairSlaSummary.value = { updated: result.updated || 0 };
	repairs.value = result.list || repairs.value;
	window.alert(`SLA 扫描完成，标记 ${result.updated || 0} 条超时工单`);
}

async function exportRepairs() {
	const result = await adminApi.repairExport();
	downloadTextFile(result.filename, result.content, result.contentType);
}

function resetNoticeConfigForm() {
	editingNoticeConfigId.value = '';
	noticeConfigForm.value = emptyNoticeConfig();
}

function editNoticeConfig(item) {
	editingNoticeConfigId.value = String(item.id || '');
	noticeConfigForm.value = {
		id: item.id || '',
		scene: item.scene || 'bill_created',
		channel: item.channel || 'system',
		templateName: item.templateName || '',
		robotName: item.robotName || '',
		webhookUrl: item.webhookUrl || '',
		secret: '',
		retryLimit: Number(item.retryLimit || 3),
		alarmEnabled: item.alarmEnabled ? 1 : 0,
		enabled: item.enabled ? 1 : 0
	};
}

async function saveNoticeConfig() {
	const payload = {
		id: editingNoticeConfigId.value || undefined,
		scene: noticeConfigForm.value.scene,
		channel: noticeConfigForm.value.channel,
		templateName: noticeConfigForm.value.templateName,
		robotName: noticeConfigForm.value.robotName,
		webhookUrl: noticeConfigForm.value.webhookUrl,
		secret: noticeConfigForm.value.secret,
		retryLimit: noticeConfigForm.value.retryLimit,
		alarmEnabled: noticeConfigForm.value.alarmEnabled,
		enabled: noticeConfigForm.value.enabled
	};
	const result = await adminApi.noticeConfigSave(payload);
	noticeConfigs.value = result.list || noticeConfigs.value;
	resetNoticeConfigForm();
	await reload();
}

async function sendNotice() {
	const payload = {
		scene: noticeSendForm.value.scene,
		eventType: noticeSendForm.value.scene,
		targetType: noticeSendForm.value.targetType,
		targetId: noticeSendForm.value.targetId,
		channel: noticeSendForm.value.channel,
		templateKey: noticeSendForm.value.scene,
		title: noticeSendForm.value.title,
		content: noticeSendForm.value.content
	};
	const result = await adminApi.noticeSend(payload);
	noticeRecords.value = result.list || noticeRecords.value;
	window.alert('已发送通知');
}

async function retryNotice(item) {
	const result = await adminApi.noticeRetry({ id: item.id });
	noticeRecords.value = result.list || noticeRecords.value;
}

function selectNoticeRecord(item) {
	noticeSendForm.value = {
		scene: item.eventType || 'manual',
		channel: item.channel || 'system',
		targetType: item.targetType || 'manual',
		targetId: item.targetId || '',
		title: item.title || '后台通知',
		content: item.content || ''
	};
}

async function reload() {
	await Promise.all([
		loadAdminDirectory(),
		loadAccessProfile()
	]);
	if (!isLoggedIn.value) {
		return;
	}
	if (!selectedSchema.value) {
		stats.value = [];
		owners.value = [];
		tenantRecords.value = [];
		residentChangeLogs.value = [];
		residentSelectedId.value = '';
		repairs.value = [];
		fees.value = [];
		selectedRepairId.value = '';
		repairDetail.value = null;
		repairLogs.value = [];
		repairActions.value = {};
		selectedFeeId.value = '';
		paymentRecords.value = [];
		selectedFeePayments.value = [];
		repairStaff.value = [];
		repairSlaSummary.value = null;
		noticeConfigs.value = [];
		noticeRecords.value = [];
		admins.value = [];
		permissions.value = [];
		auditLogs.value = [];
		moduleRecords.value = [];
		return;
	}
	adminApi.setSchemaName(selectedSchema.value);
	const [dashboard, ownerData, tenantData, residentLogData, repairData, repairStaffData, feeData, paymentData, noticeConfigData, noticeRecordData] = await Promise.all([
		canMenu('dashboard') ? adminApi.dashboard() : Promise.resolve({ stats: [] }),
		canMenu('owners') ? adminApi.ownerList() : Promise.resolve({ list: [] }),
		canMenu('owners') ? adminApi.tenantList() : Promise.resolve({ list: [] }),
		canMenu('owners') ? adminApi.residentChangeLogList({ limit: 100 }) : Promise.resolve({ list: [] }),
		canMenu('repairs') ? adminApi.repairList() : Promise.resolve({ list: [] }),
		canMenu('repairs') ? adminApi.repairStaffList() : Promise.resolve({ list: [] }),
		canMenu('fees') ? adminApi.feeList() : Promise.resolve({ list: [] }),
		canMenu('fees') ? adminApi.feePayments() : Promise.resolve({ list: [] }),
		canMenu('notices') ? adminApi.noticeConfigList() : Promise.resolve({ list: [] }),
		canMenu('notices') ? adminApi.noticeList() : Promise.resolve({ list: [] })
	]);
	if (canMenu('permissions')) {
		await loadPermissionTables();
	} else {
		admins.value = [];
		permissions.value = [];
		auditLogs.value = [];
		moduleRecords.value = [];
	}
	stats.value = dashboard.stats || [];
	dashboardTodos.value = dashboard.todos || [];
	dashboardTodoLists.value = dashboard.todoLists || { repairs: [], bills: [], notices: [] };
	dashboardCrossModuleStats.value = dashboard.crossModuleStats || {};
	owners.value = ownerData.list || [];
	tenantRecords.value = tenantData.list || [];
	residentChangeLogs.value = residentLogData.list || [];
	repairs.value = repairData.list || [];
	repairStaff.value = repairStaffData.list || [];
	fees.value = feeData.list || [];
	paymentRecords.value = paymentData.list || [];
	noticeConfigs.value = noticeConfigData.list || [];
	noticeRecords.value = noticeRecordData.list || [];
}

async function onSchemaChange() {
	adminApi.setSchemaName(selectedSchema.value);
	resetFeeForm();
	selectedRepairId.value = '';
	repairDetail.value = null;
	repairLogs.value = [];
	repairActions.value = {};
	selectedFeeId.value = '';
	paymentRecords.value = [];
	selectedFeePayments.value = [];
	await reload();
}

function start() {
	if (routerReady.value) return;
	routerReady.value = true;
	if (typeof window !== 'undefined') {
		window.addEventListener('hashchange', syncRouteFromHash);
	}
	syncRouteFromHash();
	if (typeof window !== 'undefined' && (!window.location.hash || String(window.location.hash).replace(/^#\/?/, '').trim() === '')) {
		navigate(isLoggedIn.value ? 'dashboard' : 'login');
	}
}

function stop() {
	if (!routerReady.value) return;
	routerReady.value = false;
	if (typeof window !== 'undefined') {
		window.removeEventListener('hashchange', syncRouteFromHash);
	}
}

export function useAdminWorkspaceStore() {
	return proxyRefs({
		routeLabels,
		routeOrder,
		activeRoute,
		stats,
		dashboardTodos,
		dashboardTodoLists,
		dashboardCrossModuleStats,
		owners,
		ownerRecords,
		tenantRecords,
		residentChangeLogs,
		residentActiveTab,
		residentSearchKeyword,
		residentTypeFilter,
		residentStatusFilter,
		residentSelectedId,
		communities,
		communityForm,
		editingCommunityId,
		admins,
		permissions,
		auditLogs,
		moduleRecords,
		roleOptions,
		currentAdminId,
		adminAccess,
		loginForm,
		editingAdminId,
		editingPermissionId,
		activePermissionTab,
		adminForm,
		permissionForm,
		repairs,
		selectedRepairId,
		repairDetail,
		repairLogs,
		repairActions,
		repairActionForm,
		repairStaff,
		repairStaffForm,
		editingRepairStaffId,
		repairSlaSummary,
		fees,
		selectedFeeId,
		paymentRecords,
		selectedFeePayments,
		feeForm,
		editingFeeId,
		feeOwnerLookupText,
		feeSaving,
		feeLookupLoading,
		feeImportText,
		feeImportSummary,
		feeReconcileResult,
		noticeConfigs,
		noticeRecords,
		noticeConfigForm,
		editingNoticeConfigId,
		noticeSendForm,
		selectedSchema,
		activeCommunities,
		activeCommunity,
		isLoggedIn,
		currentAdminInfo,
		pageTitle,
		pendingCount,
		currentCommunityModules,
		currentCommunityModuleSummary,
		adminRoleAccess,
		adminPermissionAccess,
		allowedMenus,
		allowedActions,
		adminMenuOptions,
		adminActionOptions,
		communityLabel,
		visibleRoutes,
		statusText,
		workStatusText,
		feeStatusText,
		noticeStatusText,
		money,
		canMenu,
		canAction,
		auditParamsLabel,
		communityNameById,
		navigate,
		start,
		stop,
		reload,
		loadAccessProfile,
		loadOwnerRecords,
		loadTenantRecords,
		loadResidentChangeLogs,
		loginAdmin,
		logoutAdmin,
		resetLoginForm,
		auditOwner,
		resetCommunityForm,
		editCommunity,
		saveCommunity,
		toggleCommunityActive,
		removeCommunity,
		editAdmin,
		saveAdmin,
		removeAdmin,
		resetAdminForm,
		editPermission,
		savePermission,
		removePermission,
		resetPermissionForm,
		toggleAdminMenu,
		toggleAdminAction,
		syncAdminPermissionRole,
		resetAdminPermissionToRole,
		loadAdminPermissionForForm,
		loadModuleRecords,
		moduleDisplayLabel,
		moduleDisplayDescription,
		moduleEnabledLabel,
		toggleModule,
		batchUpdateModules,
		restoreAllModules,
		openRepairDetail,
		closeRepairDetail,
		saveRepairAction,
		editRepairStaff,
		resetRepairStaffForm,
		saveRepairStaff,
		scanRepairSla,
		exportRepairs,
		editFee,
		saveFee,
		importFeesFromText,
		exportFees,
		reconcileFees,
		resolveFeeOwnerByMobile,
		removeFee,
		remindFee,
		selectFee,
		loadFeePayments,
		resetFeeForm,
		editNoticeConfig,
		saveNoticeConfig,
		resetNoticeConfigForm,
		sendNotice,
		retryNotice,
		selectNoticeRecord,
		onSchemaChange
	});
}
