Page({
	data: {
		currentCommunity: '幸福里小区',
		quickMenus: [
			{ title: '生活缴费', icon: '../../../images/menu/board.png', cls: 'i-blue' },
			{ title: '报事报修', icon: '../../../images/menu/repair.png', cls: 'i-green' },
			{ title: '投诉建议', icon: '../../../images/menu/rule.png', cls: 'i-orange' },
			{ title: '物业服务', icon: '../../../images/menu/home.png', cls: 'i-royal' },
			{ title: '盛兴严选', icon: '../../../images/menu/my.png', cls: 'i-shop' },
			{ title: '在线客服', icon: '../../../images/menu/wei.png', cls: 'i-red' },
		],
		lifeTools: [
			{ title: '访客通行', icon: 'icon-friend' },
			{ title: '停车缴费', icon: 'icon-pay' },
			{ title: '快递代收', icon: 'icon-deliver' },
			{ title: '更多服务', icon: 'icon-apps' },
		],
		feedList: [
			{ title: '社区活动报名开启', desc: '周末亲子手作、露天电影和邻里便民集市开放报名。', ext: '剩余名额 46', pic: '../../../images/home/cute_1.jpg' },
			{ title: '业主投票进行中', desc: '关于小区健身器材更新方案，请业主及时参与投票。', ext: '已投票 286人', pic: '../../../images/home/cute_2.jpg' },
		],
	},

	onLoad() {
		console.log('[SXWY] default_index loaded');
	}
});
