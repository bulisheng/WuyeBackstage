const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, saveAuthFromProfile, clearAuthState } = require('../../../../../utils/auth.js');
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
		user: {
			name: '未认证住户',
			status: '待登录'
		},
		statusCode: 'none',
		isLoggedIn: false,
		isOwnerAuthed: false,
		currentCommunity: null,
		authForm: {
			name: '',
			house: ''
		},
		houseInput: '',
		houses: [],
		menus: [
			'我的报修',
			'我的缴费',
			'我的投诉',
			'我的活动'
		],
		adminMenus: [
			{ title: '后台首页', desc: '查看总览与待办', type: 'admin-home' },
			{ title: '报修管理', desc: '处理工单流转', type: 'admin-repair' },
			{ title: '通知配置', desc: '后续接模板与机器人', type: 'admin-notice' }
		]
	},

	async onShow() {
		await this.loadCommunities();
		await this.refreshProfile();
	},

	applyProfile(data) {
		const communities = this.data.communities || [];
		const currentCommunity = data.currentCommunity || null;
		const isLoggedIn = !!(data.isLoggedIn || data.isAuthed);
		const isOwnerAuthed = !!(data.isAuthed && data.statusCode === 'approved');
		this.setData({
			user: data.user || this.data.user,
			statusCode: data.statusCode || 'pending',
			isLoggedIn,
			isOwnerAuthed,
			currentCommunity,
			houses: data.houses || [],
			authForm: isOwnerAuthed ? { name: '', house: '' } : (this.data.authForm || { name: '', house: '' })
		});
	},

	async loadCommunities() {
		try {
			const res = await callCloud('bootstrap/communities');
			const communities = communityOptions(res.result.data.list);
			this.setData({
				communities
			});
		} catch (err) {
			console.error('[SXWY-CORE] communities load failed', err);
			const communities = communityOptions();
			this.setData({ communities });
		}
	},

	async refreshProfile() {
		try {
			const cached = getAuthState();
			if (cached && cached.token && (cached.isAuthed || cached.isLoggedIn)) {
				this.applyProfile(cached);
			}
			const res = await callCloud('bootstrap/profile');
			if (!res.result.data.isAuthed && !res.result.data.isLoggedIn) {
				this.setData({
					user: {
						name: '未认证住户',
						status: '待登录'
					},
					statusCode: 'none',
					isLoggedIn: false,
					isOwnerAuthed: false,
					currentCommunity: null,
					houseInput: '',
					houses: []
				});
				return;
			}
			saveAuthFromProfile(res.result.data);
			this.applyProfile(res.result.data);
		} catch (err) {
			console.error('[SXWY-CORE] profile load failed', err);
		}
	},

	auth() {
		wx.navigateTo({ url: '/projects/house/pages/auth/index/auth_index' });
	},

	logout() {
		clearAuthState();
		wx.reLaunch({ url: '/projects/house/pages/auth/index/auth_index' });
	},

	bindAuthInput(e) {
		const key = e.currentTarget.dataset.key;
		this.setData({ [`authForm.${key}`]: e.detail.value });
	},

	bindHouseInput(e) {
		this.setData({ houseInput: e.detail.value });
	},

	async bindHouse() {
		const house = this.data.houseInput.trim();
		if (!house) {
			wx.showToast({ title: '请输入房屋信息', icon: 'none' });
			return;
		}
		try {
			const res = await callCloud('user/house_bind', { house });
			saveAuthFromProfile(res.result.data);
			this.applyProfile(res.result.data);
			this.setData({ houseInput: '' });
			wx.showToast({ title: '房屋已绑定', icon: 'success' });
		} catch (err) {
			console.error('[SXWY-CORE] house bind failed', err);
			wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
		}
	},

	async submitOwnerAuth() {
		if (!this.data.isLoggedIn && !this.data.isOwnerAuthed) {
			wx.showToast({ title: '请先登录', icon: 'none' });
			return;
		}
		const community = this.data.currentCommunity;
		const name = String(this.data.authForm.name || '').trim();
		const house = String(this.data.authForm.house || '').trim();
		if (!community) {
			wx.showToast({ title: '当前小区不存在，请重新登录', icon: 'none' });
			return;
		}
		if (!name || !house) {
			wx.showToast({ title: '请补全姓名和房号', icon: 'none' });
			return;
		}
		try {
			const res = await callCloud('bootstrap/owner_submit', {
				name,
				house,
				communityId: community.id,
				communityName: community.name,
				schemaName: community.schemaName
			});
			saveAuthFromProfile(res.result.data);
			this.applyProfile(res.result.data);
			wx.showToast({ title: '已提交业主认证', icon: 'success' });
		} catch (err) {
			console.error('[SXWY-CORE] owner submit failed', err);
			wx.showToast({ title: err.message || '提交失败', icon: 'none' });
		}
	},

	openAdmin() {
		wx.navigateTo({ url: '/projects/house/pages/admin/index/admin_index' });
	}
});
