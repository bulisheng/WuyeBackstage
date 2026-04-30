const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile, isOwnerAuthed } = require('../../../../../utils/auth.js');

Page({
	data: {
		blocked: false,
		bills: [],
		billDetail: null,
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
			const billingRes = await callCloud('user/billing/list');
			this.setData({
				blocked: false,
				bills: Array.isArray(billingRes.result.data.list) ? billingRes.result.data.list : []
			});
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
	},

	async openBill(e) {
		const billId = Number(e.currentTarget.dataset.id || 0);
		if (!billId) return;
		try {
			const res = await callCloud('user/billing/detail', { id: billId });
			const bill = res.result.data.bill || {};
			const lines = [
				`账单号：${bill.billNo || '-'}`,
				`类型：${bill.billType || '-'}`,
				`金额：${bill.amount || 0}`,
				`状态：${bill.status || '-'}`,
				`截止：${bill.dueDate || '-'}`,
				`明细：${(res.result.data.items || []).length} 项`
			];
			this.setData({ billDetail: bill });
			wx.showModal({
				title: bill.title || '账单详情',
				content: lines.join('\n'),
				showCancel: false
			});
		} catch (err) {
			wx.showToast({ title: '账单详情加载失败', icon: 'none' });
		}
	},

	async payBill(e) {
		e && e.stopPropagation && e.stopPropagation();
		const billId = Number(e.currentTarget.dataset.id || 0);
		if (!billId) return;
		try {
			wx.showLoading({ title: '支付中' });
			await callCloud('user/billing/pay', { id: billId, channel: 'wechat' });
			wx.hideLoading();
			wx.showToast({ title: '支付成功', icon: 'success' });
			await this.onShow();
		} catch (err) {
			wx.hideLoading();
			wx.showToast({ title: err.message || '支付失败', icon: 'none' });
		}
	}
});
