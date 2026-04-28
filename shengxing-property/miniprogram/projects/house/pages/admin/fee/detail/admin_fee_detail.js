const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '待缴费',
	1: '已缴费',
	9: '已作废'
};

Page({
	data: {
		isLoad: false,
		detail: null,
		objItems: [],
		formItems: [],
		edit: {
			title: '',
			desc: '',
			houseName: '',
			billType: '',
			amount: '',
			dueDate: '',
			status: 0
		},
		reminder: {
			method: '钉钉提醒',
			result: '已发送',
			assigneeName: '',
			assigneePhone: ''
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
		let detail = await cloudHelper.callCloudData('admin/fee_detail', { id: this.data.id }, { title: 'bar' });
		if (!detail) {
			this.setData({ isLoad: null });
			return;
		}
		let obj = detail.FEE_OBJ || {};
		let formItems = (detail.FEE_FORMS || []).map(item => ({
			title: item.title || item.mark || '字段',
			value: Array.isArray(item.val) ? item.val.join(', ') : (item.val === true ? '是' : item.val === false ? '否' : (item.val || ''))
		}));
		let objItems = Object.keys(obj).map(key => ({
			key,
			value: Array.isArray(obj[key]) ? obj[key].join(', ') : String(obj[key])
		}));
		detail.statusText = STATUS_TEXT[detail.FEE_STATUS] || '未知';
		detail.FEE_ADD_TIME = detail.FEE_ADD_TIME ? timeUtil.timestamp2Time(detail.FEE_ADD_TIME, 'Y-M-D h:m') : '';
		detail.FEE_EDIT_TIME = detail.FEE_EDIT_TIME ? timeUtil.timestamp2Time(detail.FEE_EDIT_TIME, 'Y-M-D h:m') : '';
		this.setData({
			isLoad: true,
			detail,
			objItems,
			formItems,
			edit: {
				title: detail.FEE_TITLE || '',
				desc: detail.FEE_DESC || '',
				houseName: obj.houseName || '',
				billType: obj.billType || '',
				amount: obj.amount || '',
				dueDate: obj.dueDate || '',
				status: detail.FEE_STATUS || 0
			},
			reminder: {
				method: '钉钉提醒',
				result: '已发送',
				assigneeName: '',
				assigneePhone: ''
			}
		});
	},

	async bindStatusTap(e) {
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/fee_status', {
			id: this.data.detail._id,
			status
		}, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		this.setData({ 'edit.status': status });
		await this._loadDetail();
	},

	bindInput(e) {
		const field = e.currentTarget.dataset.field;
		const group = e.currentTarget.dataset.group || 'edit';
		this.setData({ [`${group}.${field}`]: e.detail.value });
	},

	async bindSaveTap() {
		const edit = this.data.edit || {};
		await cloudHelper.callCloudSumbit('admin/fee_save', {
			id: this.data.detail._id,
			title: edit.title,
			desc: edit.desc,
			houseName: edit.houseName,
			billType: edit.billType,
			amount: edit.amount,
			dueDate: edit.dueDate,
			status: Number(edit.status || 0)
		}, { title: '保存中' });
		wx.showToast({ title: '账单已保存', icon: 'success' });
		await this._loadDetail();
	},

	async bindRemindTap() {
		const reminder = this.data.reminder || {};
		await cloudHelper.callCloudSumbit('admin/fee_remind', {
			id: this.data.detail._id,
			communityName: (this.data.detail.FEE_OBJ && this.data.detail.FEE_OBJ.communityName) || '',
			method: reminder.method,
			result: reminder.result,
			assigneeName: reminder.assigneeName,
			assigneePhone: reminder.assigneePhone
		}, { title: '催缴中' });
		wx.showToast({ title: '催缴已记录', icon: 'success' });
		await this._loadDetail();
	},

	url(e) {
		pageHelper.url(e, this);
	}
});
