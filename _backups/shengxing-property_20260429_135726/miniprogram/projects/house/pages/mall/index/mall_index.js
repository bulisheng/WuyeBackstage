const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		cates: ['推荐', '生鲜食品', '米面粮油', '个护清洁'],
		goods: []
	},
	async onLoad() {
		await PassportBiz.loginSilence(this);
		let data = await cloudHelper.callCloudData('mall/list', {}, { title: 'bar' });
		let goods = [];
		if (data && data.list) {
			goods = data.list.map(item => {
				let obj = item.MALL_OBJ || {};
				return {
					id: item._id,
					name: item.MALL_TITLE || '商品',
					price: obj.price || '0.00',
					sales: obj.sales || 0,
					pic: obj.cover || '../../../images/home/cute_1.jpg'
				};
			});
		}
		this.setData({ goods });
	},
	goDetail(e) {
		let id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: '../detail/mall_detail?id=' + id });
	},
	goOrders() {
		wx.navigateTo({ url: '../orders/mall_orders' });
	}
})
