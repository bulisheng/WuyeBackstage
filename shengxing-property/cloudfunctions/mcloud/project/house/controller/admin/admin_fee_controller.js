const BaseProjectAdminController = require('./base_project_admin_controller.js');
const AdminFeeService = require('../../service/admin/admin_fee_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminFeeController extends BaseProjectAdminController {
	async getAdminFeeList() {
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

		let service = new AdminFeeService();
		let result = await service.getAdminFeeList(input);
		result.list = (result.list || []).map(item => {
			item.FEE_ADD_TIME = timeUtil.timestamp2Time(item.FEE_ADD_TIME, 'Y-M-D h:m');
			item.FEE_EDIT_TIME = timeUtil.timestamp2Time(item.FEE_EDIT_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async saveFee() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'string|id',
			title: 'must|string|name=账单标题',
			desc: 'string|name=说明',
			status: 'int|default=0',
			houseName: 'string|name=房号',
			billType: 'string|name=账单类型',
			amount: 'string|name=金额',
			dueDate: 'string|name=截止日期',
			obj: 'object|default={}',
			forms: 'array|default=[]'
		});
		let service = new AdminFeeService();
		return await service.saveFee(input);
	}

	async getFeeDetail() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
		});
		let service = new AdminFeeService();
		return await service.getFeeDetail(input.id);
	}

	async statusFee() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			status: 'must|int',
		});
		let service = new AdminFeeService();
		return await service.statusFee(input.id, input.status);
	}

	async remindFee() {
		await this.isAdmin();
		let input = this.validateData({
			id: 'must|id',
			desc: 'string|name=说明',
			method: 'string|name=催缴方式',
			result: 'string|name=催缴结果',
			assigneeName: 'string|name=负责人',
			assigneePhone: 'string|name=联系电话',
			communityName: 'string|name=小区名称'
		});
		let service = new AdminFeeService();
		input.operatorId = this._adminId;
		return await service.remindFee(input.id, input);
	}

	async getFeeReminderList() {
		await this.isAdmin();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			sortType: 'string|name=搜索类型',
			sortVal: 'name=搜索类型值',
			orderBy: 'object|name=排序',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let service = new AdminFeeService();
		let result = await service.getFeeReminderList(input);
		result.list = (result.list || []).map(item => {
			item.REMINDER_ADD_TIME = timeUtil.timestamp2Time(item.REMINDER_ADD_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async feeDataGet() {
		await this.isAdmin();
		let input = this.validateData({
			isDel: 'int|must',
		});
		let service = new AdminFeeService();
		if (input.isDel === 1) await service.deleteFeeDataExcel();
		return await service.getFeeDataURL();
	}

	async feeDataExport() {
		await this.isAdmin();
		let input = this.validateData({
			condition: 'string|name=导出条件',
			fields: 'array',
		});
		let service = new AdminFeeService();
		return await service.exportFeeDataExcel(input.condition, input.fields);
	}

	async feeDataDel() {
		await this.isAdmin();
		let service = new AdminFeeService();
		return await service.deleteFeeDataExcel();
	}
}

module.exports = AdminFeeController;
