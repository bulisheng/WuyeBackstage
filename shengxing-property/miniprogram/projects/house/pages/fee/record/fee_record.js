const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		records: []
	},
	async onLoad() {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		let data = await cloudHelper.callCloudData('fee/my_list', { status: 1 }, { title: 'bar' });
		let records = [];
		if (data && data.list) {
			records = data.list.map(item => {
				let obj = item.FEE_OBJ || {};
				return {
					type: item.FEE_TITLE || obj.billType || '账单',
					amount: obj.amount || '0.00',
					time: obj.payTime || item.FEE_ADD_TIME || ''
				};
			});
		}
		this.setData({ records });
	}
})
