const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile, isOwnerAuthed } = require('../../../../../utils/auth.js');

Page({
	data: {
		blocked: false,
		menus: [
			{ title: '生活缴费', desc: '账单、支付、记录', color: 'fee' },
			{ title: '业主投票', desc: '投票、统计、结果公示', color: 'vote' },
			{ title: '社区活动', desc: '报名与签到', color: 'activity' },
			{ title: '商城严选', desc: '商品与订单', color: 'mall' },
			{ title: '在线客服', desc: 'FAQ 与人工工单', color: 'customer' },
			{ title: '便民服务', desc: '代寄、代取、预约', color: 'service' }
		]
	},

	async onShow() {
		try {
			const cached = getAuthState();
			const ownerAuthed = isOwnerAuthed();
			this.setData({ blocked: !ownerAuthed });
			if (!ownerAuthed) {
				if (cached && cached.token) {
					wx.showToast({ title: '需要认证业主', icon: 'none' });
				}
				return;
			}
			const res = await callCloud('bootstrap/profile');
			const profile = res.result.data || {};
			if (!profile.isAuthed || profile.statusCode !== 'approved') {
				this.setData({ blocked: true });
				wx.showToast({ title: '需要认证业主', icon: 'none' });
				return;
			}
			saveAuthFromProfile(profile);
			this.setData({ blocked: false });
		} catch (err) {
			console.error('[SXWY-CORE] life auth guard failed', err);
		}
	},

	openModule() {
		if (this.data.blocked) {
			wx.showToast({ title: '需要认证业主', icon: 'none' });
			return;
		}
		wx.showToast({ title: '功能暂未开放', icon: 'none' });
	}
});
