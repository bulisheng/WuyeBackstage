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
	"user/community_switch",
	"user/house_bind",
	"user/house_unbind",
	"statusCode",
	"currentCommunity",
	"schemaName",
	"至少保留一套房屋"
].forEach((value) => assertIncludes('cloudfunctions/sxmini/index.js', value));

[
	"bindCommunityChange",
	"bindHouse",
	"unbindHouse",
	"refreshProfile",
	"currentCommunity",
	"COMMUNITY_OPTIONS",
	"selectedCommunityName",
	"communityNames",
	"schemaName"
].forEach((value) => assertIncludes('miniprogram/projects/house/pages/my/index/my_index.js', value));

[
	"小区切换",
	"绑定房屋",
	"解绑",
	"认证状态",
	"{{selectedCommunityName}}"
].forEach((value) => assertIncludes('miniprogram/projects/house/pages/my/index/my_index.wxml', value));

[
	"已驳回，可重新提交",
	"待后台认证",
	"selectedCommunityName",
	"COMMUNITY_OPTIONS",
	"communityNames",
	"schemaName"
].forEach((value) => assertIncludes('miniprogram/projects/house/pages/auth/index/auth_index.js', value));

console.log('mini owner profile verified');
