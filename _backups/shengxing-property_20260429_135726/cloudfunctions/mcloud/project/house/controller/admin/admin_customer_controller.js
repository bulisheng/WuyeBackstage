const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminCustomerService = require('../../service/admin/admin_customer_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminCustomerController extends BaseProjectAdminController {
	async getAdminCustomerList() {
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
		let service = new AdminCustomerService();
		let result = await service.getAdminCustomerList(input);
		result.list = (result.list || []).map(item => {
			item.TICKET_ADD_TIME = timeUtil.timestamp2Time(item.TICKET_ADD_TIME, 'Y-M-D h:m');
			item.TICKET_EDIT_TIME = timeUtil.timestamp2Time(item.TICKET_EDIT_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async getCustomerDetail() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
		});
		let service = new AdminCustomerService();
		return await service.getCustomerDetail(input.id);
	}

	async statusCustomer() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			status: 'must|int',
		});
		let service = new AdminCustomerService();
		return await service.statusCustomer(input.id, input.status);
	}

	async assignCustomer() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			assigneeName: 'must|string|name=负责人',
			assigneePhone: 'string|name=联系电话',
			note: 'string|name=备注',
			communityName: 'string|name=小区名称'
		});
		let service = new AdminCustomerService();
		input.operatorId = this._adminId;
		return await service.assignCustomer(input.id, input);
	}

	async replyCustomer() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			replyContent: 'must|string|name=回复内容',
			note: 'string|name=备注',
			replyBy: 'string|name=回复人',
			communityName: 'string|name=小区名称'
		});
		let service = new AdminCustomerService();
		input.operatorId = this._adminId;
		return await service.replyCustomer(input.id, input);
	}
}

module.exports = AdminCustomerController;
