const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile } = require('../../../../../utils/auth.js');
const setting = require('../../../public/project_setting.js');

function communityOptions(list) {
	const source = Array.isArray(list) && list.length ? list : setting.COMMUNITY_OPTIONS;
	return (source || []).map((item) => ({
		id: item.id || item.code || item._id || item.name,
		name: item.name,
		code: item.code || item.id || '',
		schemaName: item.schemaName || ''
	})).filter((item) => item.id && item.name);
}

Page({
	data: {
		communities: communityOptions(),
		communityNames: communityOptions().map((item) => item.name),
		communityIndex: 0,
		selectedCommunityName: communityOptions()[0] ? communityOptions()[0].name : '请选择小区',
		loadingCommunities: false,
		form: {
			mobile: '',
			code: ''
		},
		submitting: false,
		sendingCode: false,
		countdown: 0,
		debugCode: ''
	},

	goMyCenter() {
		wx.switchTab({ url: '/projects/house/pages/my/index/my_index' });
	},

	async onLoad() {
		const cached = getAuthState();
		if (cached && cached.token && (cached.isAuthed || cached.isLoggedIn)) {
			const title = cached.isAuthed
				? (cached.statusCode === 'approved' ? '已认证' : '待后台认证')
				: '已登录';
			wx.showToast({ title, icon: 'none' });
			setTimeout(() => this.goMyCenter(), 300);
			return;
		}

		try {
			const res = await callCloud('bootstrap/profile');
			if (res.result.data.isAuthed || res.result.data.isLoggedIn) {
				saveAuthFromProfile(res.result.data);
				wx.showToast({
					title: res.result.data.isAuthed
						? (res.result.data.statusCode === 'approved' ? '已认证' : '待后台认证')
						: '已登录',
					icon: 'none'
				});
				setTimeout(() => this.goMyCenter(), 300);
				return;
			}
		} catch (err) {
			console.error('[SXWY-CORE] profile check failed', err);
		}

		await this.loadCommunities();
	},

	async loadCommunities() {
		this.setData({ loadingCommunities: true });
		try {
			const res = await callCloud('bootstrap/communities');
			const communities = communityOptions(res.result.data.list);
			this.setData({
				communities,
				communityNames: communities.map((item) => item.name),
				communityIndex: communities.length ? 0 : -1,
				selectedCommunityName: communities.length ? communities[0].name : '请选择小区'
			});
		} catch (err) {
			console.error('[SXWY-CORE] load communities failed', err);
			const communities = communityOptions();
			this.setData({
				communities,
				communityNames: communities.map((item) => item.name),
				communityIndex: communities.length ? 0 : -1,
				selectedCommunityName: communities.length ? communities[0].name : '请选择小区'
			});
			if (!communities.length) {
				wx.showToast({ title: '社区加载失败', icon: 'none' });
			}
		} finally {
			this.setData({ loadingCommunities: false });
		}
	},

	bindInput(e) {
		const key = e.currentTarget.dataset.key;
		this.setData({ [`form.${key}`]: e.detail.value });
	},

	bindCommunityChange(e) {
		const communityIndex = Number(e.detail.value || 0);
		const community = this.data.communities[communityIndex];
		this.setData({
			communityIndex,
			selectedCommunityName: community ? community.name : '请选择小区'
		});
	},

	async sendCode() {
		if (this.data.sendingCode || this.data.countdown > 0) return;
		const mobile = this.data.form.mobile.trim();
		const community = this.data.communities[this.data.communityIndex];
		if (!mobile) {
			wx.showToast({ title: '先输入手机号', icon: 'none' });
			return;
		}

		this.setData({ sendingCode: true });
		try {
			const res = await callCloud('bootstrap/send_code', {
				mobile,
				communityId: community && community.id,
				communityName: community && community.name,
				schemaName: community && community.schemaName
			});
			const debugCode = res.result.data.debugCode || '';
			this.setData({ debugCode });
			wx.showModal({
				title: '验证码已生成',
				content: debugCode ? `测试验证码：${debugCode}` : '验证码已发送',
				showCancel: false
			});
			this.startCountdown(60);
		} catch (err) {
			console.error('[SXWY-CORE] send code failed', err);
			wx.showToast({ title: err.message || '发送失败', icon: 'none' });
		} finally {
			this.setData({ sendingCode: false });
		}
	},

	startCountdown(seconds) {
		this._timer && clearInterval(this._timer);
		this.setData({ countdown: seconds });
		this._timer = setInterval(() => {
			const next = this.data.countdown - 1;
			if (next <= 0) {
				clearInterval(this._timer);
				this._timer = null;
				this.setData({ countdown: 0 });
				return;
			}
			this.setData({ countdown: next });
		}, 1000);
	},

	async submit() {
		const form = this.data.form;
		const community = this.data.communities[this.data.communityIndex];
		if (!community) {
			wx.showToast({ title: '请选择小区', icon: 'none' });
			return;
		}
		if (!form.mobile || !form.code) {
			wx.showToast({ title: '请补全手机号和验证码', icon: 'none' });
			return;
		}

		this.setData({ submitting: true });
		try {
			const res = await callCloud('bootstrap/login_submit', Object.assign({}, form, {
				communityId: community.id,
				communityName: community.name,
				schemaName: community.schemaName
			}));
			const data = res.result.data;
			saveAuthFromProfile(data);
			wx.showToast({
				title: '已登录',
				icon: 'success'
			});
			setTimeout(() => this.goMyCenter(), 400);
		} catch (err) {
			console.error('[SXWY-CORE] auth submit failed', err);
			wx.showToast({ title: err.message || '提交失败', icon: 'none' });
		} finally {
			this.setData({ submitting: false });
		}
	}
});
