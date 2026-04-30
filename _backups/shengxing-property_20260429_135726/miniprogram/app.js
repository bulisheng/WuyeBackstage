const setting = require('./setting/setting.js');

App({
	onLaunch: function (options) {
		console.log('[SXWY] app launch');

		this.globalData = {};

		// 用于自定义导航栏
		const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
		this.globalData.statusBar = windowInfo.statusBarHeight;

		let capsule = wx.getMenuButtonBoundingClientRect();
		if (capsule) {
			this.globalData.custom = capsule;
			this.globalData.customBar = capsule.bottom + capsule.top - windowInfo.statusBarHeight;
		} else {
			this.globalData.customBar = windowInfo.statusBarHeight + 50;
		}
	}, 
	 
})
