const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');

Page({
	data: {},

	async onLoad() {
		if (!AdminBiz.isAdmin(this)) return;
		await this._getSearchMenu();
	},

	url(e) {
		pageHelper.url(e, this);
	},

	bindCommListCmpt(e) {
		pageHelper.commListListener(this, e);
	},

	bindAddTap() {
		wx.navigateTo({
			url: '../detail/admin_mall_goods_detail'
		});
	},

	async _getSearchMenu() {
		let sortItems1 = [
			{ label: '排序', type: '', value: '' },
			{ label: '时间正序', type: 'sort', value: 'MALL_ADD_TIME|asc' },
			{ label: '时间倒序', type: 'sort', value: 'MALL_ADD_TIME|desc' }
		];
		let sortMenus = [
			{ label: '全部', type: '', value: '' },
			{ label: '上架', type: 'status', value: '1' },
			{ label: '下架', type: 'status', value: '0' },
			{ label: '停用', type: 'status', value: '9' }
		];
		this.setData({
			search: '',
			sortItems: [sortItems1],
			sortMenus,
			isLoad: true
		});
	}
});
