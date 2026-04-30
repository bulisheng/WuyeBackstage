const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile, isOwnerAuthed } = require('../../../../../utils/auth.js');

Page({
	data: {
		blocked: false,
		form: {
			title: '',
			type: '公共维修',
			house: '',
			contact: '',
			phone: '',
			desc: ''
		},
		list: [],
		loading: false
	},

	async onLoad() {
		const ok = await this.guardAuth();
		if (!ok) return;
		try {
			await callCloud('bootstrap/init');
		} catch (err) {
			console.error('[SXWY-CORE] repair init failed', err);
		}
		await this.reload();
	},

	async onShow() {
		await this.guardAuth();
	},

	async onPullDownRefresh() {
		await this.reload();
		wx.stopPullDownRefresh();
	},

	bindInput(e) {
		const key = e.currentTarget.dataset.key;
		this.setData({ [`form.${key}`]: e.detail.value });
	},

	async submit() {
		if (this.data.blocked) {
			wx.showToast({ title: '需要认证业主', icon: 'none' });
			return;
		}
		const form = this.data.form;
		if (!form.title || !form.desc) {
			wx.showToast({ title: '请先填写标题和说明', icon: 'none' });
			return;
		}
		this.setData({ loading: true });
		try {
			await callCloud('repair/create', form);
			wx.showToast({ title: '已提交', icon: 'success' });
			this.setData({
				form: { title: '', type: '公共维修', house: '', contact: '', phone: '', desc: '' }
			});
			await this.reload();
		} catch (err) {
			console.error('[SXWY-CORE] repair submit failed', err);
			wx.showToast({ title: err.message || '提交失败', icon: 'none' });
		} finally {
			this.setData({ loading: false });
		}
	},

	async reload() {
		if (this.data.blocked) return;
		try {
			const res = await callCloud('repair/list');
			this.setData({ list: res.result.data.list || [] });
		} catch (err) {
			console.error('[SXWY-CORE] repair list failed', err);
		}
	},

	async guardAuth() {
		const cached = getAuthState();
		const ownerAuthed = isOwnerAuthed();
		if (!ownerAuthed) {
			this.setData({ blocked: true });
			if (cached && cached.token) {
				wx.showToast({ title: '需要认证业主', icon: 'none' });
			}
			return false;
		}
		try {
			const res = await callCloud('bootstrap/profile');
			const profile = res.result.data || {};
			if (!profile.isAuthed || profile.statusCode !== 'approved') {
				this.setData({ blocked: true });
				wx.showToast({ title: '需要认证业主', icon: 'none' });
				return false;
			}
			saveAuthFromProfile(profile);
			this.setData({ blocked: false });
			return true;
		} catch (err) {
			console.error('[SXWY-CORE] repair auth guard failed', err);
		}
		return false;
	}
});
