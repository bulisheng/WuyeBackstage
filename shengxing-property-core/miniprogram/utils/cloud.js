const setting = require('../setting/setting.js');
const { getAuthState } = require('./auth.js');
const { buildCommunityRequestParams } = require('./community.js');

function callCloud(route, params = {}) {
	const state = getAuthState() || {};
	const nextParams = buildCommunityRequestParams(params, state);
	if (state.token && !nextParams.token) {
		nextParams.token = state.token;
	}
	return wx.cloud.callFunction({
		name: setting.CLOUD_FUNCTION_NAME || 'sxmini',
		data: {
			route,
			params: nextParams
		}
	}).then((res) => {
		if (res && res.result && typeof res.result.code === 'number' && res.result.code !== 0) {
			const err = new Error(res.result.msg || 'cloud error');
			err.result = res.result;
			throw err;
		}
		return res;
	});
}

module.exports = {
	callCloud
};
