const cloud = require('wx-server-sdk');
const cloudbase = require('@cloudbase/node-sdk');
const crypto = require('crypto');
const permissionEngine = require('./permission_engine.js');
const communityModules = require('./community_modules.js');

cloud.init({
	env: cloud.DYNAMIC_CURRENT_ENV
});

const app = cloudbase.init({
	env: cloudbase.SYMBOL_CURRENT_ENV
});
const models = app.models;
const adminAudit = require('./admin_audit.js');
const GLOBAL_SCHEMA = process.env.MYSQL_GLOBAL_SCHEMA || 'cloudbase-d9g78eneac709f5a5';
const DEFAULT_COMMUNITIES = [
	{ code: 'rzb-001', name: '荣尊堡', schemaName: 'rzb', sort: 1 },
	{ code: 'oljd-001', name: '欧陆经典', schemaName: 'oljd', sort: 2 }
];
const ADMIN_ROLES = [
	{ value: 'super_admin', label: '超级管理员' },
	{ value: 'admin', label: '管理员' },
	{ value: 'finance', label: '财务' },
	{ value: 'customer_service', label: '客服' },
	{ value: 'repairman', label: '维修' }
];
const TENANT_TABLES = [
	'owners',
	'login_sessions',
	'auth_codes',
	'owner_houses',
	'repairs',
	'fee_bills',
	'complaints',
	'service_orders',
	'notice_configs',
	'announcements'
];
const ADMIN_BOOTSTRAP_ROUTES = new Set(['admin/access/operators', 'admin/role/list']);
const MODULE_CHECK_EXEMPT_ROUTES = new Set([
	'admin/access/operators',
	'admin/access/profile',
	'admin/community/list',
	'admin/community/save',
	'admin/community/delete',
	'admin/community/module/list',
	'admin/community/module/save',
	'admin/community/module/batch_save',
	'admin/role/list',
	'admin/user/list',
	'admin/user/save',
	'admin/user/delete',
	'admin/permission/list',
	'admin/permission/save',
	'admin/permission/delete',
	'admin/audit/list'
]);

function getOpenId() {
	const ctx = cloud.getWXContext ? cloud.getWXContext() : {};
	return ctx.OPENID || '';
}

function token(openid) {
	return crypto.createHash('sha1').update(`${openid}:${Date.now()}:${Math.random()}`).digest('hex');
}

function code() {
	return String(Math.floor(100000 + Math.random() * 900000));
}

function auditStatusText(statusCode) {
	return {
		pending: '待后台认证',
		approved: '已认证',
		rejected: '已驳回，可重新提交',
		disabled: '账号已禁用',
		none: '待提交认证资料'
	}[statusCode] || '待后台认证';
}

function formatDateLabel(value) {
	const raw = value ? new Date(value) : null;
	if (!raw || Number.isNaN(raw.getTime())) return '';
	const y = raw.getFullYear();
	const m = String(raw.getMonth() + 1).padStart(2, '0');
	const d = String(raw.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

function normalizeHouse(value) {
	return String(value || '').trim();
}

function normalizeSchemaName(value) {
	const next = String(value || '').trim();
	if (!next) return '';
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(next)) {
		throw new Error('schemaName invalid');
	}
	return next;
}

function quoteIdent(value) {
	return `\`${String(value || '').replace(/`/g, '``')}\``;
}

function tableRef(schema, table) {
	return `${quoteIdent(schema)}.${quoteIdent(table)}`;
}

function globalTable(table) {
	return tableRef(GLOBAL_SCHEMA, table);
}

function tenantTable(schema, table) {
	return tableRef(normalizeSchemaName(schema), table);
}

function communitySchemaFallback(code) {
	const normalized = String(code || '').trim().toLowerCase();
	if (normalized.includes('oljd')) return 'oljd';
	if (normalized.includes('rzb')) return 'rzb';
	return normalized.replace(/[^a-z0-9_]/g, '_') || 'community';
}

function sqlNumber(value, fallback = 0) {
	const next = Number(value);
	return Number.isFinite(next) ? next : fallback;
}

function rowsFromResult(result) {
	if (Array.isArray(result)) return result;
	if (!result || typeof result !== 'object') return [];
	if (Array.isArray(result.data)) return result.data;
	if (Array.isArray(result.records)) return result.records;
	if (Array.isArray(result.list)) return result.list;
	if (result.data && Array.isArray(result.data.executeResultList)) return result.data.executeResultList;
	if (result.data && Array.isArray(result.data.records)) return result.data.records;
	if (result.data && Array.isArray(result.data.list)) return result.data.list;
	if (result.result && Array.isArray(result.result)) return result.result;
	return [];
}

function normalizeHttpEvent(event = {}) {
	if (event.route) {
		return { route: event.route || '', params: event.params || {}, headers: event.headers || {}, isHttp: false };
	}
	let body = {};
	if (event.body) {
		try {
			body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
		} catch (err) {
			body = {};
		}
	}
	return {
		route: body.route || event.queryStringParameters && event.queryStringParameters.route || '',
		params: body.params || {},
		headers: event.headers || {},
		isHttp: Boolean(event.httpMethod || event.headers || event.requestContext)
	};
}

function response(payload, isHttp) {
	if (!isHttp) return payload;
	return {
		statusCode: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-SXWY-ADMIN-TOKEN',
			'Content-Type': 'application/json; charset=utf-8'
		},
		body: JSON.stringify(payload)
	};
}

async function runSql(sql, params = {}) {
	return await models.$runSQL(sql, params);
}

async function queryRows(sql, params = {}) {
	return rowsFromResult(await runSql(sql, params));
}

async function ensureCommunityModuleRecords(communityId) {
	const communityKey = sqlNumber(communityId);
	if (!communityKey) return;
	const defaults = communityModules.buildDefaultCommunityModules(communityKey);
	for (const item of defaults) {
		await runSql(
			`INSERT INTO ${globalTable('community_modules')}
			(_openid, community_id, module_key, module_name, enabled, sort)
			VALUES ({{openid}}, {{communityId}}, {{moduleKey}}, {{moduleName}}, {{enabled}}, {{sort}})
			ON DUPLICATE KEY UPDATE module_name = VALUES(module_name), sort = VALUES(sort)`,
			{
				openid: getOpenId(),
				communityId: communityKey,
				moduleKey: item.moduleKey,
				moduleName: item.moduleName,
				enabled: item.enabled,
				sort: item.sort
			}
		);
	}
}

async function syncCommunityModulesForAllCommunities() {
	const rows = await queryRows(
		`SELECT id FROM ${globalTable('communities')} WHERE active = 1 ORDER BY id ASC`
	);
	for (const row of rows) {
		await ensureCommunityModuleRecords(row.id);
	}
}

