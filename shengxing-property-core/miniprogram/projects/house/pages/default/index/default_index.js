const { callCloud } = require('../../../../../utils/cloud.js');
const { isOwnerAuthed } = require('../../../../../utils/auth.js');
const setting = require('../../../public/project_setting.js');

function makeBannerStyle(coverUrl) {
	if (coverUrl) {
		return `background-image: linear-gradient(90deg, rgba(12, 120, 61, 0.82), rgba(12, 120, 61, 0.25)), url(${coverUrl});`;
	}
	return 'background-image: linear-gradient(135deg, #dff4e7 0%, #c7e9d1 42%, #e8f8ee 100%);';
}

Page({
	data: {
		communityName: setting.COMMUNITY_NAME,
		isOwnerAuthed: false,
		searchText: '搜索服务、公告、活动',
		bannerStyle: makeBannerStyle(''),
		bannerLabel: '社区公告',
		bannerTitle: '社区公告',
		bannerSummary: '暂无公告发布',
		announcements: [],
		primaryServices: [
			{ title: '生活缴费', desc: '账单、支付、记录', type: 'life', mark: '缴', theme: 'blue' },
			{ title: '报事报修', desc: '提交、处理、回访', type: 'repair', mark: '修', theme: 'green' },
			{ title: '投诉建议', desc: '反馈、跟进、归档', type: 'complaint', mark: '诉', theme: 'orange' },
			{ title: '物业服务', desc: '代寄、代取、预约', type: 'service', mark: '服', theme: 'teal' },
			{ title: '盛兴严选', desc: '精选商品与服务', type: 'mall', mark: '选', theme: 'pink' },
			{ title: '在线客服', desc: '咨询与转人工', type: 'customer', mark: '客', theme: 'red' }
		],
		convenienceServices: [
			{ title: '访客通行', desc: '访客登记与通行', type: 'visitor', mark: '访', theme: 'blue' },
			{ title: '停车缴费', desc: '停车缴费与查询', type: 'parking', mark: '停', theme: 'green' },
			{ title: '快递代收', desc: '快递代收与提醒', type: 'express', mark: '递', theme: 'orange' },
			{ title: '更多服务', desc: '查看更多便民功能', type: 'more', mark: '更多', theme: 'gray' }
		],
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
			this.setData({
				communityName: home.communityName || setting.COMMUNITY_NAME,
				isOwnerAuthed: ownerAuthed || !!(profile.isAuthed && profile.statusCode === 'approved'),
				announcements: announcements.slice(0, 3),
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
		if (!this.data.isOwnerAuthed && ['life', 'repair', 'complaint', 'service'].includes(type)) {
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
		if (type === 'service') {
			wx.switchTab({ url: '/projects/house/pages/life/index/life_index' });
			return;
		}
		wx.showToast({ title: '功能暂未开放', icon: 'none' });
	}
});
