Page({
	data: {
		menus: [
			{ title: '业主投票', desc: '一人一票 / 一户一票', url: '../../vote/index/vote_index' },
			{ title: '社区活动', desc: '报名、二维码签到、核销', url: '../../activity/index/activity_index' },
			{ title: '缴费记录', desc: '查看历史账单与交易', url: '../../fee/record/fee_record' },
			{ title: '便民服务', desc: '访客、停车、快递、药品代取', url: '../../service/index/service_index' },
		]
	},
	go(e) {
		wx.navigateTo({ url: e.currentTarget.dataset.url });
	}
})