async function ensureGlobalRegistryTables() {
	await runSql(
		`CREATE TABLE IF NOT EXISTS ${globalTable('admin_community_permissions')} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			_openid VARCHAR(64) DEFAULT '' NOT NULL,
			admin_id BIGINT UNSIGNED NOT NULL,
			community_id BIGINT UNSIGNED NOT NULL,
			role ENUM('super_admin','admin','finance','customer_service','repairman') NOT NULL DEFAULT 'admin',
			permissions_json TEXT DEFAULT '',
			active TINYINT(1) NOT NULL DEFAULT 1,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY uk_admin_community_permissions (admin_id, community_id),
			KEY idx_admin_community_permissions_community (community_id),
			KEY idx_admin_community_permissions_role (role)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	);
	await runSql(
		`CREATE TABLE IF NOT EXISTS ${globalTable('community_modules')} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			_openid VARCHAR(64) DEFAULT '' NOT NULL,
			community_id BIGINT UNSIGNED NOT NULL,
			module_key VARCHAR(64) NOT NULL,
			module_name VARCHAR(120) NOT NULL,
			enabled TINYINT(1) NOT NULL DEFAULT 1,
			sort INT NOT NULL DEFAULT 0,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			UNIQUE KEY uk_community_modules (community_id, module_key),
			KEY idx_community_modules_community_enabled (community_id, enabled)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	);
	await runSql(
		`CREATE TABLE IF NOT EXISTS ${globalTable('admin_audit_logs')} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			_openid VARCHAR(64) DEFAULT '' NOT NULL,
			admin_id BIGINT UNSIGNED DEFAULT NULL,
			username VARCHAR(80) DEFAULT '',
			role ENUM('super_admin','admin','finance','customer_service','repairman') NOT NULL DEFAULT 'admin',
			community_id BIGINT UNSIGNED DEFAULT NULL,
			community_name VARCHAR(120) DEFAULT '',
			route VARCHAR(120) NOT NULL,
			module_key VARCHAR(64) DEFAULT '',
			action_key VARCHAR(64) DEFAULT '',
			status ENUM('success','failed') NOT NULL DEFAULT 'success',
			message VARCHAR(255) DEFAULT '',
			params_json LONGTEXT,
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (id),
			KEY idx_admin_audit_logs_admin (admin_id),
			KEY idx_admin_audit_logs_community (community_id),
			KEY idx_admin_audit_logs_route (route),
			KEY idx_admin_audit_logs_created_at (created_at)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
	);
}

async function init() {
	for (const item of DEFAULT_COMMUNITIES) {
		await runSql(
			`INSERT INTO ${globalTable('communities')} (code, name, schema_name, sort, active)
			VALUES ({{code}}, {{name}}, {{schemaName}}, {{sort}}, 1)
			ON DUPLICATE KEY UPDATE name = VALUES(name), schema_name = VALUES(schema_name), sort = VALUES(sort), active = 1`,
			item
		);
	}
	await ensureGlobalRegistryTables();
	await syncCommunityModulesForAllCommunities();
	return { ok: true, database: 'mysql' };
}

async function communities() {
	await init();
	const list = await queryRows(
		`SELECT id, code, name, schema_name AS schemaName FROM ${globalTable('communities')}
		WHERE active = 1
		ORDER BY sort ASC, id ASC`
	);
	return {
		list: list.map((item) => ({
			id: String(item.id || item.code || ''),
			name: item.name,
			code: item.code || '',
			schemaName: item.schemaName || ''
		}))
	};
}

async function findCommunity(communityId, communityName) {
	const id = String(communityId || '').trim();
	const name = String(communityName || '').trim();
	let rows = [];
	if (id && /^\d+$/.test(id)) {
		rows = await queryRows(
			`SELECT id, code, name, schema_name AS schemaName FROM ${globalTable('communities')} WHERE id = {{id}} AND active = 1 LIMIT 1`,
			{ id: sqlNumber(id) }
		);
	}
	if (!rows.length && id) {
		rows = await queryRows(
			`SELECT id, code, name, schema_name AS schemaName FROM ${globalTable('communities')} WHERE code = {{code}} AND active = 1 LIMIT 1`,
			{ code: id }
		);
	}
	if (!rows.length && name) {
		rows = await queryRows(
			`SELECT id, code, name, schema_name AS schemaName FROM ${globalTable('communities')} WHERE name = {{name}} AND active = 1 LIMIT 1`,
			{ name }
		);
	}
	if (!rows.length) throw new Error('小区不存在或已停用');
	const item = rows[0];
	return Object.assign({}, item, { schemaName: normalizeSchemaName(item.schemaName || communitySchemaFallback(item.code)) });
}

async function findCommunityBySchema(schemaName) {
	const normalized = normalizeSchemaName(schemaName);
	if (!normalized) return null;
	const rows = await queryRows(
		`SELECT id, code, name, schema_name AS schemaName
		FROM ${globalTable('communities')}
		WHERE schema_name = {{schemaName}} AND active = 1
		LIMIT 1`,
		{ schemaName: normalized }
	);
	const item = rows[0] || null;
	return item ? Object.assign({}, item, { schemaName: normalizeSchemaName(item.schemaName || normalized) }) : null;
}

async function listActiveCommunities() {
	const rows = await queryRows(
		`SELECT id, code, name, schema_name AS schemaName
		FROM ${globalTable('communities')}
		WHERE active = 1
		ORDER BY sort ASC, id ASC`
	);
	return rows.map((item) => Object.assign({}, item, {
		schemaName: normalizeSchemaName(item.schemaName || communitySchemaFallback(item.code))
	}));
}

async function ensureTenantSchema(schemaName) {
	const schema = normalizeSchemaName(schemaName);
	for (const table of TENANT_TABLES) {
		if (table === 'owners') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					openid VARCHAR(128) DEFAULT '',
					community_id BIGINT UNSIGNED NOT NULL,
					community_name VARCHAR(120) NOT NULL,
					name VARCHAR(80) NOT NULL,
					mobile VARCHAR(32) NOT NULL,
					house VARCHAR(120) NOT NULL,
					audit_status ENUM('pending','approved','rejected','disabled') NOT NULL DEFAULT 'pending',
					audit_remark VARCHAR(255) DEFAULT '',
					session_token VARCHAR(128) DEFAULT '',
					last_login_at DATETIME NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_owners_mobile (mobile),
					KEY idx_owners_status (audit_status),
					KEY idx_owners_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'login_sessions') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					openid VARCHAR(128) DEFAULT '',
					community_id BIGINT UNSIGNED NOT NULL,
					community_name VARCHAR(120) NOT NULL,
					mobile VARCHAR(32) NOT NULL,
					session_token VARCHAR(128) NOT NULL,
					last_login_at DATETIME NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					UNIQUE KEY uk_login_sessions_openid_community (openid, community_id),
					KEY idx_login_sessions_mobile (mobile),
					KEY idx_login_sessions_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'auth_codes') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					openid VARCHAR(128) DEFAULT '',
					mobile VARCHAR(32) NOT NULL,
					code VARCHAR(12) NOT NULL,
					used TINYINT(1) NOT NULL DEFAULT 0,
					expires_at DATETIME NOT NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					used_at DATETIME NULL,
					PRIMARY KEY (id),
					KEY idx_auth_codes_mobile (mobile),
					KEY idx_auth_codes_openid (openid)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'owner_houses') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					owner_id BIGINT UNSIGNED NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					house VARCHAR(120) NOT NULL,
					active TINYINT(1) NOT NULL DEFAULT 1,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					UNIQUE KEY uk_owner_houses_owner_house (owner_id, house),
					KEY idx_owner_houses_owner (owner_id),
					KEY idx_owner_houses_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'repairs') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					owner_id BIGINT UNSIGNED DEFAULT NULL,
					house VARCHAR(120) DEFAULT '',
					contact VARCHAR(80) DEFAULT '',
					phone VARCHAR(32) DEFAULT '',
					title VARCHAR(160) NOT NULL,
					type VARCHAR(60) DEFAULT '',
					description TEXT,
					status ENUM('pending','assigned','processing','completed','closed') NOT NULL DEFAULT 'pending',
					assignee VARCHAR(80) DEFAULT '',
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_repairs_status (status),
					KEY idx_repairs_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'fee_bills') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					owner_id BIGINT UNSIGNED DEFAULT NULL,
					owner_name VARCHAR(80) DEFAULT '',
					house VARCHAR(120) DEFAULT '',
					bill_no VARCHAR(80) NOT NULL,
					bill_type VARCHAR(60) NOT NULL DEFAULT '物业费',
					amount DECIMAL(10,2) NOT NULL DEFAULT 0,
					status ENUM('unpaid','paid','overdue','void') NOT NULL DEFAULT 'unpaid',
					due_date DATE NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					UNIQUE KEY uk_fee_bills_bill_no (bill_no),
					KEY idx_fee_bills_status (status),
					KEY idx_fee_bills_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'complaints') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					owner_id BIGINT UNSIGNED DEFAULT NULL,
					contact VARCHAR(80) DEFAULT '',
					phone VARCHAR(32) DEFAULT '',
					title VARCHAR(160) NOT NULL,
					content TEXT,
					status ENUM('pending','processing','completed','closed') NOT NULL DEFAULT 'pending',
					assignee VARCHAR(80) DEFAULT '',
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_complaints_status (status),
					KEY idx_complaints_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'service_orders') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					owner_id BIGINT UNSIGNED DEFAULT NULL,
					service_type VARCHAR(80) NOT NULL,
					contact VARCHAR(80) DEFAULT '',
					phone VARCHAR(32) DEFAULT '',
					remark TEXT,
					status ENUM('pending','processing','completed','closed') NOT NULL DEFAULT 'pending',
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_service_orders_status (status),
					KEY idx_service_orders_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'notice_configs') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					scene VARCHAR(80) NOT NULL,
					channel ENUM('wechat','dingtalk','sms','system') NOT NULL DEFAULT 'system',
					template_name VARCHAR(120) NOT NULL,
					enabled TINYINT(1) NOT NULL DEFAULT 1,
					robot_name VARCHAR(120) DEFAULT '',
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_notice_configs_scene (scene),
					KEY idx_notice_configs_community (community_id)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		} else if (table === 'announcements') {
			await runSql(
				`CREATE TABLE IF NOT EXISTS ${tenantTable(schema, table)} (
					id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
					_openid VARCHAR(64) DEFAULT '' NOT NULL,
					openid VARCHAR(128) DEFAULT '',
					community_id BIGINT UNSIGNED DEFAULT NULL,
					community_name VARCHAR(120) DEFAULT '',
					title VARCHAR(160) NOT NULL,
					summary VARCHAR(255) DEFAULT '',
					content TEXT,
					cover_url VARCHAR(255) DEFAULT '',
					is_pinned TINYINT(1) NOT NULL DEFAULT 0,
					status ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
					sort INT NOT NULL DEFAULT 0,
					publish_at DATETIME NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
					PRIMARY KEY (id),
					KEY idx_announcements_status (status),
					KEY idx_announcements_community (community_id),
					KEY idx_announcements_sort (sort)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
			);
		}
	}
}

function announcementDto(item) {
	return {
		id: Number(item.id),
		title: item.title || '',
		summary: item.summary || '',
		content: item.content || '',
		coverUrl: item.cover_url || '',
		isPinned: Boolean(Number(item.is_pinned)),
		status: item.status || 'published',
		sort: Number(item.sort || 0),
		publishAt: item.publish_at || '',
		createdAt: item.created_at || '',
		updatedAt: item.updated_at || '',
		dateLabel: formatDateLabel(item.publish_at || item.created_at || item.updated_at)
	};
}

async function listAnnouncements(schemaName, limit = 10) {
	const rows = await queryRows(
		`SELECT id, title, summary, content, cover_url, is_pinned, status, sort, publish_at, created_at, updated_at
		FROM ${tenantTable(schemaName, 'announcements')}
		WHERE status = 'published'
		ORDER BY is_pinned DESC, sort ASC, id DESC
		LIMIT ${sqlNumber(limit, 10)}`
	);
	return rows.map(announcementDto);
}

