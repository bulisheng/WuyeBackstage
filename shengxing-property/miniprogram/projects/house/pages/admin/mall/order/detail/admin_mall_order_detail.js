const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '待支付',
	1: '已支付',
	2: '已发货',
	3: '已完成',
	9: '已关闭'
};

Page({
	data: {
		isLoad: false,
		detail: null,
		objItems: [],
		formItems: []
	},

	async onLoad(options) {
		if (!AdminBiz.isAdmin(this)) return;
		if (!pageHelper.getOptions(this, options)) return;
		await this._loadDetail();
	},

	async onPullDownRefresh() {
		await this._loadDetail();
		wx.stopPullDownRefresh();
	},

	async _loadDetail() {
		let detail = await cloudHelper.callCloudData('admin/order_detail', { id: this.data.id }, { title: 'bar' });
		if (!detail) {
			this.setData({ isLoad: null });
			return;
		}
		let obj = detail.ORDER_OBJ || {};
		let objItems = Object.keys(obj).map(key => ({ key, value: Array.isArray(obj[key]) ? obj[key].join(', ') : String(obj[key]) }));
		let formItems = (detail.ORDER_FORMS || []).map(item => ({ title: item.title || item.mark || '字段', value: Array.isArray(item.val) ? item.val.join(', ') : String(item.val || '') }));
		detail.statusText = STATUS_TEXT[detail.ORDER_STATUS] || '未知';
		detail.ORDER_ADD_TIME = detail.ORDER_ADD_TIME ? timeUtil.timestamp2Time(detail.ORDER_ADD_TIME, 'Y-M-D h:m') : '';
		detail.ORDER_EDIT_TIME = detail.ORDER_EDIT_TIME ? timeUtil.timestamp2Time(detail.ORDER_EDIT_TIME, 'Y-M-D h:m') : '';
		this.setData({ isLoad: true, detail, objItems, formItems });
	},

	async bindStatusTap(e) {
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/order_status', { id: this.data.detail._id, status }, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		await this._loadDetail();
	},

	url(e) { pageHelper.url(e, this); }
});
