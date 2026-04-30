const BaseProjectAdminController = require('./base_project_admin_controller.js');
const NotificationService = require('../../service/notification_service.js');
const timeUtil = require('../../../../framework/utils/time_util.js');

class AdminNoticeController extends BaseProjectAdminController {
	async getNoticeConfigList() {
		await this.isAdmin();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let service = new NotificationService();
		return await service.listConfigs(input);
	}

	async saveNoticeConfig() {
		await this.isAdmin();
		let input = this.validateData({
			code: 'must|string|name=编码',
			title: 'must|string|name=名称',
			desc: 'string|name=说明',
			status: 'must|int|name=状态',
			obj: 'object|default={}',
			forms: 'array|default=[]'
		});
		let service = new NotificationService();
		return await service.saveConfig(input);
	}

	async getNoticeLogList() {
		await this.isAdmin();
		let input = this.validateData({
			search: 'string|min:1|max:30|name=搜索条件',
			page: 'must|int|default=1',
			size: 'int',
			isTotal: 'bool',
			oldTotal: 'int',
		});
		let service = new NotificationService();
		let result = await service.listLogs(input);
		result.list = (result.list || []).map(item => {
			item.NOTICELOG_ADD_TIME = timeUtil.timestamp2Time(item.NOTICELOG_ADD_TIME, 'Y-M-D h:m');
			return item;
		});
		return result;
	}

	async sendNoticeTest() {
		await this.isAdmin();
		let input = this.validateData({
			scene: 'must|string|name=场景',
			payload: 'object|default={}'
		});
		let service = new NotificationService();
		return await service.sendTest(input.scene, input.payload);
	}
}

module.exports = AdminNoticeController;
