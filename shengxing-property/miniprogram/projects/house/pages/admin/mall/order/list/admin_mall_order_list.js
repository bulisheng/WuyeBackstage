const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');

Page({
	data: {},
	async onLoad() {
		if (!AdminBiz.isAdmin(this)) return;
		await this._getSearchMenu();
	},
	url(e) { pageHelper.url(e, this); },
	bindCommListCmpt(e) { pageHelper.commListListener(this, e); },
	async _getSearchMenu() {
		let sortItems1 = [
			{ label: '排序', type: '', value: '' },
			{ label: '时间正序', type: 'sort', value: 'ORDER_ADD_TIME|asc' },
			{ label: '时间倒序', type: 'sort', value: 'ORDER_ADD_TIME|desc' }
		];
		let sortMenus = [
			{ label: '全部', type: '', value: '' },
			{ label: '待支付', type: 'status', value: '0' },
			{ label: '已支付', type: 'status', value: '1' },
			{ label: '已发货', type: 'status', value: '2' },
			{ label: '已完成', type: 'status', value: '3' },
			{ label: '已关闭', type: 'status', value: '9' },
		];
		this.setData({ search: '', sortItems: [sortItems1], sortMenus, isLoad: true });
	}
});
