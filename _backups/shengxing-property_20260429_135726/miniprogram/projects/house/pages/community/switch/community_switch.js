const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		communities: []
	},
	async onLoad() {
		await PassportBiz.loginSilence(this);
		let data = await cloudHelper.callCloudData('community/list', {}, { title: 'bar' });
		let currentName = wx.getStorageSync('CURRENT_COMMUNITY') || '';
		let communities = [];
		if (data && data.list) {
			communities = data.list.map((item, idx) => {
				let obj = item.COMMUNITY_OBJ || {};
				return {
					id: item._id,
					name: item.COMMUNITY_TITLE || obj.address || '小区 ' + (idx + 1),
					current: currentName ? currentName === (item.COMMUNITY_TITLE || obj.address || '') : !!obj.current
				};
			});
		}
		this.setData({ communities });
	},
	selectCommunity(e) {
		const index = e.currentTarget.dataset.index;
		const communities = this.data.communities.map((item, idx) => {
			return {
				...item,
				current: idx === index
			}
		});
		this.setData({ communities });
		wx.setStorageSync('CURRENT_COMMUNITY', communities[index].name);
		wx.showToast({ title: '已切换', icon: 'success' });
	},
	addCommunity() {
		wx.navigateTo({ url: '../../my/edit/my_edit' });
	}
})
