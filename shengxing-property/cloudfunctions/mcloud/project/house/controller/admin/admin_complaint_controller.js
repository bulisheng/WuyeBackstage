const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminComplaintService = require('../../service/admin/admin_complaint_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminComplaintController extends BaseProjectAdminController {
	async getAdminComplaintList() {
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
		let service = new AdminComplaintService();
		let result = await service.getAdminComplaintList(input);
		result.list = (result.list || []).map(item => {
			item.COMPLAINT_ADD_TIME = timeUtil.timestamp2Time(item.COMPLAINT_ADD_TIME, 'Y-M-D h:m');
			item.COMPLAINT_EDIT_TIME = timeUtil.timestamp2Time(item.COMPLAINT_EDIT_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async getComplaintDetail() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
		});
		let service = new AdminComplaintService();
		return await service.getComplaintDetail(input.id);
	}

	async statusComplaint() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			status: 'must|int',
		});
		let service = new AdminComplaintService();
		return await service.statusComplaint(input.id, input.status);
	}

	async assignComplaint() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			assigneeName: 'must|string|name=负责人',
			assigneePhone: 'string|name=联系电话',
			note: 'string|name=备注',
			communityName: 'string|name=小区名称'
		});
		let service = new AdminComplaintService();
		input.operatorId = this._adminId;
		return await service.assignComplaint(input.id, input);
	}

	async replyComplaint() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			replyContent: 'must|string|name=回复内容',
			note: 'string|name=备注',
			replyBy: 'string|name=回复人',
			communityName: 'string|name=小区名称'
		});
		let service = new AdminComplaintService();
		input.operatorId = this._adminId;
		return await service.replyComplaint(input.id, input);
	}
}

module.exports = AdminComplaintController;
