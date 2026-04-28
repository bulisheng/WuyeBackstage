const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		qty: 1,
		goods: null
	},
	async onLoad(options) {
		await PassportBiz.loginSilence(this);
		this.id = options.id || '';
		if (this.id) {
			let goods = await cloudHelper.callCloudData('mall/detail', { id: this.id }, { title: 'bar' });
			this.setData({ goods });
		}
	},
	minus() {
		if (this.data.qty > 1) this.setData({ qty: this.data.qty - 1 });
	},
	plus() {
		this.setData({ qty: this.data.qty + 1 });
	},
	async buy() {
		if (!PassportBiz.isLogin()) {
			return PassportBiz.loginMustBackWin(this);
		}
		if (!this.id) return;
		let order = await cloudHelper.callCloudSumbit('mall/order_insert', {
			id: this.id,
			title: this.data.goods ? this.data.goods.MALL_TITLE : '商品订单',
			desc: '数量：' + this.data.qty,
			forms: [
				{ mark: 'goodsId', type: 'text', val: this.id },
				{ mark: 'qty', type: 'number', val: this.data.qty },
				{ mark: 'goodsName', type: 'text', val: this.data.goods ? this.data.goods.MALL_TITLE : '' },
				{ mark: 'price', type: 'text', val: this.data.goods && this.data.goods.MALL_OBJ ? this.data.goods.MALL_OBJ.price : '' },
				{ mark: 'cover', type: 'image', val: this.data.goods && this.data.goods.MALL_OBJ ? this.data.goods.MALL_OBJ.cover : '' }
			]
		}, { title: '下单中' });
		const orderId = order && order.data && order.data.id ? order.data.id : '';
		const payTicket = order && order.data && order.data.payment ? order.data.payment : null;
		if (orderId && payTicket && payTicket.bizType) {
			await cloudHelper.callCloudSumbit('payment/callback', Object.assign({}, payTicket, {
				status: 1,
				payload: Object.assign({}, payTicket.payload || {}, {
					userName: PassportBiz.getUserName(),
					productNames: this.data.goods ? this.data.goods.MALL_TITLE : '',
					communityName: ''
				})
			}), { title: '支付中' });
		}
		wx.navigateTo({ url: '../orders/mall_orders' });
	}
})
