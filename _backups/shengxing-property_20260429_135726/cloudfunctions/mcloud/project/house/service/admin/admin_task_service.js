/**
 * Notes: 报修管理
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-08-22  07:48:00 
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');

const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const dataUtil = require('../../../../framework/utils/data_util.js');
const TaskService = require('../../task_service.js');
const TaskModel = require('../../model/task_model.js');
const UserModel = require('../../model/user_model.js');

// 导出数据KEY
const EXPORT_TASK_DATA_KEY = 'EXPORT_TASK_DATA';

class AdminTaskService extends BaseProjectAdminService {


	/** 取得分页列表 */
	async getAdminTaskList({
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序
		whereEx, //附加查询条件 
		page,
		size,
		oldTotal = 0
	}) {

		orderBy = orderBy || {
			TASK_ADD_TIME: 'desc'
		};
		let fields = 'TASK_STATUS,TASK_OBJ,TASK_ADD_TIME,TASK_LAST_TIME';


		let where = {};
		where.and = {
			_pid: this.getProjectId(), //复杂的查询在此处标注PID  
		};

		if (util.isDefined(search) && search) {
			where.or = [
				{ ['TASK_OBJ.title']: ['like', search] },
				{ ['TASK_OBJ.person']: ['like', search] },
				{ ['TASK_OBJ.phone']: ['like', search] },
				{ ['TASK_OBJ.building']: ['like', search] },
			];

		} else if (sortType && util.isDefined(sortVal)) {
			// 搜索菜单
			switch (sortType) {
				case 'level': {
					where.and['TASK_OBJ.level'] = sortVal;
					break;
				}
				case 'type': {
					where.and['TASK_OBJ.type'] = sortVal;
					break;
				}
				case 'status': {
					where.and['TASK_STATUS'] = Number(sortVal);
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'TASK_ADD_TIME');
					break;
				}
			}
		}

		let result = await TaskModel.getList(where, fields, orderBy, page, size, true, oldTotal, false);


		// 为导出增加一个参数condition
		result.condition = encodeURIComponent(JSON.stringify(where));

		return result;
	}

	/**修改状态 */
	async statusTask(id, status) {
		let task = await TaskModel.getOne({ _id: id }, '*');
		if (!task) return null;
		let lastTime = timeUtil.time();
		let patch = {
			TASK_STATUS: Number(status),
			TASK_LAST_TIME: lastTime
		};
		if (Number(status) === 9) {
			patch.TASK_OBJ = Object.assign({}, task.TASK_OBJ || {}, {
				replyTime: timeUtil.timestamp2Time(lastTime, 'Y-M-D h:m'),
				statusText: '已办结'
			});
		}
		return await TaskModel.edit(id, patch);
	}

	async assignTask(id, input = {}) {
		let service = new TaskService();
		return await service.assignTask(id, input);
	}

	async replyTask(id, input = {}) {
		let service = new TaskService();
		return await service.replyTask(id, input);
	}

	// #####################导出数据

	/**获取数据 */
	async getTaskDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_TASK_DATA_KEY);
	}

	/**删除数据 */
	async deleteTaskDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_TASK_DATA_KEY);
	}

	/**导出数据 */
	async exportTaskDataExcel(condition, fields) {
		let where = {};
		if (condition) {
			try {
				where = JSON.parse(decodeURIComponent(condition));
			} catch (err) {
				where = {};
			}
		}
		if (!where.and) where.and = {};
		where.and._pid = this.getProjectId();
		let result = await TaskModel.getList(where, '*', { TASK_ADD_TIME: 'desc' }, 1, 9999, false, 0, false);
		let data = [['标题', '分类', '优先级', '楼栋房号', '联系人', '电话', '状态', '创建时间', '处理时间']];
		(result.list || []).forEach(item => {
			let obj = item.TASK_OBJ || {};
			data.push([
				obj.title || '',
				obj.type || '',
				obj.level || '',
				obj.building || '',
				obj.person || '',
				obj.phone || '',
				item.TASK_STATUS == 1 ? '处理中' : (item.TASK_STATUS == 9 ? '已办结' : '待处理'),
				timeUtil.timestamp2Time(item.TASK_ADD_TIME, 'Y-M-D h:m'),
				timeUtil.timestamp2Time(item.TASK_LAST_TIME, 'Y-M-D h:m')
			]);
		});
		return await exportUtil.exportDataExcel(EXPORT_TASK_DATA_KEY, '报修数据', result.total || (result.list || []).length, data);

	}

}

module.exports = AdminTaskService;