async function migrateCommunityData(community) {
	const schema = normalizeSchemaName(community.schemaName || communitySchemaFallback(community.code));
	const communityName = community.name;
	const communityId = sqlNumber(community.id);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'owners')} (_openid, openid, community_id, community_name, name, mobile, house, audit_status, audit_remark, session_token, last_login_at, created_at, updated_at)
		SELECT g._openid, g.openid, g.community_id, g.community_name, g.name, g.mobile, g.house, g.audit_status, g.audit_remark, g.session_token, g.last_login_at, g.created_at, g.updated_at
		FROM ${globalTable('owners')} g
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'owners')} t
			WHERE (t.mobile = g.mobile AND t.house = g.house) OR (t.openid <> '' AND t.openid = g.openid)
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'owner_houses')} (_openid, owner_id, community_id, community_name, house, active, created_at, updated_at)
		SELECT g._openid, COALESCE(t.id, g.owner_id), g.community_id, g.community_name, g.house, g.active, g.created_at, g.updated_at
		FROM ${globalTable('owner_houses')} g
		LEFT JOIN ${globalTable('owners')} go ON go.id = g.owner_id
		LEFT JOIN ${tenantTable(schema, 'owners')} t ON t.openid = go.openid OR t._openid = go._openid
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'owner_houses')} t
			WHERE t.community_name = g.community_name AND t.house = g.house
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'repairs')} (_openid, community_id, community_name, owner_id, house, contact, phone, title, type, description, status, assignee, created_at, updated_at)
		SELECT g._openid, g.community_id, g.community_name, COALESCE(t.id, g.owner_id), g.house, g.contact, g.phone, g.title, g.type, g.description, g.status, g.assignee, g.created_at, g.updated_at
		FROM ${globalTable('repairs')} g
		LEFT JOIN ${globalTable('owners')} go ON go.id = g.owner_id
		LEFT JOIN ${tenantTable(schema, 'owners')} t ON t.openid = go.openid OR t._openid = go._openid
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'repairs')} t
			WHERE t.title = g.title AND t.created_at = g.created_at
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'fee_bills')} (_openid, community_id, community_name, owner_id, owner_name, house, bill_no, bill_type, amount, status, due_date, created_at, updated_at)
		SELECT g._openid, g.community_id, g.community_name, COALESCE(t.id, g.owner_id), g.owner_name, g.house, g.bill_no, g.bill_type, g.amount, g.status, g.due_date, g.created_at, g.updated_at
		FROM ${globalTable('fee_bills')} g
		LEFT JOIN ${globalTable('owners')} go ON go.id = g.owner_id
		LEFT JOIN ${tenantTable(schema, 'owners')} t ON t.openid = go.openid OR t._openid = go._openid
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'fee_bills')} t
			WHERE t.bill_no = g.bill_no
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'complaints')} (_openid, community_id, community_name, owner_id, contact, phone, title, content, status, assignee, created_at, updated_at)
		SELECT g._openid, g.community_id, g.community_name, COALESCE(t.id, g.owner_id), g.contact, g.phone, g.title, g.content, g.status, g.assignee, g.created_at, g.updated_at
		FROM ${globalTable('complaints')} g
		LEFT JOIN ${globalTable('owners')} go ON go.id = g.owner_id
		LEFT JOIN ${tenantTable(schema, 'owners')} t ON t.openid = go.openid OR t._openid = go._openid
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'complaints')} t
			WHERE t.title = g.title AND t.created_at = g.created_at
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'service_orders')} (_openid, community_id, community_name, owner_id, service_type, contact, phone, remark, status, created_at, updated_at)
		SELECT g._openid, g.community_id, g.community_name, COALESCE(t.id, g.owner_id), g.service_type, g.contact, g.phone, g.remark, g.status, g.created_at, g.updated_at
		FROM ${globalTable('service_orders')} g
		LEFT JOIN ${globalTable('owners')} go ON go.id = g.owner_id
		LEFT JOIN ${tenantTable(schema, 'owners')} t ON t.openid = go.openid OR t._openid = go._openid
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'service_orders')} t
			WHERE t.service_type = g.service_type AND t.created_at = g.created_at
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
	await runSql(
		`INSERT INTO ${tenantTable(schema, 'notice_configs')} (_openid, community_id, community_name, scene, channel, template_name, enabled, robot_name, created_at, updated_at)
		SELECT g._openid, g.community_id, g.community_name, g.scene, g.channel, g.template_name, g.enabled, g.robot_name, g.created_at, g.updated_at
		FROM ${globalTable('notice_configs')} g
		WHERE (g.community_name = {{communityName}} OR g.community_id = {{communityId}})
		AND NOT EXISTS (
			SELECT 1 FROM ${tenantTable(schema, 'notice_configs')} t
			WHERE t.scene = g.scene AND t.template_name = g.template_name
			LIMIT 1
		)`,
		{ communityName, communityId }
	);
}

async function getOwnerByOpenid(schemaName, openid) {
	if (!schemaName || !openid) return null;
	const rows = await queryRows(
		`SELECT id, openid, community_id, community_name, name, mobile, house,
			audit_status, audit_remark, session_token, last_login_at, created_at, updated_at
		FROM ${tenantTable(schemaName, 'owners')}
		WHERE openid = {{openid}} OR _openid = {{openid}}
		ORDER BY id DESC
		LIMIT 1`,
		{ openid }
	);
	return rows[0] || null;
}

async function getOwnerHouses(schemaName, owner) {
	if (!schemaName || !owner || !owner.id) return [];
	const rows = await queryRows(
		`SELECT house, community_name FROM ${tenantTable(schemaName, 'owner_houses')}
		WHERE owner_id = {{ownerId}} AND active = 1
		ORDER BY id ASC`,
		{ ownerId: sqlNumber(owner.id) }
	);
	if (!rows.length && owner.house) {
		return [{ name: owner.house, desc: owner.community_name || '绑定房屋' }];
	}
	return rows.map((item) => ({
		name: item.house,
		desc: item.community_name || owner.community_name || '绑定房屋'
	}));
}

async function getLoginSessionByOpenid(schemaName, openid) {
	const rows = await queryRows(
		`SELECT id, _openid, openid, community_id, community_name, mobile, session_token, last_login_at, created_at, updated_at
		FROM ${tenantTable(schemaName, 'login_sessions')}
		WHERE openid = {{openid}} OR _openid = {{openid}}
		ORDER BY id DESC
		LIMIT 1`,
		{ openid }
	);
	return rows[0] || null;
}

async function getLoginSessionByToken(schemaName, tokenValue) {
	const rows = await queryRows(
		`SELECT id, _openid, openid, community_id, community_name, mobile, session_token, last_login_at, created_at, updated_at
		FROM ${tenantTable(schemaName, 'login_sessions')}
		WHERE session_token = {{sessionToken}}
		LIMIT 1`,
		{ sessionToken: String(tokenValue || '').trim() }
	);
	return rows[0] || null;
}

async function getOwnerBySessionToken(schemaName, tokenValue) {
	const rows = await queryRows(
		`SELECT id, _openid, openid, community_id, community_name, name, mobile, house, audit_status, audit_remark, session_token, last_login_at, created_at, updated_at
		FROM ${tenantTable(schemaName, 'owners')}
		WHERE session_token = {{sessionToken}}
		LIMIT 1`,
		{ sessionToken: String(tokenValue || '').trim() }
	);
	return rows[0] || null;
}

async function findLoginSessionAcrossCommunitiesByToken(tokenValue, preferredSchemaName = '') {
	const communities = await listActiveCommunities();
	const prioritized = [];
	const preferred = normalizeSchemaName(preferredSchemaName);
	if (preferred) {
		const match = communities.find((item) => item.schemaName === preferred);
		if (match) prioritized.push(match);
	}
	for (const community of communities) {
		if (!prioritized.some((item) => item.schemaName === community.schemaName)) {
			prioritized.push(community);
		}
	}
	for (const community of prioritized) {
		const session = await getLoginSessionByToken(community.schemaName, tokenValue);
		if (session) return { community, session };
	}
	return { community: null, session: null };
}

async function findOwnerAcrossCommunities(openid, preferredSchemaName = '') {
	const communities = await listActiveCommunities();
	const prioritized = [];
	const preferred = normalizeSchemaName(preferredSchemaName);
	if (preferred) {
		const match = communities.find((item) => item.schemaName === preferred);
		if (match) prioritized.push(match);
	}
	for (const community of communities) {
		if (!prioritized.some((item) => item.schemaName === community.schemaName)) {
			prioritized.push(community);
		}
	}
	for (const community of prioritized) {
		const owner = await getOwnerByOpenid(community.schemaName, openid);
		if (owner) return { community, owner };
	}
	return { community: null, owner: null };
}

function profilePayload(owner, houses, sessionToken, community) {
	const statusCode = owner.audit_status || 'pending';
	const currentCommunity = community || {
		id: String(owner.community_id || ''),
		name: owner.community_name || '',
		schemaName: owner.schema_name || ''
	};
	return {
		isAuthed: true,
		token: sessionToken || owner.session_token || '',
		loginAt: owner.last_login_at || owner.updated_at || owner.created_at || Date.now(),
		statusCode,
		schemaName: currentCommunity.schemaName || '',
		user: { name: owner.name || '已登录用户', status: auditStatusText(statusCode) },
		currentCommunity: {
			id: String(currentCommunity.id || owner.community_id || ''),
			name: currentCommunity.name || owner.community_name || '',
			schemaName: currentCommunity.schemaName || ''
		},
		houses
	};
}

function loginPayload(session, community) {
	const currentCommunity = community || {
		id: String(session.community_id || ''),
		name: session.community_name || '',
		schemaName: ''
	};
	return {
		isAuthed: false,
		isLoggedIn: true,
		token: session.session_token || '',
		loginAt: session.last_login_at || session.updated_at || session.created_at || Date.now(),
		statusCode: 'none',
		user: { name: '已登录用户', status: '已登录，待业主认证' },
		currentCommunity: {
			id: String(currentCommunity.id || session.community_id || ''),
			name: currentCommunity.name || session.community_name || '',
			schemaName: currentCommunity.schemaName || ''
		},
		houses: []
	};
}

async function resolveCommunityContext(params = {}, options = {}) {
	const schemaName = normalizeSchemaName(params.schemaName || params.schema || '');
	if (schemaName) {
		const community = await findCommunityBySchema(schemaName);
		if (community) return community;
	}
	const byIdOrName = String(params.communityId || params.communityName || '').trim();
	if (byIdOrName) {
		return await findCommunity(params.communityId, params.communityName);
	}
	if (options.openid) {
		const found = await findOwnerAcrossCommunities(options.openid, schemaName);
		if (found.community) return found.community;
	}
	const communities = await listActiveCommunities();
	if (!communities.length) throw new Error('小区不存在或已停用');
	return communities[0];
}

