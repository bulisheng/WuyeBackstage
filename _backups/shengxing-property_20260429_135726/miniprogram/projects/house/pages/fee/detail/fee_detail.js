const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		detail: null
	},
	async onLoad(options) {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		this.id = options.id || '';
		await this._loadDetail();
	},
	async _loadDetail() {
		if (!this.id) return;
		let detail = await cloudHelper.callCloudData('fee/detail', { id: this.id }, { title: 'bar' });
		this.setData({ detail });
	},
	async pay() {
		if (!this.id) return;
		const payRes = await cloudHelper.callCloudSumbit('fee/pay', { id: this.id }, { title: '支付中' });
		const payTicket = payRes && payRes.data ? payRes.data : payRes;
		if (payTicket && payTicket.bizType) {
			await cloudHelper.callCloudSumbit('payment/callback', Object.assign({}, payTicket, {
				status: 1,
				payload: Object.assign({}, payTicket.payload || {}, {
					communityName: payTicket.payload && payTicket.payload.communityName ? payTicket.payload.communityName : '',
					userName: PassportBiz.getUserName ? PassportBiz.getUserName() : ''
				})
			}), { title: '支付中' });
		}
		wx.navigateTo({ url: '../success/fee_success' });
	}
})
