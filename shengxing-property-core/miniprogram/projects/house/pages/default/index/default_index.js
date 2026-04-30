const { callCloud } = require('../../../../../utils/cloud.js');
const { getAuthState, isOwnerAuthed } = require('../../../../../utils/auth.js');
const { getCommunityDisplayName } = require('../../../../../utils/community.js');
const { buildHomeEntryGroups } = require('../../../../../utils/modules.js');
const setting = require('../../../public/project_setting.js');

function makeBannerStyle(coverUrl) {
	if (coverUrl) {
		return `background-image: linear-gradient(90deg, rgba(12, 120, 61, 0.82), rgba(12, 120, 61, 0.25)), url(${coverUrl});`;
	}
	return 'background-image: linear-gradient(135deg, #dff4e7 0%, #c7e9d1 42%, #e8f8ee 100%);';
}

Page({
	data: {
		communityName: getCommunityDisplayName(getAuthState(), setting.COMMUNITY_NAME),
		isOwnerAuthed: false,
		searchText: '搜索服务、公告、活动',
		bannerStyle: makeBannerStyle(''),
		bannerLabel: '社区公告',
		bannerTitle: '社区公告',
		bannerSummary: '暂无公告发布',
		announcements: [],
		primaryServices: [],
		convenienceServices: [],
		loading: true
	},

	async onShow() {
		await this.bootstrap();
	},

	async onPullDownRefresh() {
		await this.bootstrap();
		wx.stopPullDownRefresh();
	},

	async bootstrap() {
		this.setData({ loading: true });
		try {
			const ownerAuthed = isOwnerAuthed();
			await callCloud('bootstrap/init');
			const [homeRes, profileRes] = await Promise.all([
				callCloud('bootstrap/home'),
				callCloud('bootstrap/profile')
			]);
			const home = homeRes.result.data || {};
			const profile = profileRes.result.data || {};
			const announcements = Array.isArray(home.announcements) ? home.announcements : [];
			const banner = home.banner || announcements[0] || {};
			const entryGroups = buildHomeEntryGroups(home.modules || [], { isOwnerAuthed: ownerAuthed || !!(profile.isAuthed && profile.statusCode === 'approved') });
			this.setData({
				communityName: getCommunityDisplayName({
					currentCommunity: profile.currentCommunity,
					schemaName: profile.schemaName
				}, home.communityName || setting.COMMUNITY_NAME),
				isOwnerAuthed: ownerAuthed || !!(profile.isAuthed && profile.statusCode === 'approved'),
				announcements: announcements.slice(0, 3),
				primaryServices: entryGroups.primaryServices,
				convenienceServices: entryGroups.convenienceServices,
				bannerLabel: banner.isPinned ? '置顶公告' : '社区公告',
				bannerTitle: banner.title || '社区公告',
				bannerSummary: banner.summary || '暂无公告发布',
				bannerStyle: makeBannerStyle(banner.coverUrl || ''),
				loading: false
			});
		} catch (err) {
			console.error('[SXWY-CORE] home bootstrap failed', err);
			this.setData({ loading: false });
		}
	},

	openSearch() {
		wx.showToast({ title: '搜索功能后续开放', icon: 'none' });
	},

	openCommunity() {
		wx.showToast({ title: '请退出登录后重新选择小区', icon: 'none' });
	},

	openAnnouncement() {
		wx.showToast({ title: '请在公告区查看详情', icon: 'none' });
	},

	go(e) {
		const type = e.currentTarget.dataset.type;
		const disabled = e.currentTarget.dataset.disabled === 'true';
		if (disabled) {
			wx.showToast({ title: '认证后可用', icon: 'none' });
			return;
		}
		if (!this.data.isOwnerAuthed && ['life', 'repair', 'complaint'].includes(type)) {
			wx.showToast({ title: '需要认证业主', icon: 'none' });
			return;
		}
		if (type === 'life') {
			wx.switchTab({ url: '/projects/house/pages/life/index/life_index' });
			return;
		}
		if (type === 'repair') {
			wx.switchTab({ url: '/projects/house/pages/repair/index/repair_index' });
			return;
		}
		if (type === 'owner') {
			wx.navigateTo({ url: '/projects/house/pages/auth/index/auth_index' });
			return;
		}
		if (type === 'community') {
			wx.showToast({ title: '小区资料后续开放', icon: 'none' });
			return;
		}
		if (type === 'announcement' || type === 'notice') {
			wx.showToast({ title: '请在公告区查看详情', icon: 'none' });
			return;
		}
		wx.showToast({ title: '功能暂未开放', icon: 'none' });
	}
});
