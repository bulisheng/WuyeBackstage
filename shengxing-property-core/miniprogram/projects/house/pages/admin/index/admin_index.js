const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile } = require('../../../../../utils/auth.js');

Page({
	data: {
		communityName: '管理后台',
		stats: [
			{ label: '待办工单', value: 0 },
			{ label: '待发通知', value: 0 },
			{ label: '已认证住户', value: 0 },
			{ label: '异常告警', value: 0 }
		],
		modules: [
			{ title: '报修管理', desc: '工单受理、派单、处理、回访', type: 'repair' },
			{ title: '缴费管理', desc: '账单、核销、欠费提醒', type: 'fee' },
			{ title: '投诉建议', desc: '提交、处理、归档', type: 'complaint' },
			{ title: '通知配置', desc: '模板、机器人、发送日志', type: 'notice' },
			{ title: '商城管理', desc: '商品、订单、库存', type: 'mall' },
			{ title: '系统设置', desc: '小区、角色、权限', type: 'system' }
		],
		todos: [
			'工单待处理 0',
			'通知待发送 0',
			'支付回调待核对 0',
			'异常日志待查看 0'
		]
	},

	async onShow() {
		const cached = getAuthState();
		if (!cached || !cached.isAuthed || !cached.token) {
			wx.navigateTo({ url: '/projects/house/pages/auth/index/auth_index' });
			return;
		}

		try {
			const res = await callCloud('bootstrap/profile');
			if (res.result.data.isAuthed) {
				saveAuthFromProfile(res.result.data);
			}
		} catch (err) {
			console.error('[SXWY-CORE] admin profile load failed', err);
		}

		try {
			await callCloud('bootstrap/init');
			const home = await callCloud('bootstrap/home');
			this.setData({
				communityName: home.result.data.communityName || this.data.communityName,
				stats: [
					{ label: '报修工单', value: home.result.data.stats[0]?.value || 0 },
					{ label: '通知记录', value: home.result.data.stats[1]?.value || 0 },
					{ label: '认证业主', value: home.result.data.stats[2]?.value || 0 },
					{ label: '待处理事项', value: home.result.data.stats[3]?.value || 0 }
				]
			});
		} catch (err) {
			console.error('[SXWY-CORE] admin bootstrap failed', err);
		}
	},

	openModule(e) {
		const type = e.currentTarget.dataset.type;
		wx.showToast({
			title: `暂未开放：${type}`,
			icon: 'none'
		});
	}
});