async function profile(params = {}) {
	await init();
	const openid = getOpenId();
	const currentSchema = normalizeSchemaName(params.schemaName || params.schema || '');
	const requestToken = String(params.token || '').trim();
	let owner = null;
	let community = null;
	if (requestToken) {
		if (currentSchema) {
			community = await findCommunityBySchema(currentSchema);
			if (community) {
				owner = await getOwnerBySessionToken(community.schemaName, requestToken);
				if (!owner) {
					const loginSession = await getLoginSessionByToken(community.schemaName, requestToken);
					if (loginSession) {
						return loginPayload(loginSession, community);
					}
				}
			}
		}
		if (!owner) {
			const found = await findOwnerAcrossCommunities(openid, currentSchema);
			if (found.owner && found.owner.session_token === requestToken) {
				owner = found.owner;
				community = found.community;
			} else {
				const loginFound = await findLoginSessionAcrossCommunitiesByToken(requestToken, currentSchema);
				if (loginFound.session) {
					const resolvedLoginCommunity = loginFound.community || await findCommunityBySchema(currentSchema || '');
					const loginOwner = await getOwnerByOpenid(
						resolvedLoginCommunity ? resolvedLoginCommunity.schemaName : currentSchema || '',
						openid
					);
					if (loginOwner) {
						const houses = await getOwnerHouses(
							resolvedLoginCommunity ? resolvedLoginCommunity.schemaName : currentSchema || '',
							loginOwner
						);
						return profilePayload(
							Object.assign({}, loginOwner, { session_token: loginOwner.session_token || requestToken }),
							houses,
							loginOwner.session_token || requestToken,
							resolvedLoginCommunity || {
								id: String(loginOwner.community_id || ''),
								name: loginOwner.community_name || '',
								schemaName: currentSchema || ''
							}
						);
					}
					return loginPayload(loginFound.session, resolvedLoginCommunity || {
						id: String(loginFound.session.community_id || ''),
						name: loginFound.session.community_name || '',
						schemaName: currentSchema || ''
					});
				}
			}
		}
	}
	if (!owner) {
		return {
			isAuthed: false,
			isLoggedIn: false,
			statusCode: 'none',
			user: { name: '未认证住户', status: auditStatusText('none') },
			currentCommunity: null,
			schemaName: '',
			houses: []
		};
	}
	const resolvedCommunity = community || await findCommunityBySchema(currentSchema || communitySchemaFallback(owner.community_name));
	const resolvedSchemaName = resolvedCommunity ? resolvedCommunity.schemaName : currentSchema || communitySchemaFallback(owner.community_name);
	let sessionToken = owner.session_token || '';
	if (!sessionToken) {
		sessionToken = token(openid || owner.openid || String(owner.id));
		await runSql(
			`UPDATE ${tenantTable(resolvedSchemaName, 'owners')}
			SET session_token = {{sessionToken}}, last_login_at = NOW()
			WHERE id = {{id}}`,
			{ sessionToken, id: sqlNumber(owner.id) }
		);
		owner.session_token = sessionToken;
	}
	const houses = await getOwnerHouses(resolvedSchemaName, owner);
	return profilePayload(owner, houses, sessionToken, resolvedCommunity || {
		id: String(owner.community_id || ''),
		name: owner.community_name || '',
		schemaName: resolvedSchemaName
	});
}

async function latestCode(schemaName, openid, mobile) {
	const rows = await queryRows(
		`SELECT id, openid, mobile, code, used, expires_at
		FROM ${tenantTable(schemaName, 'auth_codes')}
		WHERE mobile = {{mobile}} AND (openid = {{openid}} OR _openid = {{openid}})
		ORDER BY id DESC
		LIMIT 1`,
		{ openid, mobile }
	);
	return rows[0] || null;
}

function isFutureDate(value) {
	if (!value) return false;
	const time = new Date(value).getTime();
	return Number.isFinite(time) && time > Date.now();
}

async function sendCode(params = {}) {
	await init();
	const openid = getOpenId();
	if (!openid) throw new Error('openid missing');
	const mobile = String(params.mobile || '').trim();
	if (!mobile) throw new Error('mobile required');
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const schemaName = community.schemaName;
	const prev = await latestCode(schemaName, openid, mobile);
	if (prev && isFutureDate(prev.expires_at) && !Number(prev.used)) {
		return { mobile, expiresAt: prev.expires_at, debugCode: prev.code };
	}
	const next = code();
	await runSql(
		`INSERT INTO ${tenantTable(schemaName, 'auth_codes')} (_openid, openid, mobile, code, used, expires_at)
		VALUES ({{openid}}, {{openid}}, {{mobile}}, {{code}}, 0, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
		{ openid, mobile, code: next }
	);
	return { mobile, expiresAt: Date.now() + 5 * 60 * 1000, debugCode: next };
}

async function loginSubmit(params = {}) {
	await init();
	const openid = getOpenId();
	if (!openid) throw new Error('openid missing');
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const schemaName = community.schemaName;
	const mobile = String(params.mobile || '').trim();
	const inputCode = String(params.code || '').trim();
	if (!community || !mobile || !inputCode) {
		throw new Error('登录信息不完整');
	}

	const savedCode = await latestCode(schemaName, openid, mobile);
	if (!savedCode) throw new Error('验证码不存在');
	if (String(savedCode.openid) !== openid) throw new Error('验证码不存在');
	if (Number(savedCode.used)) throw new Error('验证码已使用');
	if (!isFutureDate(savedCode.expires_at)) throw new Error('验证码已过期');
	if (String(savedCode.code) !== inputCode) throw new Error('验证码错误');

	const sessionToken = token(openid);
	await runSql(
		`INSERT INTO ${tenantTable(schemaName, 'login_sessions')} (_openid, openid, community_id, community_name, mobile, session_token, last_login_at)
		VALUES ({{openid}}, {{openid}}, {{communityId}}, {{communityName}}, {{mobile}}, {{sessionToken}}, NOW())
		ON DUPLICATE KEY UPDATE mobile = VALUES(mobile), community_id = VALUES(community_id),
			community_name = VALUES(community_name), session_token = VALUES(session_token), last_login_at = NOW()`,
		{
			openid,
			communityId: sqlNumber(community.id),
			communityName: community.name,
			mobile,
			sessionToken
		}
	);
	await runSql(
		`UPDATE ${tenantTable(schemaName, 'auth_codes')} SET used = 1, used_at = NOW() WHERE id = {{id}}`,
		{ id: sqlNumber(savedCode.id) }
	);
	const owner = await getOwnerByOpenid(schemaName, openid);
	if (owner) {
		if (owner.session_token !== sessionToken) {
			await runSql(
				`UPDATE ${tenantTable(schemaName, 'owners')}
				SET session_token = {{sessionToken}}, last_login_at = NOW()
				WHERE id = {{id}}`,
				{ sessionToken, id: sqlNumber(owner.id) }
			);
		}
		const houses = await getOwnerHouses(schemaName, owner);
		return profilePayload(Object.assign({}, owner, { session_token: sessionToken }), houses, sessionToken, community);
	}
	const session = await getLoginSessionByOpenid(schemaName, openid);
	return loginPayload(session || {
		_openid: openid,
		openid,
		community_id: community.id,
		community_name: community.name,
		session_token: sessionToken
	}, community);
}

async function submitAuth(params = {}) {
	await init();
	const openid = getOpenId();
	if (!openid) throw new Error('openid missing');
	const community = await resolveCommunityContext(params, { openid });
	const schemaName = community.schemaName;
	const loginSession = await getLoginSessionByToken(schemaName, String(params.token || '').trim())
		|| await getLoginSessionByOpenid(schemaName, openid);
	if (!loginSession) throw new Error('请先完成手机号验证码登录');
	const existed = await getOwnerByOpenid(schemaName, openid);
	if (existed && existed.audit_status !== 'rejected') {
		const houses = await getOwnerHouses(schemaName, existed);
		return profilePayload(existed, houses, existed.session_token, community);
	}

	const house = normalizeHouse(params.house);
	const name = String(params.name || '').trim();
	if (!name || !house) {
		throw new Error('认证信息不完整');
	}
	const mobile = String(loginSession.mobile || params.mobile || '').trim();
	if (!mobile) throw new Error('手机号不存在');

	const sessionToken = token(openid);
	if (existed && existed.id) {
		await runSql(
			`UPDATE ${tenantTable(schemaName, 'owners')}
			SET _openid = {{openid}}, openid = {{openid}}, community_id = {{communityId}},
				community_name = {{communityName}}, name = {{name}}, mobile = {{mobile}},
				house = {{house}}, audit_status = 'pending', audit_remark = '',
				session_token = {{sessionToken}}, last_login_at = NOW()
			WHERE id = {{id}}`,
			{
				id: sqlNumber(existed.id),
				openid,
				communityId: sqlNumber(community.id),
				communityName: community.name,
				name,
				mobile,
				house,
				sessionToken
			}
		);
	} else {
		await runSql(
			`INSERT INTO ${tenantTable(schemaName, 'owners')} (_openid, openid, community_id, community_name, name, mobile, house,
				audit_status, session_token, last_login_at)
			VALUES ({{openid}}, {{openid}}, {{communityId}}, {{communityName}}, {{name}}, {{mobile}},
				{{house}}, 'pending', {{sessionToken}}, NOW())`,
			{
				openid,
				communityId: sqlNumber(community.id),
				communityName: community.name,
				name,
				mobile,
				house,
				sessionToken
			}
		);
	}

	const owner = await getOwnerByOpenid(schemaName, openid);
	await runSql(
		`INSERT INTO ${tenantTable(schemaName, 'owner_houses')} (_openid, owner_id, community_id, community_name, house, active)
		VALUES ({{openid}}, {{ownerId}}, {{communityId}}, {{communityName}}, {{house}}, 1)
		ON DUPLICATE KEY UPDATE active = 1, community_id = VALUES(community_id), community_name = VALUES(community_name)`,
		{
			openid,
			ownerId: sqlNumber(owner.id),
			communityId: sqlNumber(community.id),
			communityName: community.name,
			house
		}
	);
	await runSql(
		`UPDATE ${tenantTable(schemaName, 'login_sessions')} SET session_token = {{sessionToken}}, last_login_at = NOW()
		WHERE openid = {{openid}} OR _openid = {{openid}}`,
		{ openid, sessionToken }
	);

	const refreshedOwner = await getOwnerByOpenid(schemaName, openid);
	return profilePayload(refreshedOwner || owner, await getOwnerHouses(schemaName, refreshedOwner || owner), sessionToken, community);
}

async function requireUser(params = {}) {
	await init();
	const openid = getOpenId();
	const community = await resolveCommunityContext(params, { openid });
	const owner = await getOwnerByOpenid(community.schemaName, openid);
	if (!owner) throw new Error('请先完成业主认证');
	if (owner.audit_status === 'disabled') throw new Error('账号已禁用');
	return { owner, community };
}

async function switchCommunity(params = {}) {
	await init();
	throw new Error('业主不能切换小区，请退出登录后重新登录');
}

async function bindHouse(params = {}) {
	const { owner, community } = await requireUser(params);
	const house = normalizeHouse(params.house);
	if (!house) throw new Error('请输入房屋信息');
	const schemaName = community.schemaName;
	await runSql(
		`INSERT INTO ${tenantTable(schemaName, 'owner_houses')} (_openid, owner_id, community_id, community_name, house, active)
		VALUES ({{openid}}, {{ownerId}}, {{communityId}}, {{communityName}}, {{house}}, 1)
		ON DUPLICATE KEY UPDATE active = 1`,
		{
			openid: owner.openid || getOpenId(),
			ownerId: sqlNumber(owner.id),
			communityId: sqlNumber(owner.community_id),
			communityName: owner.community_name || '',
			house
		}
	);
	return await profile({ schemaName });
}

async function unbindHouse(params = {}) {
	throw new Error('解绑请联系物业处理');
}

async function scalarCount(schemaName, table) {
	const source = schemaName === GLOBAL_SCHEMA ? globalTable(table) : tenantTable(schemaName, table);
	const rows = await queryRows(`SELECT COUNT(*) AS total FROM ${source}`);
	return rows[0] ? Number(rows[0].total || 0) : 0;
}

async function home(params = {}) {
	await init();
	const community = await resolveCommunityContext(params, { openid: getOpenId() });
	const announcements = await listAnnouncements(community.schemaName, 6);
	await ensureCommunityModuleRecords(community.id);
	const modules = await getCommunityModules(community.id);
	return {
		communityName: community.name,
		schemaName: community.schemaName,
		modules,
		banner: announcements[0] || {
			title: '社区公告',
			summary: '暂无公告发布',
			coverUrl: '',
			isPinned: false,
			status: 'draft',
			sort: 0,
			dateLabel: ''
		},
		stats: [
			{ label: '报修工单', value: await scalarCount(community.schemaName, 'repairs') },
			{ label: '通知记录', value: await scalarCount(community.schemaName, 'notice_configs') },
			{ label: '认证业主', value: await scalarCount(community.schemaName, 'owners') },
			{ label: '待处理事项', value: 0 }
		],
		announcements,
		notices: announcements.map((item) => ({
			title: item.title,
			desc: item.summary || item.content || ''
		}))
	};
}

async function repairList(params = {}) {
	await init();
	const community = await resolveCommunityContext(params, { openid: getOpenId() });
	const list = await queryRows(
		`SELECT id, title, type, house, contact, phone, description AS \`desc\`, status, created_at
		FROM ${tenantTable(community.schemaName, 'repairs')}
		ORDER BY id DESC
		LIMIT 50`
	);
	return { list };
}

