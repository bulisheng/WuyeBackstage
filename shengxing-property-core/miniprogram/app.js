const setting = require('./setting/setting.js');
const { callCloud } = require('./utils/cloud.js');
const { getAuthState } = require('./utils/auth.js');

App({
	onLaunch() {
		console.log('[SXWY-CORE] app launch');

		if (wx.cloud) {
			const cloudConfig = {
				traceUser: true
			};
			if (setting.CLOUD_ID) cloudConfig.env = setting.CLOUD_ID;
			wx.cloud.init(cloudConfig);
		}

		this.globalData = {
			appName: setting.APP_NAME
		};

		this.bootstrapInit();
		this.ensureLoginGate();
	},

	async bootstrapInit() {
		if (this._bootstrapInitDone) return;
		this._bootstrapInitDone = true;
		try {
			await callCloud('bootstrap/init');
			console.log('[SXWY-CORE] bootstrap init ok');
		} catch (err) {
			this._bootstrapInitDone = false;
			console.error('[SXWY-CORE] bootstrap init failed', err);
		}
	},

	ensureLoginGate() {
		setTimeout(() => {
			const state = getAuthState();
			if (state && state.token) return;
			const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
			const current = pages[pages.length - 1];
			if (current && current.route === 'projects/house/pages/auth/index/auth_index') return;
			wx.reLaunch({ url: '/projects/house/pages/auth/index/auth_index' });
		}, 0);
	}
});
