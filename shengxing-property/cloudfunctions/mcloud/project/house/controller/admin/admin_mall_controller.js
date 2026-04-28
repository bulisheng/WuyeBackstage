const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminMallService = require('../../service/admin/admin_mall_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminMallController extends BaseProjectAdminController {
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
}

module.exports = AdminMallController;
