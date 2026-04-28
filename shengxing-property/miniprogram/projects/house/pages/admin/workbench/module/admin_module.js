const AdminBiz = require('../../../../../../../comm/biz/admin_biz.js');

const moduleMap = {
	community: {
		title: '小区管理',
		desc: '维护小区基础信息、首页 Banner、公告配置、服务入口和管理员绑定。',
		stats: [
			{ label: '小区总数', value: 3 },
			{ label: '启用中', value: 3 },
			{ label: '待配置', value: 1 }
		],
		actions: ['新增小区', '编辑首页配置', '绑定管理员', '配置通知']
	},
	owner: {
		title: '业主管理',
		desc: '处理业主认证、手机号绑定、房屋关系和账号启停。',
		stats: [
			{ label: '业主总数', value: 1286 },
			{ label: '已认证', value: 1098 },
			{ label: '待审核', value: 18 }
		],
		actions: ['审核认证', '绑定房屋', '修改手机号', '查看服务记录']
	},
	house: {
		title: '房屋管理',
		desc: '按小区、楼栋、单元、房号维护房屋档案和住户关系。',
		stats: [
			{ label: '房屋总数', value: 2380 },
			{ label: '已入住', value: 1996 },
			{ label: '待绑定', value: 214 }
		],
		actions: ['新增房屋', '批量导入', '绑定业主', '查看缴费记录']
	},
	complaint: {
		title: '投诉建议管理',
		desc: '投诉从待受理、处理中、已回复到评价归档形成闭环。',
		stats: [
			{ label: '今日新增', value: 6 },
			{ label: '待受理', value: 4 },
			{ label: '超时', value: 1 }
		],
		actions: ['分配负责人', '回复用户', '升级处理', '查看评价']
	},
	fee: {
		title: '缴费管理',
		desc: '管理账单生成、支付状态、逾期催缴和缴费记录。',
		stats: [
			{ label: '待缴账单', value: 86 },
			{ label: '今日金额', value: '2.6万' },
			{ label: '逾期', value: 23 }
		],
		actions: ['创建账单', '批量导入', '作废账单', '发起催缴']
	},
	mall: {
		title: '商城管理',
		desc: '维护盛兴严选商品、订单发货、退款和售后处理。',
		stats: [
			{ label: '商品数', value: 42 },
			{ label: '待发货', value: 7 },
			{ label: '异常单', value: 1 }
		],
		actions: ['新增商品', '上下架', '订单发货', '售后处理']
	},
	service: {
		title: '物业服务管理',
		desc: '处理快递代寄、药品代取等服务申请和超时接单提醒。',
		stats: [
			{ label: '今日申请', value: 9 },
			{ label: '待接单', value: 3 },
			{ label: '超时', value: 0 }
		],
		actions: ['分配人员', '更新状态', '完成服务', '查看记录']
	},
	customer: {
		title: '客服管理',
		desc: '维护 FAQ、人工客服工单和转人工后的处理闭环。',
		stats: [
			{ label: '待回复', value: 5 },
			{ label: 'FAQ', value: 36 },
			{ label: '今日转人工', value: 8 }
		],
		actions: ['管理 FAQ', '分配客服', '回复用户', '沉淀 FAQ']
	}
};

Page({
	data: {
		module: moduleMap.community
	},

	onLoad(options) {
		if (!AdminBiz.isAdmin(this)) return;

		const module = moduleMap[options.type] || moduleMap.community;
		wx.setNavigationBarTitle({ title: module.title });
		this.setData({ module });
	},

	tapAction(e) {
		wx.showToast({
			title: e.currentTarget.dataset.name,
			icon: 'none'
		});
	}
});
