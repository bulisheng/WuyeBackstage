const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '待支付',
	1: '已支付',
	2: '已发货',
	3: '已完成',
	4: '已退款',
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
		this.setData({
			isLoad: true,
			detail,
			objItems,
			formItems,
			edit: {
				shippingNo: obj.shippingNo || '',
				shippingCompany: obj.shippingCompany || '',
				reason: obj.refundReason || '',
				amount: obj.price || '',
				userName: obj.userName || '',
				productNames: obj.goodsName || detail.ORDER_TITLE || '',
				communityName: obj.communityName || ''
			}
		});
	},

	async bindStatusTap(e) {
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/order_status', { id: this.data.detail._id, status }, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		await this._loadDetail();
	},

	bindInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({ [`edit.${field}`]: e.detail.value });
	},

	async bindShipTap() {
		const edit = this.data.edit || {};
		await cloudHelper.callCloudSumbit('admin/order_ship', {
			id: this.data.detail._id,
			shippingNo: edit.shippingNo,
			shippingCompany: edit.shippingCompany,
			userName: edit.userName,
			productNames: edit.productNames,
			communityName: edit.communityName
		}, { title: '发货中' });
		wx.showToast({ title: '已发货', icon: 'success' });
		await this._loadDetail();
	},

	async bindRefundTap() {
		const edit = this.data.edit || {};
		await cloudHelper.callCloudSumbit('admin/order_refund', {
			id: this.data.detail._id,
			reason: edit.reason || '人工退款',
			amount: edit.amount,
			userName: edit.userName,
			productNames: edit.productNames,
			communityName: edit.communityName
		}, { title: '退款中' });
		wx.showToast({ title: '已退款', icon: 'success' });
		await this._loadDetail();
	},

	url(e) { pageHelper.url(e, this); }
});
