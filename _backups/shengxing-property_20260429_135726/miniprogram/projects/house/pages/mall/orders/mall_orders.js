const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		orders: []
	},
	async onLoad() {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		let data = await cloudHelper.callCloudData('mall/order_list', {}, { title: 'bar' });
		let orders = [];
		if (data && data.list) {
			orders = data.list.map((item, idx) => {
				let obj = item.ORDER_OBJ || {};
				return {
					no: obj.orderNo || ('ORD' + idx),
					name: item.ORDER_TITLE || obj.goodsName || '商品订单',
					price: obj.price || '',
					status: obj.statusText || obj.orderStatus || (item.ORDER_STATUS === 1 ? '已支付' : '待处理'),
					pic: obj.cover || '../../../images/home/cute_1.jpg'
				};
			});
		}
		this.setData({ orders });
	}
})