async function repairCreate(params = {}) {
	await init();
	const community = await resolveCommunityContext(params, { openid: getOpenId() });
	const owner = await getOwnerByOpenid(community.schemaName, getOpenId());
	if (!owner) throw new Error('请先完成业主认证');
	await runSql(
		`INSERT INTO ${tenantTable(community.schemaName, 'repairs')} (_openid, community_id, community_name, owner_id, house, contact, phone,
			title, type, description, status)
		VALUES ({{openid}}, {{communityId}}, {{communityName}}, {{ownerId}}, {{house}}, {{contact}},
			{{phone}}, {{title}}, {{type}}, {{description}}, 'pending')`,
		{
			openid: getOpenId(),
			communityId: owner ? sqlNumber(owner.community_id) : null,
			communityName: owner ? owner.community_name || '' : '',
			ownerId: owner ? sqlNumber(owner.id) : null,
			house: params.house || (owner ? owner.house || '' : ''),
			contact: params.contact || (owner ? owner.name || '' : ''),
			phone: params.phone || (owner ? owner.mobile || '' : ''),
			title: params.title || '报事报修',
			type: params.type || '',
			description: params.desc || params.description || ''
		}
	);
	return { ok: true };
}

function readHeader(headers, name) {
	const lowerName = name.toLowerCase();
	for (const key of Object.keys(headers || {})) {
		if (key.toLowerCase() === lowerName) return headers[key];
	}
	return '';
}

function requireAdminToken(headers) {
	const expected = process.env.ADMIN_API_TOKEN || '';
	if (!expected) throw new Error('后台管理令牌未配置');
	const actual = readHeader(headers, 'x-sxwy-admin-token');
	if (!actual || actual !== expected) throw new Error('后台管理令牌无效');
}

function readAdminUserId(headers) {
	return String(readHeader(headers, 'x-sxwy-admin-user-id') || '').trim();
}

async function getAdminUserById(adminId) {
	const id = sqlNumber(adminId);
	if (!id) return null;
	const rows = await queryRows(
		`SELECT id, username, role, community_id, active, last_login_at, created_at, updated_at
		FROM ${globalTable('admin_users')}
		WHERE id = {{id}}
		LIMIT 1`,
		{ id }
	);
	return rows[0] || null;
}

async function getActiveAdminPermissions(adminId) {
	const id = sqlNumber(adminId);
	if (!id) return [];
	const rows = await queryRows(
		`SELECT id, admin_id, community_id, role, permissions_json, active
		FROM ${globalTable('admin_community_permissions')}
		WHERE admin_id = {{adminId}} AND active = 1
		ORDER BY id DESC`,
		{ adminId: id }
	);
	return rows.map((item) => ({
		id: Number(item.id),
		adminId: Number(item.admin_id),
		communityId: Number(item.community_id),
		role: item.role || 'admin',
		permissions: parsePermissionsJson(item.permissions_json),
		active: Boolean(Number(item.active))
	}));
}

async function getCommunityModules(communityId) {
	const id = sqlNumber(communityId);
	if (!id) return [];
	const rows = await queryRows(
		`SELECT cm.id, cm.community_id, cm.module_key, cm.module_name, cm.enabled, cm.sort
		FROM ${globalTable('community_modules')} cm
		WHERE cm.community_id = {{communityId}}
		ORDER BY cm.sort ASC, cm.id ASC`,
		{ communityId: id }
	);
	return communityModules.buildCommunityModuleList(rows);
}

function buildAdminAccessContext(adminUser, permissions, communities, currentCommunityPermissions, currentCommunityModules) {
	const access = permissionEngine.buildEffectiveAccess(
		adminUser.role || 'admin',
		currentCommunityPermissions || []
	);
	const accessibleCommunityIds = permissionEngine.buildAccessibleCommunityIds(adminUser, permissions, communities);
	const moduleList = communityModules.buildCommunityModuleList(currentCommunityModules || []);
	return {
		admin: adminUser,
		access: Object.assign({}, access, {
			communityIds: accessibleCommunityIds,
			role: adminUser.role || 'admin',
			roleLabel: roleLabel(adminUser.role || 'admin'),
			enabledModules: moduleList.filter((item) => item.enabled).map((item) => item.key),
			moduleRecords: moduleList
		}),
		accessibleCommunityIds,
		currentCommunityPermissions: currentCommunityPermissions || [],
		currentCommunityModules: moduleList
	};
}

async function resolveAdminAccess(headers, params = {}, route = '') {
	requireAdminToken(headers);
	if (ADMIN_BOOTSTRAP_ROUTES.has(route)) return null;
	const adminUserId = readAdminUserId(headers);
	if (!adminUserId) throw new Error('请先选择当前操作员');
	const adminUser = await getAdminUserById(adminUserId);
	if (!adminUser || !Number(adminUser.active)) {
		throw new Error('当前操作员不存在或已停用');
	}
	const permissions = await getActiveAdminPermissions(adminUser.id);
	const communities = await listActiveCommunities();
	let currentCommunity = null;
	let currentCommunityPermissions = [];
	let currentCommunityModules = [];
	if (params && (params.schemaName || params.schema || params.communityId || params.communityName)) {
		currentCommunity = await resolveCommunityContext(params);
		currentCommunityPermissions = permissions.filter((item) => Number(item.communityId) === Number(currentCommunity.id));
		currentCommunityModules = await getCommunityModules(currentCommunity.id);
	}
	const context = buildAdminAccessContext(
		adminUser,
		permissions,
		communities,
		currentCommunityPermissions.flatMap((item) => item.permissions || []),
		currentCommunityModules
	);
	if (currentCommunity && !permissionEngine.hasCommunityAccess(context.access, currentCommunity.id)) {
		throw new Error('无权访问该小区');
	}
	context.currentCommunity = currentCommunity;
	context.currentCommunityPermissions = currentCommunityPermissions;
	context.currentCommunityModules = currentCommunityModules;
	return context;
}

function getRoutePermission(route) {
	return permissionEngine.getRouteRule(route);
}

function checkAdminAccess(context, route) {
	if (!context) return;
	const rule = getRoutePermission(route);
	if (!rule) return;
	if (!permissionEngine.hasModuleAccess(context.access, rule.module)) {
		throw new Error('当前角色无权访问该模块');
	}
	if (!permissionEngine.hasActionAccess(context.access, rule.action)) {
		throw new Error('当前角色无权执行该操作');
	}
}

function checkCommunityAccess(context, community) {
	if (!context || !community) return;
	if (!permissionEngine.hasCommunityAccess(context.access, community.id)) {
		throw new Error('无权访问该小区');
	}
}

function checkModuleEnabled(context, moduleKey) {
	if (!context) return;
	if (!permissionEngine.hasModuleEnabled(context.access, moduleKey)) {
		throw new Error('当前小区未启用该模块');
	}
}

async function checkCommunityModuleEnabled(community, moduleKey) {
	if (!community) return;
	const currentModules = await getCommunityModules(community.id);
	const access = {
		enabledModules: communityModules.buildEnabledModuleKeys(currentModules)
	};
	if (!permissionEngine.hasModuleEnabled(access, moduleKey)) {
		throw new Error('当前小区未启用该模块');
	}
}

