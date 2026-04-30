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

[
	'CREATE TABLE IF NOT EXISTS `rzb`.`fee_bills`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`complaints`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`service_orders`',
	'CREATE TABLE IF NOT EXISTS `rzb`.`notice_configs`'
].forEach((value) => assertIncludes('database/mysql/schema.sql', value));

[
	'报修管理',
	'缴费管理',
	'投诉建议',
	'通知配置',
	'activeTab === \'repairs\'',
	'activeTab === \'fees\'',
	'activeTab === \'complaints\'',
	'activeTab === \'notices\''
].forEach((value) => assertIncludes('web-admin/src/App.vue', value));

[
	'repairList',
	'feeList',
	'complaintList',
	'noticeConfigList'
].forEach((value) => assertIncludes('web-admin/src/api/admin.js', value));

[
	'selectedSchema',
	'communityLabel',
	'onSchemaChange'
].forEach((value) => assertIncludes('web-admin/src/App.vue', value));

console.log('admin modules verified');
