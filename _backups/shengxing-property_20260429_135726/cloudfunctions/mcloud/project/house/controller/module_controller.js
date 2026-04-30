const BaseProjectController = require('./base_project_controller.js');
const ModuleService = require('../service/module_service.js');
const contentCheck = require('../../../framework/validate/content_check.js');
const PassportService = require('../service/passport_service.js');
const AppError = require('../../../framework/core/app_error.js');
const appCode = require('../../../framework/core/app_code.js');
const projectSetting = require('../public/project_setting.js');

const FeeModel = require('../model/fee_model.js');
const ComplaintModel = require('../model/complaint_model.js');
const ServiceOrderModel = require('../model/service_order_model.js');
const MallGoodsModel = require('../model/mall_goods_model.js');
const MallOrderModel = require('../model/mall_order_model.js');
const CustomerTicketModel = require('../model/customer_ticket_model.js');
const CommunityModel = require('../model/community_model.js');
const HouseModel = require('../model/house_model.js');
const NoticeConfigModel = require('../model/notice_config_model.js');
const UserHouseModel = require('../model/user_house_model.js');
const NotificationService = require('../service/notification_service.js');
const PaymentService = require('../service/payment_service.js');

class ModuleController extends BaseProjectController {
	_service() {
		return new ModuleService();
	}

	async _requireVerified() {
		let service = new PassportService();
		let user = await service.getMyDetail(this._userId);
		if (!user || user.USER_STATUS !== 1) {
			throw new AppError('您的账号尚未通过认证，请先完成业主认证', appCode.LOGIC);
		}
		return user;
	}

	async _requireHouseBound() {
		let user = await this._requireVerified();
		if (!user.USER_HOUSE) {
			throw new AppError('请先绑定房屋后再使用该功能', appCode.LOGIC);
		}
		return user;
	}

	async _getListWithFallback(Model, input, opts = {}) {
		let result = await this._service().getList(Model, input, opts);
		if (result && result.list && result.list.length > 0) return result;
		return await this._service().getList(Model, input, Object.assign({}, opts, { userId: '' }));
	}

