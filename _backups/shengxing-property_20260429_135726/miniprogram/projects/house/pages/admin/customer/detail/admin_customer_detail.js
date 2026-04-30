const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '待回复',
	1: '已回复',
	2: '已关闭',
	9: '已归档'
};

Page({
	data: {
		isLoad: false,
		detail: null,
		objItems: [],
		formItems: [],
		edit: {
			assigneeName: '',
			assigneePhone: '',
			replyContent: ''
		}
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
		let detail = await cloudHelper.callCloudData('admin/customer_detail', { id: this.data.id }, { title: 'bar' });
		if (!detail) {
			this.setData({ isLoad: null });
			return;
		}
		let obj = detail.TICKET_OBJ || {};
		let objItems = Object.keys(obj).map(key => ({ key, value: Array.isArray(obj[key]) ? obj[key].join(', ') : String(obj[key]) }));
		let formItems = (detail.TICKET_FORMS || []).map(item => ({ title: item.title || item.mark || '字段', value: Array.isArray(item.val) ? item.val.join(', ') : String(item.val || '') }));
		detail.statusText = STATUS_TEXT[detail.TICKET_STATUS] || '未知';
		detail.TICKET_ADD_TIME = detail.TICKET_ADD_TIME ? timeUtil.timestamp2Time(detail.TICKET_ADD_TIME, 'Y-M-D h:m') : '';
		detail.TICKET_EDIT_TIME = detail.TICKET_EDIT_TIME ? timeUtil.timestamp2Time(detail.TICKET_EDIT_TIME, 'Y-M-D h:m') : '';
		this.setData({
			isLoad: true,
			detail,
			objItems,
			formItems,
			edit: {
				assigneeName: obj.assigneeName || '',
				assigneePhone: obj.assigneePhone || '',
				replyContent: obj.replyContent || ''
			}
		});
	},

	async bindStatusTap(e) {
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/customer_status', { id: this.data.detail._id, status }, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		await this._loadDetail();
	},

	bindInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({ [`edit.${field}`]: e.detail.value });
	},

	async bindAssignTap() {
		await cloudHelper.callCloudSumbit('admin/customer_assign', {
			id: this.data.detail._id,
			assigneeName: this.data.edit.assigneeName,
			assigneePhone: this.data.edit.assigneePhone
		}, { title: '分配中' });
		wx.showToast({ title: '已分配', icon: 'success' });
		await this._loadDetail();
	},

	async bindReplyTap() {
		await cloudHelper.callCloudSumbit('admin/customer_reply', {
			id: this.data.detail._id,
			replyContent: this.data.edit.replyContent,
			replyBy: this.data.edit.assigneeName || ''
		}, { title: '回复中' });
		wx.showToast({ title: '已回复', icon: 'success' });
		await this._loadDetail();
	},

	url(e) { pageHelper.url(e, this); }
});
