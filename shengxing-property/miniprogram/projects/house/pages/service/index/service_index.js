const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		services: []
	},
	async onLoad() {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		let services = await cloudHelper.callCloudData('service/list', {}, { title: 'bar' });
		if (Array.isArray(services) && services.length > 0) {
			services = services.map((item, idx) => ({
				title: item.title || item.TITLE || '物业服务',
				desc: item.desc || item.DESC || '',
				pic: idx % 2 === 0 ? '../../../images/home/cute_3.jpg' : '../../../images/home/cute_4.jpg'
			}));
		} else {
			services = [
				{ title: '快递代寄', desc: '上门取件，便民代办', pic: '../../../images/home/cute_3.jpg' },
				{ title: '药品代取', desc: '按需代取，快速送达', pic: '../../../images/home/cute_4.jpg' },
			];
		}
		this.setData({ services });
	},
	async book(e) {
		if (!PassportBiz.isLogin()) {
			if (!await PassportBiz.loginMustBackWin(this)) return;
		}
		let title = e.currentTarget.dataset.name || '物业服务';
		await cloudHelper.callCloudSumbit('service/insert', {
			title,
			desc: title,
			forms: [
				{ mark: 'serviceType', type: 'text', val: title },
				{ mark: 'desc', type: 'textarea', val: title }
			]
		}, { title: '提交中' });
		wx.showToast({ title: '已预约', icon: 'success' });
	}
})
