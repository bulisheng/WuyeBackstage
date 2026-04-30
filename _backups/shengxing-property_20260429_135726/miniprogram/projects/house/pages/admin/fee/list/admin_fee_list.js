const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');

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

	async bindBatchTap() {
		wx.navigateTo({
			url: '../batch/admin_fee_batch'
		});
	},

	async bindRemindOverdueTap() {
		await cloudHelper.callCloudSumbit('admin/fee_remind_overdue', {
			search: this.data.search || '',
			method: '批量催缴',
			result: '已发送'
		}, { title: '批量催缴中' });
		wx.showToast({ title: '催缴任务已提交', icon: 'none' });
	},

	async bindExportTap() {
		await cloudHelper.callCloudSumbit('admin/fee_data_export', {
			condition: this.data.dataList && this.data.dataList.condition ? this.data.dataList.condition : ''
		}, { title: '生成导出文件中' });
		const data = await cloudHelper.callCloudData('admin/fee_data_get', { isDel: 0 }, { title: '加载导出文件' });
		if (data && data.url) {
			wx.setClipboardData({ data: data.url });
			wx.showToast({ title: '导出链接已复制', icon: 'none' });
		}
	},

	async _getSearchMenu() {
		let sortItems1 = [
			{ label: '排序', type: '', value: '' },
			{ label: '时间正序', type: 'sort', value: 'FEE_ADD_TIME|asc' },
			{ label: '时间倒序', type: 'sort', value: 'FEE_ADD_TIME|desc' }
		];

		let sortMenus = [
			{ label: '全部', type: '', value: '' },
			{ label: '待缴费', type: 'status', value: '0' },
			{ label: '已缴费', type: 'status', value: '1' },
			{ label: '已退款', type: 'status', value: '4' },
			{ label: '已作废', type: 'status', value: '9' },
		];

		this.setData({
			search: '',
			sortItems: [sortItems1],
			sortMenus,
			isLoad: true
		});
	}
});
