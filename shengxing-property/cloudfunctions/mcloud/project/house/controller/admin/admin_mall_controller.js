const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminMallService = require('../../service/admin/admin_mall_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminMallController extends BaseProjectAdminController {
	async getAdminGoodsList() {
		await this.isAdmin();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序',
			whereEx: 'object|name=附加查询条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let service = new AdminMallService();
		let result = await service.getAdminGoodsList(input);
		result.list = (result.list || []).map(item => {
			item.MALL_ADD_TIME = timeUtil.timestamp2Time(item.MALL_ADD_TIME, 'Y-M-D h:m');
			item.MALL_EDIT_TIME = timeUtil.timestamp2Time(item.MALL_EDIT_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async getGoodsDetail() {
		await this.isAdmin();
		let input = this.validateData({ id: 'must|id' });
		let service = new AdminMallService();
		return await service.getGoodsDetail(input.id);
	}

	async saveGoods() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'string|id',
			title: 'must|string|name=商品标题',
			desc: 'string|name=说明',
			status: 'int|default=1',
			name: 'string|name=商品名',
			price: 'string|name=价格',
			stock: 'string|name=库存',
			cover: 'string|name=封面',
			obj: 'object|default={}',
			forms: 'array|default=[]'
		});
		let service = new AdminMallService();
		return await service.saveGoods(input);
	}

	async statusGoods() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			status: 'must|int',
		});
		let service = new AdminMallService();
		return await service.statusGoods(input.id, input.status);
	}

	async getAdminOrderList() {
		await this.isAdmin();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序',
			whereEx: 'object|name=附加查询条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let service = new AdminMallService();
		let result = await service.getAdminOrderList(input);
		result.list = (result.list || []).map(item => {
			item.ORDER_ADD_TIME = timeUtil.timestamp2Time(item.ORDER_ADD_TIME, 'Y-M-D h:m');
			item.ORDER_EDIT_TIME = timeUtil.timestamp2Time(item.ORDER_EDIT_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async getOrderDetail() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
		});
		let service = new AdminMallService();
		return await service.getOrderDetail(input.id);
	}

	async statusOrder() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			status: 'must|int',
		});
		let service = new AdminMallService();
		return await service.statusOrder(input.id, input.status);
	}

	async shipOrder() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			shippingNo: 'string|name=物流单号',
			shippingCompany: 'string|name=物流公司',
			userName: 'string|name=用户',
			productNames: 'string|name=商品',
			communityName: 'string|name=小区'
		});
		let service = new AdminMallService();
		return await service.shipOrder(input.id, input);
	}

	async refundOrder() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			reason: 'string|name=退款原因',
			tradeNo: 'string|name=交易号',
			amount: 'string|name=金额',
			userName: 'string|name=用户',
			productNames: 'string|name=商品',
			communityName: 'string|name=小区'
		});
		let service = new AdminMallService();
		return await service.refundOrder(input.id, input);
	}
}

module.exports = AdminMallController;