	async getFeeList() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(FeeModel, input, { status: input.status });
	}

	async getFeeDetail() {
		await this._requireHouseBound();
		let input = this.validateData({
			id: 'must|id',
		});
		return await this._service().getOne(FeeModel, input.id);
	}

	async getMyFeeList() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(FeeModel, input, { status: input.status });
	}

	async payFee() {
		let user = await this._requireHouseBound();
		let input = this.validateData({
			id: 'must|id',
		});
		let payment = new PaymentService();
		return await payment.payFee(input.id, {
			userName: user.USER_NAME || '',
			communityName: user.USER_HOUSE || '',
			channel: 'mock'
		});
	}

	async insertComplaint() {
		let user = await this._requireHouseBound();
		let input = this.validateData({
			title: 'must|string|min:1|max:60|name=标题',
			desc: 'must|string|min:1|max:500|name=内容',
			anonymous: 'bool|default=true',
			forms: 'array|name=表单',
		});
		await contentCheck.checkTextMultiClient(input);
		let service = this._service();
		let id = await service.insert(ComplaintModel, this._userId, input, { defaultStatus: 0 });
		try {
			let notification = new NotificationService();
			await notification.send('complaint.created', {
				communityName: user.USER_HOUSE || '',
				houseName: user.USER_HOUSE || '',
				type: input.title,
				content: input.desc,
				anonymousText: input.anonymous ? '匿名' : '实名',
				createTime: this._timestamp,
				userName: user.USER_NAME || ''
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return { id };
	}

	async getMyComplaintList() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._getListWithFallback(ComplaintModel, input, { status: input.status, userId: this._userId });
	}

	async insertServiceOrder() {
		let user = await this._requireHouseBound();
		let input = this.validateData({
			title: 'must|string|min:1|max:60|name=标题',
			desc: 'must|string|min:1|max:500|name=内容',
			forms: 'array|name=表单',
		});
		await contentCheck.checkTextMultiClient(input);
		let id = await this._service().insert(ServiceOrderModel, this._userId, input, { defaultStatus: 0 });
		try {
			let notification = new NotificationService();
			await notification.send('service.created', {
				communityName: user.USER_HOUSE || '',
				houseName: user.USER_HOUSE || '',
				serviceType: input.title,
				content: input.desc,
				createTime: this._timestamp,
				userName: user.USER_NAME || ''
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return { id };
	}

	async getMyServiceList() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._getListWithFallback(ServiceOrderModel, input, { status: input.status, userId: this._userId });
	}

	async getServiceList() {
		return projectSetting.SERVICE_ITEMS || [];
	}

	async getMallList() {
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(MallGoodsModel, input, { status: input.status });
	}

	async getMallDetail() {
		let input = this.validateData({
			id: 'must|id',
		});
		return await this._service().getOne(MallGoodsModel, input.id);
	}

	async createMallOrder() {
		let user = await this._requireHouseBound();
		let input = this.validateData({
			id: 'must|id',
			title: 'must|string|min:1|max:60|name=标题',
			desc: 'string|max:500',
			forms: 'array|name=表单',
		});
		let goods = await this._service().getOne(MallGoodsModel, input.id);
		if (!goods) return null;
		let data = {
			title: input.title,
			desc: input.desc,
			forms: input.forms || [],
		};
		let id = await this._service().insert(MallOrderModel, this._userId, data, { defaultStatus: 0 });
		let payment = new PaymentService().prepareMallOrder(id, {
			userName: user.USER_NAME || '',
			communityName: user.USER_HOUSE || '',
			productNames: input.title,
			number: '1',
			amount: (goods.MALL_OBJ && goods.MALL_OBJ.price) ? goods.MALL_OBJ.price : '',
			channel: 'mock'
		});
		try {
			let notification = new NotificationService();
			await notification.send('mall.orderCreated', {
				communityName: user.USER_HOUSE || '',
				userName: user.USER_NAME || '',
				productNames: input.title,
				number: '1',
				amount: (goods.MALL_OBJ && goods.MALL_OBJ.price) ? goods.MALL_OBJ.price : '',
				createTime: this._timestamp
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return { id, payment };
	}

	async getMyMallOrders() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._getListWithFallback(MallOrderModel, input, { status: input.status, userId: this._userId });
	}

	async getCustomerFaqList() {
		return [
			{ title: '物业费怎么查', desc: '首页进入缴费中心即可查看账单。' },
			{ title: '认证审核多久', desc: '提交后由管理员人工审核。' },
			{ title: '如何提交报修', desc: '在报修页面填写描述并提交。' },
			{ title: '怎么联系物业', desc: '在我的页面可查看联系电话和客服入口。' },
		];
	}

	async insertCustomerTicket() {
		let user = await this._requireHouseBound();
		let input = this.validateData({
			title: 'must|string|min:1|max:60|name=标题',
			desc: 'must|string|min:1|max:500|name=问题',
			forms: 'array|name=表单',
		});
		await contentCheck.checkTextMultiClient(input);
		let id = await this._service().insert(CustomerTicketModel, this._userId, input, { defaultStatus: 0 });
		try {
			let notification = new NotificationService();
			await notification.send('customer.transferRequested', {
				communityName: user.USER_HOUSE || '',
				userName: user.USER_NAME || '',
				phone: user.USER_MOBILE || '',
				content: input.desc,
				createTime: this._timestamp
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return { id };
	}

	async getMyCustomerTickets() {
		await this._requireHouseBound();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			status: 'int',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._getListWithFallback(CustomerTicketModel, input, { status: input.status, userId: this._userId });
	}

	async getCommunityList() {
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(CommunityModel, input, {});
	}

	async getHouseList() {
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(HouseModel, input, {});
	}

	async getMyHouseList() {
		await this._requireVerified();
		let input = this.validateData({
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let result = await UserHouseModel.getList({
			USER_MINI_OPENID: this._userId
		}, '*', {
			USERHOUSE_ADD_TIME: 'desc'
		}, input.page || 1, input.size || 20, input.isTotal !== false, input.oldTotal || 0);
		if (result && result.list && result.list.length > 0) return result;
		return await UserHouseModel.getList({}, '*', {
			USERHOUSE_ADD_TIME: 'desc'
		}, input.page || 1, input.size || 20, input.isTotal !== false, input.oldTotal || 0);
	}

	async getNoticeConfigList() {
		let input = this.validateData({
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		return await this._service().getList(NoticeConfigModel, input, {});
	}
}

module.exports = ModuleController;