function ownerDto(item) {
	return {
		id: Number(item.id),
		name: item.name || '',
		mobile: item.mobile || '',
		communityName: item.community_name || '',
		house: item.house || '',
		auditStatus: item.audit_status || 'pending',
		createdAt: item.created_at || ''
	};
}

function communityDto(item) {
	return {
		id: Number(item.id),
		code: item.code || '',
		name: item.name || '',
		schemaName: item.schemaName || '',
		address: item.address || '',
		phone: item.phone || '',
		active: Boolean(Number(item.active)),
		sort: Number(item.sort || 0),
		createdAt: item.created_at || '',
		updatedAt: item.updated_at || ''
	};
}

function roleLabel(role) {
	const found = ADMIN_ROLES.find((item) => item.value === String(role || '').trim());
	return found ? found.label : String(role || '').trim();
}

function parsePermissionsJson(value) {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? parsed : [];
		} catch (err) {
			return String(value).split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean);
		}
	}
	return [];
}

function adminUserDto(item) {
	return {
		id: Number(item.id),
		username: item.username || '',
		role: item.role || 'admin',
		roleLabel: roleLabel(item.role || 'admin'),
		communityId: item.community_id ? Number(item.community_id) : 0,
		communityName: item.community_name || '',
		active: Boolean(Number(item.active)),
		lastLoginAt: item.last_login_at || '',
		createdAt: item.created_at || '',
		updatedAt: item.updated_at || ''
	};
}

function adminPermissionDto(item) {
	return {
		id: Number(item.id),
		adminId: Number(item.admin_id),
		username: item.username || '',
		communityId: Number(item.community_id),
		communityName: item.community_name || '',
		role: item.role || 'admin',
		roleLabel: roleLabel(item.role || 'admin'),
		permissions: parsePermissionsJson(item.permissions_json),
		active: Boolean(Number(item.active)),
		createdAt: item.created_at || '',
		updatedAt: item.updated_at || ''
	};
}

async function adminDashboard(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/dashboard');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const pendingRows = await queryRows(
		`SELECT COUNT(*) AS total FROM ${tenantTable(community.schemaName, 'owners')} WHERE audit_status = 'pending'`
	);
	const communityCountRows = await queryRows(
		`SELECT COUNT(*) AS total FROM ${globalTable('communities')} WHERE active = 1`
	);
	return {
		communityName: community.name,
		schemaName: community.schemaName,
		stats: [
			{ label: '待审核业主', value: pendingRows[0] ? Number(pendingRows[0].total || 0) : 0 },
			{ label: '小区数量', value: communityCountRows[0] ? Number(communityCountRows[0].total || 0) : 0 },
			{ label: '报修工单', value: await scalarCount(community.schemaName, 'repairs') },
			{ label: '待缴账单', value: await scalarCount(community.schemaName, 'fee_bills') },
			{ label: '投诉建议', value: await scalarCount(community.schemaName, 'complaints') },
			{ label: '通知配置', value: await scalarCount(community.schemaName, 'notice_configs') }
		]
	};
}

