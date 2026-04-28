/**
 * Notes: 健康监测模块业务逻辑
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * Date: 2022-08-12 07:48:00 
 */

const BaseProjectService = require('./base_project_service.js');
const util = require('../../../framework/utils/util.js');
const cloudUtil = require('../../../framework/cloud/cloud_util.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const timeUtil = require('../../../framework/utils/time_util.js');
const PassportService = require('./passport_service.js');
const NotificationService = require('./notification_service.js');
const TaskModel = require('../model/task_model.js');

class TaskService extends BaseProjectService {

	async getTaskCountByType(userId) {
		let status0Cnt = await TaskModel.count({ TASK_STATUS: 0, TASK_USER_ID: userId });
		let status1Cnt = await TaskModel.count({ TASK_STATUS: 1, TASK_USER_ID: userId });
		let status2Cnt = await TaskModel.count({ TASK_STATUS: 2, TASK_USER_ID: userId });
		let task = {
			status0Cnt,
			status1Cnt,
			status2Cnt
		}
		return task;
	}

	async getTaskDetail(userId, id, isAdmin = false) {
		let where = {
			_id: id
		}
		if (!isAdmin) where.TASK_USER_ID = userId;
		return await TaskModel.getOne(where);
	}

	async _getTaskUser(userId) {
		let passport = new PassportService();
		return await passport.getMyDetail(userId);
	}


	/**添加 */
	async insertTask(userId, {
		forms
	}) {

		// 赋值 
		let data = {};
		data.TASK_USER_ID = userId;

		data.TASK_OBJ = dataUtil.dbForms2Obj(forms);
		data.TASK_FORMS = forms;

		let id = await TaskModel.insert(data);

		try {
			let passport = new PassportService();
			let user = await passport.getMyDetail(userId);
			let notification = new NotificationService();
			await notification.send('repair.created', {
				communityName: user && user.USER_HOUSE ? user.USER_HOUSE : '',
				building: dataUtil.getValByForm(forms, 'building', '楼栋房号') || '',
				unit: '',
				room: '',
				userName: user && user.USER_NAME ? user.USER_NAME : '',
				phone: user && user.USER_MOBILE ? user.USER_MOBILE : '',
				category: dataUtil.getValByForm(forms, 'type', '填报类型') || '',
				content: dataUtil.getValByForm(forms, 'desc', '详细说明') || '',
				appointmentTime: dataUtil.getValByForm(forms, 'appointmentTime', '预约时间') || '',
				priority: dataUtil.getValByForm(forms, 'level', '优先级') || '',
				createTime: timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m')
			}, {
				receiverText: '维修主管'
			});
		} catch (err) {
			console.log(err);
		}

		return {
			id
		};
	}


	/**修改 */
	async editTask(userId, {
		id,
		forms
	}) {
		// 异步处理 新旧文件
		let oldForms = await TaskModel.getOneField(id, 'TASK_FORMS');
		if (!oldForms) return;
		cloudUtil.handlerCloudFilesForForms(oldForms, forms);

		// 赋值 
		let data = {};
		data.TASK_USER_ID = userId;
		data.TASK_OBJ = dataUtil.dbForms2Obj(forms);
		data.TASK_FORMS = forms;

		await TaskModel.edit(id, data);
	}

	// 更新forms信息
	async updateTaskForms({
		id,
		hasImageForms
	}) {
		await TaskModel.editForms(id, 'TASK_FORMS', 'TASK_OBJ', hasImageForms);
	}

	async assignTask(id, input = {}) {
		let task = await TaskModel.getOne({ _id: id }, '*');
		if (!task) return null;
		let obj = task.TASK_OBJ || {};
		let lastTime = Date.now();
		let patch = {
			TASK_STATUS: 1,
			TASK_LAST_TIME: lastTime,
			TASK_OBJ: Object.assign({}, obj, {
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				assignNote: input.note || '',
				assignTime: timeUtil.timestamp2Time(lastTime, 'Y-M-D h:m')
			})
		};
		await TaskModel.edit(id, patch);
		try {
			let user = await this._getTaskUser(task.TASK_USER_ID);
			let notification = new NotificationService();
			await notification.send('repair.assigned', {
				communityName: input.communityName || user.USER_HOUSE || '',
				houseName: obj.building || '',
				staffName: input.assigneeName || '',
				staffPhone: input.assigneePhone || '',
				appointmentTime: obj.appointmentTime || '',
				userName: user.USER_NAME || '',
				phone: user.USER_MOBILE || ''
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async replyTask(id, input = {}) {
		let task = await TaskModel.getOne({ _id: id }, '*');
		if (!task) return null;
		let obj = task.TASK_OBJ || {};
		let lastTime = Date.now();
		let patch = {
			TASK_STATUS: 9,
			TASK_LAST_TIME: lastTime,
			TASK_OBJ: Object.assign({}, obj, {
				replyContent: input.replyContent || '',
				replyNote: input.note || '',
				replyTime: timeUtil.timestamp2Time(lastTime, 'Y-M-D h:m'),
				replyBy: input.replyBy || '',
				assigneeName: input.assigneeName || obj.assigneeName || ''
			})
		};
		await TaskModel.edit(id, patch);
		try {
			let user = await this._getTaskUser(task.TASK_USER_ID);
			let notification = new NotificationService();
			await notification.send('repair.closed', {
				communityName: input.communityName || user.USER_HOUSE || '',
				houseName: obj.building || '',
				replyContent: input.replyContent || '',
				time: timeUtil.timestamp2Time(lastTime, 'Y-M-D h:m')
			}, {
				receiverText: user.USER_NAME || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	/**删除数据 */
	async delTask(userId, id, isAdmin) {
		let where = {
			_id: id
		}
		if (!isAdmin) where.TASK_USER_ID = userId;

		// 异步处理 新旧文件
		let task = await TaskModel.getOne(id, 'TASK_FORMS');
		if (!task) return;
		cloudUtil.handlerCloudFilesForForms(task.TASK_FORMS, []);

		await TaskModel.del(where);

	}


	/** 取得我的 */
	async getMyTaskList(userId, {
		search, // 搜索条件
		sortType, // 搜索菜单
		sortVal, // 搜索菜单
		orderBy, // 排序 
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			'TASK_ADD_TIME': 'desc'
		};
		let fields = '*';

		let where = {};
		where.and = {
			_pid: this.getProjectId(), //复杂的查询在此处标注PID 
			TASK_USER_ID: userId
		};

		if (util.isDefined(search) && search) {
			where.or = [{ ['TASK_OBJ.title']: ['like', search] }];
		} else if (sortType && sortVal !== '') {
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
					where.and.TASK_STATUS = Number(sortVal);
					break;
				}
				case 'sort': {
					orderBy = this.fmtOrderBySort(sortVal, 'TASK_ADD_TIME');
					break;
				}
			}
		}
		let result = await TaskModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);

		return result;
	}

}

module.exports = TaskService;
