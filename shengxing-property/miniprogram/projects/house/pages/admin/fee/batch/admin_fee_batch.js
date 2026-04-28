const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../../helper/page_helper.js');

Page({
	data: {
		batchText: [
			'物业费一期|1栋1单元101|物业费|280.00|2026-05-20|2026年5月物业费',
			'停车费一期|1栋1单元101|停车费|120.00|2026-05-20|地下车位月租'
		].join('\n')
	},

	async onLoad() {
		if (!AdminBiz.isAdmin(this)) return;
	},

	bindInput(e) {
		this.setData({
			batchText: e.detail.value
		});
	},

	async bindSubmitTap() {
		let lines = (this.data.batchText || '')
			.split(/\n+/)
			.map(item => item.trim())
			.filter(Boolean);
		let items = lines.map(line => {
			let parts = line.split('|').map(item => item.trim());
			return {
				title: parts[0] || '',
				houseName: parts[1] || '',
				billType: parts[2] || '',
				amount: parts[3] || '',
				dueDate: parts[4] || '',
				desc: parts[5] || ''
			};
		}).filter(item => item.title && item.houseName);
		if (!items.length) {
			return pageHelper.showModal('请至少填写一行有效账单');
		}
		await cloudHelper.callCloudSumbit('admin/fee_batch_save', { items }, { title: '批量保存中' });
		wx.showToast({ title: '批量账单已提交', icon: 'success' });
	},

	async bindRemindTap() {
		await cloudHelper.callCloudSumbit('admin/fee_remind_overdue', {
			method: '批量催缴',
			result: '已发送'
		}, { title: '催缴中' });
		wx.showToast({ title: '批量催缴已提交', icon: 'success' });
	}
});
