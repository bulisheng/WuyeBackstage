const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		stat: [
			{ key: 'community', title: '小区', cnt: 3 },
			{ key: 'owner', title: '业主', cnt: 1286 },
			{ key: 'repair', title: '今日报修', cnt: 12 },
			{ key: 'complaint', title: '今日投诉', cnt: 6 }
		],
		todos: [
			{ title: '待审核业主', count: 18, type: 'owner', color: 'orange' },
			{ title: '待分配报修', count: 7, url: '../../task/list/admin_task_list', color: 'blue' },
			{ title: '待处理投诉', count: 4, type: 'complaint', color: 'red' },
			{ title: '待催缴账单', count: 23, type: 'fee', color: 'brown' },
			{ title: '待发货订单', count: 7, type: 'mall', color: 'purple' },
			{ title: '待回复客服', count: 5, type: 'customer', color: 'green' }
		],
		quickMenus: [
			{ title: '小区管理', icon: 'icon-homefill', type: 'community', color: 'text-green' },
			{ title: '业主管理', icon: 'icon-group_fill', url: '../../user/list/admin_user_list', color: 'text-green' },
			{ title: '房屋管理', icon: 'icon-locationfill', type: 'house', color: 'text-cyan' },
			{ title: '报修管理', icon: 'icon-repair', url: '../../task/list/admin_task_list', color: 'text-blue' },
			{ title: '投诉建议', icon: 'icon-servicefill', url: '../../complaint/list/admin_complaint_list', color: 'text-red' },
			{ title: '缴费管理', icon: 'icon-pay', url: '../../fee/list/admin_fee_list', color: 'text-brown' },
			{ title: '商城管理', icon: 'icon-cartfill', url: '../../mall/order/list/admin_mall_order_list', color: 'text-orange' },
			{ title: '投票管理', icon: 'icon-rank', url: '../../vote/list/admin_vote_list', color: 'text-orange' },
			{ title: '活动管理', icon: 'icon-activityfill', url: '../../activity/list/admin_activity_list', color: 'text-pink' },
			{ title: '客服管理', icon: 'icon-messagefill', url: '../../customer/list/admin_customer_list', color: 'text-purple' },
			{ title: '通知配置', icon: 'icon-noticefill', url: '../../notice/config/admin_notice_config', color: 'text-blue' },
			{ title: '系统设置', icon: 'icon-settingsfill', type: 'system', color: 'text-grey' }
		]
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		if (!AdminBiz.isAdmin(this)) return;

		this._loadDetail();
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: async function () {
		await this._loadDetail();
		wx.stopPullDownRefresh();
	},

	_loadDetail: async function () {

		let admin = AdminBiz.getAdminToken();
		this.setData({
			isLoad: true,
			admin
		});

		try {
			let opts = {
				title: 'bar'
			}
			let res = await cloudHelper.callCloudData('admin/home', {}, opts);
			if (res && res.length) this.setData({ stat: res });

		} catch (err) {
			console.log(err);
		}
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

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

	url: function (e) {
		pageHelper.url(e, this);
	},

	bindMenuTap: function (e) {
		let url = e.currentTarget.dataset.url;
		let type = e.currentTarget.dataset.type;

		if (url) {
			wx.navigateTo({ url });
			return;
		}

		if (type === 'system') {
			this.bindMoreTap();
			return;
		}

		wx.navigateTo({
			url: `../../workbench/module/admin_module?type=${type}`
		});
	},

	bindMoreTap: function (e) {
		let itemList = ['取消所有首页推荐'];
		wx.showActionSheet({
			itemList,
			success: async res => {
				let idx = res.tapIndex;

				if (idx == 0) {
					this._clearVouch();
				}

			},
			fail: function (res) { }
		})
	},

	_clearVouch: async function (e) {
		let cb = async () => {
			try {
				await cloudHelper.callCloudSumbit('admin/clear_vouch').then(res => {
					pageHelper.showSuccToast('操作成功');
				})
			} catch (err) {
				console.log(err);
			}
		};
		pageHelper.showConfirm('您确认清除所有首页推荐？', cb)
	},

	bindExitTap: function (e) {

		let callback = function () {
			AdminBiz.clearAdminToken();
			wx.reLaunch({
				url: pageHelper.fmtURLByPID('/pages/my/index/my_index'),
			});
		}
		pageHelper.showConfirm('您确认退出?', callback);
	},

})
