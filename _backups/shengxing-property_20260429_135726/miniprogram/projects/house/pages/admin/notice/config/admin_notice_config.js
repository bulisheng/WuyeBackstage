const AdminBiz = require('../../../../../../../comm/biz/admin_biz.js');
const cloudHelper = require('../../../../../../../helper/cloud_helper.js');

const SCENES = [
	{ code: 'repair.created', title: '报修通知', desc: '用户提交报修后通知' },
	{ code: 'repair.assigned', title: '报修分配', desc: '报修分配处理人后通知' },
	{ code: 'repair.closed', title: '报修办结', desc: '报修办结后通知' },
	{ code: 'fee.paid', title: '缴费成功', desc: '用户缴费后通知' },
	{ code: 'fee.refunded', title: '账单退款', desc: '账单退款后通知' },
	{ code: 'fee.reminder', title: '账单催缴', desc: '账单催缴记录通知' },
	{ code: 'complaint.created', title: '投诉建议', desc: '用户提交投诉后通知' },
	{ code: 'complaint.assigned', title: '投诉分配', desc: '投诉分配负责人后通知' },
	{ code: 'complaint.replied', title: '投诉回复', desc: '投诉回复完成后通知' },
	{ code: 'service.created', title: '物业服务', desc: '用户提交服务申请后通知' },
	{ code: 'mall.orderCreated', title: '商城下单', desc: '用户下单后通知' },
	{ code: 'mall.orderPaid', title: '订单支付', desc: '订单支付完成后通知' },
	{ code: 'mall.orderShipped', title: '订单发货', desc: '订单发货后通知' },
	{ code: 'mall.orderRefunded', title: '订单退款', desc: '订单退款后通知' },
	{ code: 'customer.transferRequested', title: '转人工客服', desc: '用户转人工后通知' },
	{ code: 'customer.assigned', title: '客服分配', desc: '客服工单分配后通知' },
	{ code: 'customer.replied', title: '客服回复', desc: '客服工单回复后通知' }
];

Page({
	data: {
		currentCommunity: '幸福里小区',
		configs: [],
		logs: [],
		sceneList: SCENES,
		loading: false
	},

	async onLoad() {
		if (!AdminBiz.isAdmin(this)) return;
		this.setData({
			currentCommunity: wx.getStorageSync('CURRENT_COMMUNITY') || this.data.currentCommunity
		});
		await this._loadDetail();
	},

	async _loadDetail() {
		this.setData({ loading: true });
		try {
			let configs = await cloudHelper.callCloudData('admin/notice_list', {}, { title: 'bar' });
			let logs = await cloudHelper.callCloudData('admin/notice_log_list', {}, { title: 'bar' });
			configs = (configs && configs.list) ? configs.list : [];
			logs = (logs && logs.list) ? logs.list : [];
			let merged = SCENES.map(scene => {
				let hit = configs.find(item => item.NOTICE_CODE === scene.code) || {};
				let obj = hit.NOTICE_OBJ || {};
				return {
					code: scene.code,
					title: scene.title,
					desc: scene.desc,
					enabled: hit.NOTICE_STATUS === 1,
					webhook: obj.webhook || '',
					secret: obj.secret || '',
					miniTemplateId: obj.miniTemplateId || '',
					page: obj.page || '',
					atMobiles: Array.isArray(obj.atMobiles) ? obj.atMobiles.join(',') : (obj.atMobiles || ''),
				};
			});
			this.setData({
				configs: merged,
				logs: logs || []
			});
		} finally {
			this.setData({ loading: false });
		}
	},

	switchRobot(e) {
		const index = e.currentTarget.dataset.index;
		const key = `configs[${index}].enabled`;
		this.setData({ [key]: e.detail.value });
		this._saveByIndex(index);
	},

	bindInput(e) {
		const index = e.currentTarget.dataset.index;
		const field = e.currentTarget.dataset.field;
		const key = `configs[${index}].${field}`;
		this.setData({ [key]: e.detail.value });
	},

	async _saveByIndex(index) {
		const cfg = this.data.configs[index];
		if (!cfg) return;
		await cloudHelper.callCloudSumbit('admin/notice_save', {
			code: cfg.code,
			title: cfg.title,
			desc: cfg.desc,
			status: cfg.enabled ? 1 : 0,
			obj: {
				webhook: cfg.webhook || '',
				secret: cfg.secret || '',
				miniTemplateId: cfg.miniTemplateId || '',
				page: cfg.page || '',
				atMobiles: (cfg.atMobiles || '').split(',').map(s => s.trim()).filter(Boolean),
				channel: cfg.webhook ? 'webhook' : 'log'
			}
		}, { title: '保存中' });
		wx.showToast({ title: '已保存', icon: 'success' });
	},

	async saveConfig(e) {
		const index = e.currentTarget.dataset.index;
		await this._saveByIndex(index);
	},

	async testSend(e) {
		const index = e.currentTarget.dataset.index;
		const cfg = this.data.configs[index];
		if (!cfg) return;
		await cloudHelper.callCloudSumbit('admin/notice_send_test', {
			scene: cfg.code,
			payload: {
				communityName: this.data.currentCommunity,
				houseName: '1栋2单元1201',
				userName: '测试用户',
				phone: '13800000000',
				content: cfg.title + '测试消息',
				type: cfg.title,
				billType: '物业费',
				amount: '280.00',
				dueDate: '2024-05-20',
				payTime: '2024-05-18 09:30',
				serviceType: '快递代寄',
				productNames: '五常大米 5kg',
				number: '1',
				createTime: '2024-05-18 09:30'
			}
		}, { title: '发送中' });
		wx.showToast({
			title: `${cfg.title}测试已提交`,
			icon: 'none'
		});
		await this._loadDetail();
	}
});