async function adminOwnerList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/owner/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, name, mobile, community_name, house, audit_status, created_at
		FROM ${tenantTable(community.schemaName, 'owners')}
		ORDER BY FIELD(audit_status, 'pending', 'rejected', 'approved', 'disabled'), id DESC
		LIMIT 100`
	);
	return { list: rows.map(ownerDto) };
}

async function adminOwnerAudit(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/owner/audit');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const id = sqlNumber(params.id);
	const auditStatus = String(params.auditStatus || '').trim();
	if (!id) throw new Error('业主ID无效');
	if (!['pending', 'approved', 'rejected', 'disabled'].includes(auditStatus)) {
		throw new Error('审核状态无效');
	}
	await runSql(
		`UPDATE ${tenantTable(community.schemaName, 'owners')} SET audit_status = {{auditStatus}}, audit_remark = {{auditRemark}}
		WHERE id = {{id}}`,
		{ id, auditStatus, auditRemark: params.auditRemark || '' }
	);
	return { ok: true };
}

async function adminCommunityList(accessContext = null) {
	await init();
	const rows = await queryRows(
		`SELECT id, code, name, schema_name AS schemaName, address, phone, active, sort, created_at, updated_at
		FROM ${globalTable('communities')}
		ORDER BY sort ASC, id ASC`
	);
	const list = rows.map(communityDto);
	if (!accessContext) return { list };
	const allowed = new Set((accessContext.accessibleCommunityIds || []).map((item) => String(item)));
	if (!allowed.size) return { list: [] };
	return { list: list.filter((item) => allowed.has(String(item.id))) };
}

async function adminCommunitySave(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/community/save');
	}
	const id = sqlNumber(params.id);
	const code = String(params.code || '').trim();
	const name = String(params.name || '').trim();
	const rawSchemaName = String(params.schemaName || '').trim() || communitySchemaFallback(code || name);
	const schemaName = normalizeSchemaName(rawSchemaName);
	const address = String(params.address || '').trim();
	const phone = String(params.phone || '').trim();
	const sort = sqlNumber(params.sort, 100);
	const active = params.active === false || params.active === 0 || params.active === '0' ? 0 : 1;
	if (!code) throw new Error('小区编码不能为空');
	if (!name) throw new Error('小区名称不能为空');
	if (!schemaName) throw new Error('schemaName invalid');
	if (id) {
		const currentRows = await queryRows(
			`SELECT id FROM ${globalTable('communities')} WHERE id = {{id}} LIMIT 1`,
			{ id }
		);
		if (!currentRows.length) throw new Error('小区不存在');
		if (accessContext) {
			checkCommunityAccess(accessContext, { id: currentRows[0].id });
		}
	}
	if (id) {
		await runSql(
			`UPDATE ${globalTable('communities')}
			SET code = {{code}}, name = {{name}}, schema_name = {{schemaName}},
				address = {{address}}, phone = {{phone}}, active = {{active}}, sort = {{sort}}
			WHERE id = {{id}}`,
			{ id, code, name, schemaName, address, phone, active, sort }
		);
	} else {
		await runSql(
			`INSERT INTO ${globalTable('communities')} (_openid, code, name, schema_name, address, phone, active, sort)
			VALUES ({{openid}}, {{code}}, {{name}}, {{schemaName}}, {{address}}, {{phone}}, {{active}}, {{sort}})`,
			{
				openid: getOpenId(),
				code,
				name,
				schemaName,
				address,
				phone,
				active,
				sort
			}
		);
	}
	await ensureTenantSchema(schemaName);
	await ensureCommunityModuleRecords(id);
	return await adminCommunityList(accessContext);
}

async function adminCommunityDelete(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/community/delete');
	}
	const id = sqlNumber(params.id);
	if (!id) throw new Error('小区ID无效');
	if (accessContext) {
		const currentRows = await queryRows(
			`SELECT id FROM ${globalTable('communities')} WHERE id = {{id}} LIMIT 1`,
			{ id }
		);
		if (!currentRows.length) throw new Error('小区不存在');
		checkCommunityAccess(accessContext, { id: currentRows[0].id });
	}
	await runSql(
		`UPDATE ${globalTable('communities')} SET active = 0 WHERE id = {{id}}`,
		{ id }
	);
	return await adminCommunityList(accessContext);
}

async function adminCommunityModuleList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/community/module/list');
	}
	const community = await resolveCommunityContext(params);
	if (accessContext) {
		checkCommunityAccess(accessContext, community);
	}
	await ensureCommunityModuleRecords(community.id);
	const list = await getCommunityModules(community.id);
	return {
		community: communityDto(community),
		list
	};
}

async function adminCommunityModuleSave(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/community/module/save');
	}
	const community = await resolveCommunityContext(params);
	if (accessContext) {
		checkCommunityAccess(accessContext, community);
	}
	await ensureCommunityModuleRecords(community.id);
	const moduleKey = String(params.moduleKey || params.module_key || '').trim();
	if (!moduleKey) throw new Error('模块标识不能为空');
	const moduleItem = communityModules.MODULE_CATALOG.find((item) => item.key === moduleKey);
	if (!moduleItem) throw new Error('模块不存在');
	const enabled = params.enabled === false || params.enabled === 0 || params.enabled === '0' ? 0 : 1;
	await runSql(
		`INSERT INTO ${globalTable('community_modules')}
		(_openid, community_id, module_key, module_name, enabled, sort)
		VALUES ({{openid}}, {{communityId}}, {{moduleKey}}, {{moduleName}}, {{enabled}}, {{sort}})
		ON DUPLICATE KEY UPDATE module_name = VALUES(module_name), enabled = VALUES(enabled), sort = VALUES(sort)`,
		{
			openid: getOpenId(),
			communityId: sqlNumber(community.id),
			moduleKey,
			moduleName: moduleItem.name,
			enabled,
			sort: moduleItem.sort
		}
	);
	return await adminCommunityModuleList({ communityId: community.id }, accessContext);
}

async function adminCommunityModuleBatchSave(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/community/module/batch_save');
	}
	const community = await resolveCommunityContext(params);
	if (accessContext) {
		checkCommunityAccess(accessContext, community);
	}
	await ensureCommunityModuleRecords(community.id);
	const modules = Array.isArray(params.modules) ? params.modules : [];
	if (!modules.length) throw new Error('模块配置不能为空');
	for (const item of modules) {
		const moduleKey = String(item && (item.moduleKey || item.module_key) || '').trim();
		if (!moduleKey) continue;
		const moduleItem = communityModules.MODULE_CATALOG.find((next) => next.key === moduleKey);
		if (!moduleItem) continue;
		const enabled = item.enabled === false || item.enabled === 0 || item.enabled === '0' ? 0 : 1;
		await runSql(
			`INSERT INTO ${globalTable('community_modules')}
			(_openid, community_id, module_key, module_name, enabled, sort)
			VALUES ({{openid}}, {{communityId}}, {{moduleKey}}, {{moduleName}}, {{enabled}}, {{sort}})
			ON DUPLICATE KEY UPDATE module_name = VALUES(module_name), enabled = VALUES(enabled), sort = VALUES(sort)`,
			{
				openid: getOpenId(),
				communityId: sqlNumber(community.id),
				moduleKey,
				moduleName: moduleItem.name,
				enabled,
				sort: moduleItem.sort
			}
		);
	}
	return await adminCommunityModuleList({ communityId: community.id }, accessContext);
}

async function adminRoleList(accessContext = null) {
	await init();
	return {
		list: ADMIN_ROLES.map((item) => Object.assign({}, item))
	};
}

async function adminOperatorList() {
	await init();
	const rows = await queryRows(
		`SELECT u.id, u.username, u.role, u.community_id, u.active, u.last_login_at, u.created_at, u.updated_at, c.name AS community_name
		FROM ${globalTable('admin_users')} u
		LEFT JOIN ${globalTable('communities')} c ON c.id = u.community_id
		ORDER BY u.id DESC`
	);
	return {
		list: rows.filter((item) => Number(item.active)).map(adminUserDto)
	};
}

async function adminAccessProfile(params = {}, accessContext = null) {
	await init();
	if (!accessContext) {
		throw new Error('请先选择当前操作员');
	}
	const communityRows = await queryRows(
		`SELECT id, code, name, schema_name AS schemaName, address, phone, active, sort, created_at, updated_at
		FROM ${globalTable('communities')}
		ORDER BY sort ASC, id ASC`
	);
	const communities = communityRows.map(communityDto).filter((item) => {
		const allowed = new Set((accessContext.accessibleCommunityIds || []).map((next) => String(next)));
		return allowed.size ? allowed.has(String(item.id)) : false;
	});
	return {
		admin: accessContext.admin,
		access: Object.assign({}, accessContext.access, {
			communities
		}),
		communities
	};
}

async function adminUserList(accessContext = null) {
	await init();
	const rows = await queryRows(
		`SELECT id, username, role, community_id, active, last_login_at, created_at, updated_at
		FROM ${globalTable('admin_users')}
		ORDER BY id DESC`
	);
	const list = rows.map(adminUserDto);
	if (!accessContext) return { list };
	if (String(accessContext.admin && accessContext.admin.role || '') === 'super_admin') return { list };
	return {
		list: list.filter((item) => {
			const allowed = new Set((accessContext.accessibleCommunityIds || []).map((next) => String(next)));
			if (!allowed.size) return item.id === Number(accessContext.admin && accessContext.admin.id);
			return allowed.has(String(item.communityId || ''));
		})
	};
}

async function adminUserSave(params = {}, accessContext = null) {
	await init();
	if (accessContext) checkAdminAccess(accessContext, 'admin/user/save');
	const id = sqlNumber(params.id);
	const username = String(params.username || '').trim();
	const password = String(params.password || '').trim();
	const role = String(params.role || 'admin').trim();
	const communityId = params.communityId ? sqlNumber(params.communityId, 0) : null;
	const active = params.active === false || params.active === 0 || params.active === '0' ? 0 : 1;
	if (!username) throw new Error('管理员账号不能为空');
	if (!ADMIN_ROLES.some((item) => item.value === role)) throw new Error('管理员角色无效');
	if (accessContext && communityId) {
		checkCommunityAccess(accessContext, { id: communityId });
	}
	if (id) {
		if (password) {
			await runSql(
				`UPDATE ${globalTable('admin_users')}
				SET username = {{username}}, password_hash = {{passwordHash}}, role = {{role}}, community_id = {{communityId}}, active = {{active}}
				WHERE id = {{id}}`,
				{
					id,
					username,
					passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
					role,
					communityId,
					active
				}
			);
		} else {
			await runSql(
				`UPDATE ${globalTable('admin_users')}
				SET username = {{username}}, role = {{role}}, community_id = {{communityId}}, active = {{active}}
				WHERE id = {{id}}`,
				{ id, username, role, communityId, active }
			);
		}
	} else {
		if (!password) throw new Error('新增管理员需要设置密码');
		await runSql(
			`INSERT INTO ${globalTable('admin_users')}
			(_openid, username, password_hash, role, community_id, active)
			VALUES ({{openid}}, {{username}}, {{passwordHash}}, {{role}}, {{communityId}}, {{active}})`,
			{
				openid: getOpenId(),
				username,
				passwordHash: crypto.createHash('sha256').update(password).digest('hex'),
				role,
				communityId,
				active
			}
		);
	}
	return await adminUserList(accessContext);
}

async function adminUserDelete(params = {}, accessContext = null) {
	await init();
	if (accessContext) checkAdminAccess(accessContext, 'admin/user/delete');
	const id = sqlNumber(params.id);
	if (!id) throw new Error('管理员ID无效');
	if (accessContext) {
		const rows = await queryRows(
			`SELECT community_id FROM ${globalTable('admin_users')} WHERE id = {{id}} LIMIT 1`,
			{ id }
		);
		if (!rows.length) throw new Error('管理员不存在');
		checkCommunityAccess(accessContext, { id: rows[0].community_id || 0 });
	}
	await runSql(
		`UPDATE ${globalTable('admin_users')} SET active = 0 WHERE id = {{id}}`,
		{ id }
	);
	return await adminUserList(accessContext);
}

async function adminPermissionList(accessContext = null) {
	await init();
	const rows = await queryRows(
		`SELECT p.id, p.admin_id, p.community_id, p.role, p.permissions_json, p.active,
			p.created_at, p.updated_at, u.username, c.name AS community_name
		FROM ${globalTable('admin_community_permissions')} p
		LEFT JOIN ${globalTable('admin_users')} u ON u.id = p.admin_id
		LEFT JOIN ${globalTable('communities')} c ON c.id = p.community_id
		ORDER BY p.id DESC`
	);
	const list = rows.map(adminPermissionDto);
	if (!accessContext) return { list };
	const allowed = new Set((accessContext.accessibleCommunityIds || []).map((item) => String(item)));
	if (!allowed.size) return { list: [] };
	return { list: list.filter((item) => allowed.has(String(item.communityId))) };
}

async function adminPermissionSave(params = {}, accessContext = null) {
	await init();
	if (accessContext) checkAdminAccess(accessContext, 'admin/permission/save');
	const id = sqlNumber(params.id);
	const adminId = sqlNumber(params.adminId || params.admin_id);
	const communityId = sqlNumber(params.communityId || params.community_id);
	const role = String(params.role || 'admin').trim();
	const permissions = parsePermissionsJson(params.permissions || params.permissionsJson || []);
	const active = params.active === false || params.active === 0 || params.active === '0' ? 0 : 1;
	if (!adminId) throw new Error('管理员ID无效');
	if (!communityId) throw new Error('小区ID无效');
	if (!ADMIN_ROLES.some((item) => item.value === role)) throw new Error('管理员角色无效');
	if (accessContext) {
		checkCommunityAccess(accessContext, { id: communityId });
	}
	const permissionsJson = JSON.stringify(permissions);
	if (id) {
		await runSql(
			`UPDATE ${globalTable('admin_community_permissions')}
			SET admin_id = {{adminId}}, community_id = {{communityId}}, role = {{role}},
				permissions_json = {{permissionsJson}}, active = {{active}}
			WHERE id = {{id}}`,
			{ id, adminId, communityId, role, permissionsJson, active }
		);
	} else {
		await runSql(
			`INSERT INTO ${globalTable('admin_community_permissions')}
			(_openid, admin_id, community_id, role, permissions_json, active)
			VALUES ({{openid}}, {{adminId}}, {{communityId}}, {{role}}, {{permissionsJson}}, {{active}})
			ON DUPLICATE KEY UPDATE role = VALUES(role), permissions_json = VALUES(permissions_json), active = VALUES(active)`,
			{
				openid: getOpenId(),
				adminId,
				communityId,
				role,
				permissionsJson,
				active
			}
		);
	}
	return await adminPermissionList(accessContext);
}

async function adminPermissionDelete(params = {}, accessContext = null) {
	await init();
	if (accessContext) checkAdminAccess(accessContext, 'admin/permission/delete');
	const id = sqlNumber(params.id);
	if (!id) throw new Error('权限记录ID无效');
	if (accessContext) {
		const rows = await queryRows(
			`SELECT community_id FROM ${globalTable('admin_community_permissions')} WHERE id = {{id}} LIMIT 1`,
			{ id }
		);
		if (!rows.length) throw new Error('权限记录不存在');
		checkCommunityAccess(accessContext, { id: rows[0].community_id || 0 });
	}
	await runSql(
		`DELETE FROM ${globalTable('admin_community_permissions')} WHERE id = {{id}}`,
		{ id }
	);
	return await adminPermissionList(accessContext);
}

async function writeAdminAuditLog({ accessContext = null, route = '', params = {}, status = 'success', message = '', community = null } = {}) {
	if (!accessContext) return;
	const rule = getRoutePermission(route) || {};
	const record = adminAudit.buildAuditRecord({
		adminUser: accessContext.admin,
		community: community || accessContext.currentCommunity || null,
		route,
		rule,
		status,
		message,
		params
	});
	await runSql(
		`INSERT INTO ${globalTable('admin_audit_logs')}
		(_openid, admin_id, username, role, community_id, community_name, route, module_key, action_key, status, message, params_json)
		VALUES ({{_openid}}, {{admin_id}}, {{username}}, {{role}}, {{community_id}}, {{community_name}}, {{route}}, {{module_key}}, {{action_key}}, {{status}}, {{message}}, {{params_json}})`,
		record
	);
}

async function adminAuditList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/audit/list');
	}
	const rows = await queryRows(
		`SELECT l.id, l.admin_id, l.username, l.role, l.community_id, l.community_name, l.route, l.module_key, l.action_key, l.status, l.message, l.params_json, l.created_at
		FROM ${globalTable('admin_audit_logs')} l
		ORDER BY l.id DESC
		LIMIT 100`
	);
	const list = rows.map((item) => ({
		id: Number(item.id),
		adminId: item.admin_id != null ? Number(item.admin_id) : 0,
		username: item.username || '',
		role: item.role || 'admin',
		roleLabel: roleLabel(item.role || 'admin'),
		communityId: item.community_id != null ? Number(item.community_id) : 0,
		communityName: item.community_name || '',
		route: item.route || '',
		moduleKey: item.module_key || '',
		actionKey: item.action_key || '',
		status: item.status || 'success',
		message: item.message || '',
		params: (() => {
			try {
				const parsed = item.params_json ? JSON.parse(item.params_json) : {};
				return parsed && typeof parsed === 'object' ? parsed : {};
			} catch (err) {
				return {};
			}
		})(),
		createdAt: item.created_at || ''
	}));
	if (!accessContext) return { list };
	if (String(accessContext.admin && accessContext.admin.role || '') === 'super_admin') return { list };
	const allowed = new Set((accessContext.accessibleCommunityIds || []).map((item) => String(item)));
	if (!allowed.size) return { list: list.filter((item) => !item.communityId || item.adminId === Number(accessContext.admin && accessContext.admin.id)) };
	return { list: list.filter((item) => !item.communityId || allowed.has(String(item.communityId))) };
}

async function adminRepairList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/repair/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, title, type, contact, phone, status, assignee
		FROM ${tenantTable(community.schemaName, 'repairs')}
		ORDER BY id DESC
		LIMIT 100`
	);
	return { list: rows };
}

