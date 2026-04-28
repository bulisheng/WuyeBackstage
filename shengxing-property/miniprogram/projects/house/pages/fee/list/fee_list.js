const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		tab: 'todo',
		bills: [],
		paid: []
	},
	async onLoad() {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		await this._loadList();
	},
	async _loadList() {
		let todo = await cloudHelper.callCloudData('fee/list', { status: 0 }, { title: 'bar' });
		let paid = await cloudHelper.callCloudData('fee/list', { status: 1 }, { title: 'bar' });
		this.setData({
			bills: this._fmtList(todo),
			paid: this._fmtList(paid)
		});
	},
	_fmtList(data) {
		if (!data || !data.list) return [];
		return data.list.map(item => {
			let obj = item.FEE_OBJ || {};
			return {
				id: item._id,
				type: item.FEE_TITLE || obj.billType || '账单',
				amount: obj.amount || '0.00',
				due: obj.dueDate || '',
				time: obj.payTime || '',
				overdue: item.FEE_STATUS === 0
			};
		});
	},
	setTab(e) {
		this.setData({ tab: e.currentTarget.dataset.tab });
	},
	goDetail(e) {
		let id = e.currentTarget.dataset.id;
		wx.navigateTo({ url: '../detail/fee_detail?id=' + id });
	},
	goRecord() {
		wx.navigateTo({ url: '../record/fee_record' });
	}
})
