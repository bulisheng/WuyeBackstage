const cloudHelper = require('../../../../../helper/cloud_helper.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({
	data: {
		formQuestion: '',
		messages: [
			{ role: 'bot', text: '您好，我是小盛客服，请问有什么能帮您？' },
		],
		faqs: []
	},
	async onLoad() {
		await PassportBiz.loginSilence(this);
		let faqs = await cloudHelper.callCloudData('customer/faq_list', {}, { title: 'bar' });
		if (Array.isArray(faqs)) this.setData({ faqs });
	},
	bindInput(e) {
		this.setData({
			[e.currentTarget.dataset.item]: e.detail.value
		});
	},
	async transfer() {
		if (!PassportBiz.isLogin()) {
			return PassportBiz.loginMustBackWin(this);
		}
		if (!this.data.formQuestion) {
			return wx.showToast({ title: '请先输入问题', icon: 'none' });
		}
		await cloudHelper.callCloudSumbit('customer/insert', {
			title: '转人工客服',
			desc: this.data.formQuestion,
			forms: [
				{ mark: 'question', type: 'textarea', val: this.data.formQuestion }
			]
		}, { title: '提交中' });
		wx.showToast({ title: '已创建工单', icon: 'success' });
	}
})
