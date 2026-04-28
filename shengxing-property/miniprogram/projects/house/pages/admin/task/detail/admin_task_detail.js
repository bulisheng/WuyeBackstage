const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '待处理',
	1: '处理中',
	9: '已办结'
};

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false,
		edit: {
			assigneeName: '',
			assigneePhone: '',
			replyContent: '',
			note: ''
		}
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad(options) {
		if (!AdminBiz.isAdmin(this)) return;
		if (!pageHelper.getOptions(this, options)) return;
 
		this._loadDetail();
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow() {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload() {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	async onPullDownRefresh() {
		await this._loadDetail();
		wx.stopPullDownRefresh();
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage() {

	},

	_loadDetail: async function () {
		if (!AdminBiz.isAdmin(this)) return;

		let id = this.data.id;
		if (!id) return;

		let params = {
			id
		}
		let opts = {
			hint: false
		}
		let task = await cloudHelper.callCloudData('admin/task_detail', params, opts);
		if (!task) {
			this.setData({
				isLoad: null,
			})
			return;
		};

		let obj = task.TASK_OBJ || {};
		let fmtTime = value => {
			if (!value) return '';
			return typeof value === 'number' ? timeUtil.timestamp2Time(value, 'Y-M-D h:m') : String(value);
		};
		task.statusText = STATUS_TEXT[task.TASK_STATUS] || '未知';
		task.TASK_ADD_TIME = fmtTime(task.TASK_ADD_TIME);
		task.TASK_LAST_TIME = fmtTime(task.TASK_LAST_TIME);

		this.setData({
			isLoad: true,
			task,
			edit: {
				assigneeName: obj.assigneeName || '',
				assigneePhone: obj.assigneePhone || '',
				replyContent: obj.replyContent || '',
				note: obj.assignNote || obj.replyNote || ''
			}
		})
	},
	bindInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({ [`edit.${field}`]: e.detail.value });
	},
	async bindStatusTap(e) {
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/task_status', { id: this.data.task._id, status }, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		await this._loadDetail();
	},
	async bindAssignTap() {
		await cloudHelper.callCloudSumbit('admin/task_assign', {
			id: this.data.task._id,
			assigneeName: this.data.edit.assigneeName,
			assigneePhone: this.data.edit.assigneePhone,
			note: this.data.edit.note
		}, { title: '分配中' });
		wx.showToast({ title: '已分配', icon: 'success' });
		await this._loadDetail();
	},
	async bindReplyTap() {
		await cloudHelper.callCloudSumbit('admin/task_reply', {
			id: this.data.task._id,
			replyContent: this.data.edit.replyContent,
			note: this.data.edit.note,
			replyBy: this.data.edit.assigneeName
		}, { title: '办结中' });
		wx.showToast({ title: '已办结', icon: 'success' });
		await this._loadDetail();
	},
	url(e) {
		pageHelper.url(e, this);
	}
})
