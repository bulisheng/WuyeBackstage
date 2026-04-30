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
	"@cloudbase/node-sdk",
	"models.$runSQL",
	"GLOBAL_SCHEMA",
	"tenantTable",
	"resolveCommunityContext",
	"schemaName",
	"INSERT INTO ${globalTable('communities')}",
	"tenantTable(schema, table)",
	"migrateCommunityData"
].forEach((value) => assertIncludes('cloudfunctions/sxmini/index.js', value));

[
	"house_user",
	"house_community",
	"house_auth_code",
	"db.collection('house_user')",
	"db.collection('house_community')"
].forEach((value) => assertNotIncludes('cloudfunctions/sxmini/index.js', value));

[
	'"@cloudbase/node-sdk"',
	'"wx-server-sdk"'
].forEach((value) => assertIncludes('cloudfunctions/sxmini/package.json', value));

assertIncludes('database/mysql/schema.sql', 'CREATE SCHEMA IF NOT EXISTS `rzb`');
assertIncludes('database/mysql/schema.sql', 'CREATE TABLE IF NOT EXISTS `rzb`.`owner_houses`');
assertIncludes('database/mysql/schema.sql', 'UNIQUE KEY uk_owner_houses_owner_house');

console.log('single MySQL source verified');