async function adminFeeList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/fee/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, bill_no AS billNo, owner_name AS ownerName, house, bill_type AS billType, amount, status
		FROM ${tenantTable(community.schemaName, 'fee_bills')}
		ORDER BY id DESC
		LIMIT 100`
	);
	return { list: rows };
}

async function adminComplaintList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/complaint/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, title, contact, phone, status, assignee
		FROM ${tenantTable(community.schemaName, 'complaints')}
		ORDER BY id DESC
		LIMIT 100`
	);
	return { list: rows };
}

async function adminNoticeConfigList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/notice_config/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, scene, channel, template_name AS templateName, enabled, robot_name AS robotName
		FROM ${tenantTable(community.schemaName, 'notice_configs')}
		ORDER BY id DESC
		LIMIT 100`
	);
	return { list: rows.map((item) => Object.assign({}, item, { enabled: Boolean(Number(item.enabled)) })) };
}

async function adminAnnouncementList(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/announcement/list');
	}
	const community = await resolveCommunityContext(params);
	checkCommunityAccess(accessContext, community);
	const rows = await queryRows(
		`SELECT id, title, summary, content, cover_url, is_pinned, status, sort, publish_at, created_at, updated_at
		FROM ${tenantTable(community.schemaName, 'announcements')}
		ORDER BY is_pinned DESC, sort ASC, id DESC
		LIMIT 100`
	);
	return { list: rows.map(announcementDto) };
}

async function adminAnnouncementSave(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/announcement/save');
	}
	const community = await resolveCommunityContext(params);
	const id = sqlNumber(params.id);
	const title = String(params.title || '').trim();
	const summary = String(params.summary || '').trim();
	const content = String(params.content || '').trim();
	const coverUrl = String(params.coverUrl || params.cover_url || '').trim();
	const status = String(params.status || 'published').trim();
	const sort = sqlNumber(params.sort, 0);
	const isPinned = params.isPinned ? 1 : 0;
	if (!title) throw new Error('公告标题不能为空');
	if (!['draft', 'published', 'archived'].includes(status)) throw new Error('公告状态无效');
	if (id) {
		await runSql(
			`UPDATE ${tenantTable(community.schemaName, 'announcements')}
			SET title = {{title}}, summary = {{summary}}, content = {{content}},
				cover_url = {{coverUrl}}, is_pinned = {{isPinned}}, status = {{status}}, sort = {{sort}}
			WHERE id = {{id}}`,
			{ id, title, summary, content, coverUrl, isPinned, status, sort }
		);
	} else {
		await runSql(
			`INSERT INTO ${tenantTable(community.schemaName, 'announcements')}
			(_openid, openid, community_id, community_name, title, summary, content, cover_url, is_pinned, status, sort, publish_at)
			VALUES ({{openid}}, {{openid}}, {{communityId}}, {{communityName}}, {{title}}, {{summary}}, {{content}},
				{{coverUrl}}, {{isPinned}}, {{status}}, {{sort}}, NOW())`,
			{
				openid: getOpenId(),
				communityId: sqlNumber(community.id),
				communityName: community.name,
				title,
				summary,
				content,
				coverUrl,
				isPinned,
				status,
				sort
			}
		);
	}
	return await adminAnnouncementList(params);
}

async function adminAnnouncementDelete(params = {}, accessContext = null) {
	await init();
	if (accessContext) {
		checkAdminAccess(accessContext, 'admin/announcement/delete');
	}
	const community = await resolveCommunityContext(params);
	const id = sqlNumber(params.id);
	if (!id) throw new Error('公告ID无效');
	await runSql(
		`DELETE FROM ${tenantTable(community.schemaName, 'announcements')} WHERE id = {{id}}`,
		{ id }
	);
	return { ok: true };
}

exports.main = async (event) => {
	const normalized = normalizeHttpEvent(event);
	const route = normalized.route || '';
	const params = normalized.params || {};
	if (normalized.isHttp && event.httpMethod === 'OPTIONS') {
		return response({ code: 0, msg: 'ok', data: {} }, true);
	}
	try {
		const routeRule = getRoutePermission(route);
		let data;
		if (route === 'bootstrap/init') data = await init();
		else if (route === 'bootstrap/communities') data = await communities();
		else if (route === 'bootstrap/profile') data = await profile(params);
		else if (route === 'bootstrap/send_code') data = await sendCode(params);
		else if (route === 'bootstrap/login_submit') data = await loginSubmit(params);
		else if (route === 'bootstrap/auth_submit') data = await submitAuth(params);
		else if (route === 'bootstrap/owner_submit') data = await submitAuth(params);
		else if (route === 'bootstrap/home') data = await home(params);
		else if (routeRule && !MODULE_CHECK_EXEMPT_ROUTES.has(route) && !route.startsWith('admin/')) {
			const community = await resolveCommunityContext(params, { openid: getOpenId() });
			await checkCommunityModuleEnabled(community, routeRule.module);
			if (route === 'user/community_switch') data = await switchCommunity(params);
			else if (route === 'user/house_bind') data = await bindHouse(params);
			else if (route === 'user/house_unbind') data = await unbindHouse(params);
			else if (route === 'repair/list') data = await repairList(params);
			else if (route === 'repair/create') data = await repairCreate(params);
			else return response({ code: 404, msg: `route not found: ${route}` }, normalized.isHttp);
		}
		else if (route.startsWith('admin/')) {
			let adminAccess = null;
			try {
				adminAccess = await resolveAdminAccess(normalized.headers, params, route);
				if (adminAccess && routeRule && !MODULE_CHECK_EXEMPT_ROUTES.has(route)) {
					checkModuleEnabled(adminAccess, routeRule.module);
				}
				if (route === 'admin/dashboard') data = await adminDashboard(params, adminAccess);
				else if (route === 'admin/owner/list') data = await adminOwnerList(params, adminAccess);
				else if (route === 'admin/owner/audit') data = await adminOwnerAudit(params, adminAccess);
				else if (route === 'admin/access/operators') data = await adminOperatorList();
				else if (route === 'admin/community/list') data = await adminCommunityList(adminAccess);
				else if (route === 'admin/community/save') data = await adminCommunitySave(params, adminAccess);
				else if (route === 'admin/community/delete') data = await adminCommunityDelete(params, adminAccess);
				else if (route === 'admin/community/module/list') data = await adminCommunityModuleList(params, adminAccess);
				else if (route === 'admin/community/module/save') data = await adminCommunityModuleSave(params, adminAccess);
				else if (route === 'admin/community/module/batch_save') data = await adminCommunityModuleBatchSave(params, adminAccess);
				else if (route === 'admin/role/list') data = await adminRoleList(adminAccess);
				else if (route === 'admin/access/profile') data = await adminAccessProfile(params, adminAccess);
				else if (route === 'admin/user/list') data = await adminUserList(adminAccess);
				else if (route === 'admin/user/save') data = await adminUserSave(params, adminAccess);
				else if (route === 'admin/user/delete') data = await adminUserDelete(params, adminAccess);
				else if (route === 'admin/permission/list') data = await adminPermissionList(adminAccess);
				else if (route === 'admin/permission/save') data = await adminPermissionSave(params, adminAccess);
				else if (route === 'admin/permission/delete') data = await adminPermissionDelete(params, adminAccess);
				else if (route === 'admin/audit/list') data = await adminAuditList(params, adminAccess);
				else if (route === 'admin/repair/list') data = await adminRepairList(params, adminAccess);
				else if (route === 'admin/fee/list') data = await adminFeeList(params, adminAccess);
				else if (route === 'admin/complaint/list') data = await adminComplaintList(params, adminAccess);
				else if (route === 'admin/notice_config/list') data = await adminNoticeConfigList(params, adminAccess);
				else if (route === 'admin/announcement/list') data = await adminAnnouncementList(params, adminAccess);
				else if (route === 'admin/announcement/save') data = await adminAnnouncementSave(params, adminAccess);
				else if (route === 'admin/announcement/delete') data = await adminAnnouncementDelete(params, adminAccess);
				else return response({ code: 404, msg: `route not found: ${route}` }, normalized.isHttp);
				if (adminAccess) {
					try {
						await writeAdminAuditLog({
							accessContext: adminAccess,
							route,
							params,
							status: 'success',
							community: adminAccess.currentCommunity || null
						});
					} catch (auditErr) {
						console.error('[sxmini] audit log error', auditErr);
					}
				}
			} catch (err) {
				if (adminAccess) {
					try {
						await writeAdminAuditLog({
							accessContext: adminAccess,
							route,
							params,
							status: 'failed',
							message: err && err.message ? err.message : 'cloud error',
							community: adminAccess.currentCommunity || null
						});
					} catch (auditErr) {
						console.error('[sxmini] audit log error', auditErr);
					}
				}
				throw err;
			}
		}
		else return response({ code: 404, msg: `route not found: ${route}` }, normalized.isHttp);
		return response({ code: 0, msg: 'ok', data }, normalized.isHttp);
	} catch (err) {
		console.error('[sxmini] error', err);
		return response({ code: 500, msg: err && err.message ? err.message : 'cloud error' }, normalized.isHttp);
	}
};
