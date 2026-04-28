Page({
	backHome() {
		wx.switchTab({ url: '/projects/house/pages/default/index/default_index' });
	},
	detail() {
		wx.navigateTo({ url: '../record/fee_record' });
	}
})
