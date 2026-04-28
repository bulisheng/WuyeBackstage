const cloudHelper = require('../../../../../helper/cloud_helper.js');
const pageHelper = require('../../../../../helper/page_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		tab: '投诉',
		anonymous: true,
		formTitle: '',
		formDesc: '',
		records: []
	},
	async onLoad() {
		if (!await PassportBiz.loginMustBackWin(this)) return;
		this._loadRecords();
	},
	bindInput(e) {
		this.setData({
			[e.currentTarget.dataset.item]: e.detail.value
		});
	},
	async _loadRecords() {
		let data = await cloudHelper.callCloudData('complaint/my_list', {}, { title: 'bar' });
		let records = [];
		if (data && data.list) {
			records = data.list.map(item => ({
				title: item.COMPLAINT_TITLE || '投诉建议',
				status: item.COMPLAINT_STATUS == 0 ? '处理中' : '已完成',
				time: item.COMPLAINT_ADD_TIME || ''
			}));
		}
		this.setData({ records });
	},
	setTab(e) { this.setData({ tab: e.currentTarget.dataset.tab }); },
	toggleAnonymous(e) { this.setData({ anonymous: e.detail.value }); },
	async submit() {
		if (!PassportBiz.isLogin()) {
			return PassportBiz.loginMustBackWin(this);
		}
		if (!this.data.formTitle || !this.data.formDesc) {
			return pageHelper.showModal('请先填写投诉标题和内容');
		}
		await cloudHelper.callCloudSumbit('complaint/insert', {
			title: this.data.formTitle,
			desc: this.data.formDesc,
			anonymous: this.data.anonymous,
			forms: [
				{ mark: 'title', type: 'text', val: this.data.formTitle },
				{ mark: 'desc', type: 'textarea', val: this.data.formDesc },
				{ mark: 'anonymous', type: 'switch', val: this.data.anonymous }
			]
		}, { title: '提交中' });
		wx.showToast({ title: '已提交', icon: 'success' });
		this.setData({ formTitle: '', formDesc: '' });
		this._loadRecords();
	}
})
