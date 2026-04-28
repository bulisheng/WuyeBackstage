const AdminBiz = require('../../../../../../comm/biz/admin_biz.js');
const cloudHelper = require('../../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../../helper/page_helper.js');
const timeUtil = require('../../../../../../helper/time_helper.js');

const STATUS_TEXT = {
	0: '下架',
	1: '上架',
	9: '停用'
};

Page({
	data: {
		isLoad: false,
		id: '',
		detail: null,
		objItems: [],
		edit: {
			title: '',
			desc: '',
			name: '',
			cover: '',
			price: '',
			stock: '',
			status: 1
		}
	},

	async onLoad(options) {
		if (!AdminBiz.isAdmin(this)) return;
		this.setData({ id: options.id || '' });
		await this._loadDetail();
	},

	async onPullDownRefresh() {
		await this._loadDetail();
		wx.stopPullDownRefresh();
	},

	bindInput(e) {
		const field = e.currentTarget.dataset.field;
		this.setData({ [`edit.${field}`]: e.detail.value });
	},

	async _loadDetail() {
		if (!this.data.id) {
			this.setData({
				isLoad: true,
				detail: {
					_id: '',
					MALL_TITLE: '',
					MALL_DESC: '',
					MALL_STATUS: 1,
					MALL_OBJ: {}
				},
				objItems: [],
				edit: {
					title: '',
					desc: '',
					name: '',
					cover: '',
					price: '',
					stock: '',
					status: 1
				}
			});
			return;
		}

		let detail = await cloudHelper.callCloudData('admin/mall_goods_detail', { id: this.data.id }, { title: 'bar' });
		if (!detail) {
			this.setData({ isLoad: null });
			return;
		}

		let obj = detail.MALL_OBJ || {};
		let objItems = Object.keys(obj).map(key => ({
			key,
			value: Array.isArray(obj[key]) ? obj[key].join(', ') : String(obj[key])
		}));
		detail.statusText = STATUS_TEXT[detail.MALL_STATUS] || '未知';
		detail.MALL_ADD_TIME = detail.MALL_ADD_TIME ? timeUtil.timestamp2Time(detail.MALL_ADD_TIME, 'Y-M-D h:m') : '';
		detail.MALL_EDIT_TIME = detail.MALL_EDIT_TIME ? timeUtil.timestamp2Time(detail.MALL_EDIT_TIME, 'Y-M-D h:m') : '';
		this.setData({
			isLoad: true,
			detail,
			objItems,
			edit: {
				title: detail.MALL_TITLE || '',
				desc: detail.MALL_DESC || '',
				name: obj.name || detail.MALL_TITLE || '',
				cover: obj.cover || '',
				price: obj.price || '',
				stock: obj.stock || '',
				status: typeof detail.MALL_STATUS === 'number' ? detail.MALL_STATUS : 1
			}
		});
	},

	async bindSaveTap() {
		const edit = this.data.edit || {};
		let result = await cloudHelper.callCloudSumbit('admin/mall_goods_save', {
			id: this.data.id || '',
			title: edit.title,
			desc: edit.desc,
			name: edit.name,
			cover: edit.cover,
			price: edit.price,
			stock: edit.stock,
			status: Number(typeof edit.status === 'undefined' ? 1 : edit.status)
		}, { title: '保存中' });
		let newId = result && result.data ? result.data.id : (result && result.id);
		if (newId) {
			this.setData({ id: newId });
		}
		wx.showToast({ title: '已保存', icon: 'success' });
		await this._loadDetail();
	},

	async bindStatusTap(e) {
		if (!this.data.id && !(this.data.detail && this.data.detail._id)) return;
		let status = Number(e.currentTarget.dataset.status);
		await cloudHelper.callCloudSumbit('admin/mall_goods_status', {
			id: this.data.id || this.data.detail._id,
			status
		}, { title: '保存中' });
		wx.showToast({ title: '已更新', icon: 'success' });
		this.setData({ 'edit.status': status });
		await this._loadDetail();
	}
});
