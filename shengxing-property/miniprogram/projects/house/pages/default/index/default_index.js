const pageHelper = require('../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../helper/cloud_helper.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		currentCommunity: '幸福里小区',
		noticeTitle: '6月1日起小区西门电动车充电棚维修维护通知',
		quickMenus: [
			{ title: '生活缴费', url: '../../fee/list/fee_list', icon: '../../../images/menu/board.png', cls: 'i-blue' },
			{ title: '报事报修', url: '../../task/add/task_add', icon: '../../../images/menu/repair.png', cls: 'i-green' },
			{ title: '投诉建议', url: '../../complaint/add/complaint_add', icon: '../../../images/menu/rule.png', cls: 'i-orange' },
			{ title: '物业服务', url: '../../service/index/service_index', icon: '../../../images/menu/home.png', cls: 'i-royal' },
			{ title: '盛兴严选', url: '../../mall/index/mall_index', icon: '../../../images/menu/my.png', cls: 'i-shop' },
			{ title: '在线客服', url: '../../customer/index/customer_index', icon: '../../../images/menu/wei.png', cls: 'i-red' },
		],
		lifeTools: [
			{ title: '访客通行', icon: 'icon-friend', url: '../../about/index/about_index?key=SETUP_CONTENT_SERVICE' },
			{ title: '停车缴费', icon: 'icon-pay', url: '../../fee/list/fee_list' },
			{ title: '快递代收', icon: 'icon-deliver', url: '../../service/index/service_index' },
			{ title: '更多服务', icon: 'icon-apps', url: '/projects/house/pages/life/index/life_index', type: 'switch' },
		],
		feedList: [
			{ title: '社区活动报名开启', desc: '周末亲子手作、露天电影和邻里便民集市开放报名。', ext: '剩余名额 46', pic: '../../../images/home/cute_1.jpg', url: '../../activity/index/activity_index' },
			{ title: '业主投票进行中', desc: '关于小区健身器材更新方案，请业主及时参与投票。', ext: '已投票 286人', pic: '../../../images/home/cute_2.jpg', url: '../../vote/index/vote_index' },
		],
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		ProjectBiz.initPage(this);
	},

	_loadList: async function () {
		let opts = {
			title: 'bar'
		}
		await cloudHelper.callCloudSumbit('home/list', {}, opts).then(res => {
			let newsList = [];
			for (let k = 0; k < res.data.length; k++) {
				if (res.data[k].type == 'news' && res.data[k].cateId == 1)
					newsList.push(res.data[k]);
			}

			this.setData({
				newsList,
				dataList: res.data,
				noticeTitle: newsList[0] ? newsList[0].title : this.data.noticeTitle
			});

		})
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: async function () {
		PassportBiz.loginSilence(this);
		this._loadList();
	},

	onPullDownRefresh: async function () {
		await this._loadList();
		wx.stopPullDownRefresh();
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	url: async function (e) {
		pageHelper.url(e, this);
	},


	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},
})
