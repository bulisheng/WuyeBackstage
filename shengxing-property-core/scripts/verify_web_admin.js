const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function assertFile(relativePath) {
	const fullPath = path.join(root, relativePath);
	if (!fs.existsSync(fullPath)) {
		throw new Error(`missing file: ${relativePath}`);
	}
	return fs.readFileSync(fullPath, 'utf8');
}

function assertIncludes(text, value, file) {
	if (!text.includes(value)) {
		throw new Error(`${file} missing "${value}"`);
	}
}

const packageJson = JSON.parse(assertFile('web-admin/package.json'));
if (packageJson.scripts.build !== 'vite build') {
	throw new Error('web-admin/package.json must define vite build script');
}

const schema = assertFile('database/mysql/schema.sql');
[
	'schema_name VARCHAR(64)',
	'CREATE SCHEMA IF NOT EXISTS `rzb`',
	'CREATE SCHEMA IF NOT EXISTS `oljd`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`owners`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`fee_bills`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`notice_configs`',
	'CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`admin_users`'
].forEach((table) => assertIncludes(schema, table, 'database/mysql/schema.sql'));

const appConfig = assertFile('cloudbaserc.json');
assertIncludes(appConfig, '"serviceName": "sxwy-admin"', 'cloudbaserc.json');
assertIncludes(appConfig, '"framework": "vite"', 'cloudbaserc.json');

const viteConfig = assertFile('web-admin/vite.config.js');
assertIncludes(viteConfig, '@vitejs/plugin-vue', 'web-admin/vite.config.js');

const appVue = assertFile('web-admin/src/App.vue');
assertIncludes(appVue, '业主认证审核', 'web-admin/src/App.vue');
assertIncludes(appVue, '小区配置', 'web-admin/src/App.vue');
assertIncludes(appVue, '当前小区', 'web-admin/src/App.vue');
assertIncludes(appVue, 'schema-switch', 'web-admin/src/App.vue');

console.log('web-admin scaffold verified');
