const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
	return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assertIncludes(file, value) {
	const text = read(file);
	if (!text.includes(value)) {
		throw new Error(`${file} missing "${value}"`);
	}
}

function assertNotIncludes(file, value) {
	const text = read(file);
	if (text.includes(value)) {
		throw new Error(`${file} must not include "${value}"`);
	}
}

[
	'admin/dashboard',
	'admin/owner/list',
	'admin/owner/audit',
	'admin/community/list',
	'admin/repair/list',
	'admin/fee/list',
	'admin/complaint/list',
	'admin/notice_config/list',
	'normalizeHttpEvent',
	'requireAdmin',
	'ADMIN_API_TOKEN',
	'resolveCommunityContext',
	'tenantTable',
	'schemaName',
	'UPDATE ${tenantTable(community.schemaName, \'owners\')}'
].forEach((value) => assertIncludes('cloudfunctions/sxmini/index.js', value));

[
	'VITE_ADMIN_API_BASE',
	'https://cloudbase-d9g78eneac709f5a5.service.tcloudbase.com/sxmini',
	'fetch(API_BASE',
	'X-SXWY-ADMIN-TOKEN',
	'sxwy_admin_token',
	'sxwy_admin_schema',
	'setSchemaName',
	'getSchemaName'
].forEach((value) => assertIncludes('web-admin/src/api/admin.js', value));

[
	'mockOwners',
	'mockCommunities',
	'function mock(',
	'张先生',
	'李女士'
].forEach((value) => assertNotIncludes('web-admin/src/api/admin.js', value));

console.log('web-admin live API verified');
