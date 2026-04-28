const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const exportUtil = require('../../../../framework/utils/export_util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const NotificationService = require('../../notification_service.js');
const FeeModel = require('../../model/fee_model.js');
const FeeReminderLogModel = require('../../model/fee_reminder_log_model.js');

const EXPORT_FEE_DATA_KEY = 'EXPORT_FEE_DATA';

class AdminFeeService extends BaseProjectAdminService {
	async getAdminFeeList({
		search,
		sortType,
		sortVal,
		orderBy,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			FEE_ADD_TIME: 'desc'
		};
		let fields = '*';
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};

		if (util.isDefined(search) && search) {
			where.or = [
				{ FEE_TITLE: ['like', search] },
				{ FEE_DESC: ['like', search] },
				{ 'FEE_OBJ.houseName': ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			switch (sortType) {
				case 'status':
					where.and.FEE_STATUS = Number(sortVal);
					break;
				case 'sort':
					orderBy = this.fmtOrderBySort(sortVal, 'FEE_ADD_TIME');
					break;
			}
		}

		let result = await FeeModel.getList(where, fields, orderBy, page, size, isTotal, oldTotal);
		result.condition = encodeURIComponent(JSON.stringify(where));
		return result;
	}

	async getFeeDetail(id) {
		return await FeeModel.getOne({ _id: id }, '*');
	}

	async saveFee(input) {
		let oldFee = null;
		if (input.id) {
			oldFee = await FeeModel.getOne({ _id: input.id }, '*');
		}
		let feeObj = Object.assign({}, oldFee ? (oldFee.FEE_OBJ || {}) : {}, input.obj || {});
		if (util.isDefined(input.houseName)) feeObj.houseName = input.houseName;
		if (util.isDefined(input.billType)) feeObj.billType = input.billType;
		if (util.isDefined(input.amount)) feeObj.amount = input.amount;
		if (util.isDefined(input.dueDate)) feeObj.dueDate = input.dueDate;

		let data = {
			FEE_TITLE: input.title,
			FEE_DESC: input.desc || '',
			FEE_STATUS: Number(util.isDefined(input.status) ? input.status : (oldFee ? oldFee.FEE_STATUS : 0)),
			FEE_OBJ: feeObj,
			FEE_FORMS: (Array.isArray(input.forms) && input.forms.length > 0) ? input.forms : (oldFee ? (oldFee.FEE_FORMS || []) : [])
		};

		if (input.id) {
			await FeeModel.edit(input.id, data);
			return { id: input.id };
		}

		let id = await FeeModel.insert(data);
		return { id };
	}

	async statusFee(id, status) {
		let fee = await FeeModel.getOne({ _id: id }, '*');
		if (!fee) return null;
		let feeObj = fee.FEE_OBJ || {};
		let nextStatus = Number(status);
		let patch = {
			FEE_STATUS: nextStatus
		};
		if (nextStatus === 1 && !feeObj.payTime) {
			patch.FEE_OBJ = Object.assign({}, feeObj, {
				payTime: timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m'),
				statusText: '已缴费'
			});
		}
		return await FeeModel.edit(id, patch);
	}

	async remindFee(id, input = {}) {
		let fee = await FeeModel.getOne({ _id: id }, '*');
		if (!fee) return null;

		let feeObj = fee.FEE_OBJ || {};
		let remindTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let reminderData = {
			REMINDER_TITLE: fee.FEE_TITLE,
			REMINDER_DESC: input.desc || `账单催缴：${fee.FEE_TITLE}`,
			REMINDER_STATUS: 1,
			REMINDER_OBJ: {
				feeId: id,
				billName: fee.FEE_TITLE,
				houseName: feeObj.houseName || '',
				amount: feeObj.amount || '',
				dueDate: feeObj.dueDate || '',
				method: input.method || '钉钉提醒',
				result: input.result || '已发送',
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				operatorId: input.operatorId || '',
				time: remindTime
			}
		};
		await FeeReminderLogModel.insert(reminderData);
		await FeeModel.edit(id, {
			FEE_OBJ: Object.assign({}, feeObj, {
				reminderCnt: Number(feeObj.reminderCnt || 0) + 1,
				lastReminderTime: remindTime
			})
		});

		try {
			let notification = new NotificationService();
			await notification.send('fee.reminder', {
				communityName: input.communityName || '',
				houseName: feeObj.houseName || '',
				billName: fee.FEE_TITLE || '',
				amount: feeObj.amount || '',
				dueDate: feeObj.dueDate || '',
				method: input.method || '钉钉提醒',
				result: input.result || '已发送',
				time: remindTime
			}, {
				receiverText: input.assigneeName || feeObj.houseName || ''
			});
		} catch (err) {
			console.log(err);
		}

		return reminderData;
	}

	async getFeeReminderList({
		search,
		sortType,
		sortVal,
		orderBy,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			REMINDER_ADD_TIME: 'desc'
		};
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};
		if (util.isDefined(search) && search) {
			where.or = [
				{ REMINDER_TITLE: ['like', search] },
				{ REMINDER_DESC: ['like', search] },
				{ 'REMINDER_OBJ.houseName': ['like', search] },
			];
		}
		return await FeeReminderLogModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
	}

	// #####################导出数据
	async getFeeDataURL() {
		return await exportUtil.getExportDataURL(EXPORT_FEE_DATA_KEY);
	}

	async deleteFeeDataExcel() {
		return await exportUtil.deleteDataExcel(EXPORT_FEE_DATA_KEY);
	}

	async exportFeeDataExcel(condition, fields) {
		let where = {};
		if (condition) {
			try {
				where = JSON.parse(decodeURIComponent(condition));
			} catch (err) {
				where = {};
			}
		}
		if (!where.and) {
			where.and = {};
		}
		where.and._pid = this.getProjectId();

		let result = await FeeModel.getList(where, '*', { FEE_ADD_TIME: 'desc' }, 1, 9999, false, 0, false);
		let data = [['账单标题', '说明', '房号', '账单类型', '金额', '截止日期', '状态', '创建时间', '更新时间']];
		(result.list || []).forEach(item => {
			let obj = item.FEE_OBJ || {};
			data.push([
				item.FEE_TITLE || '',
				item.FEE_DESC || '',
				obj.houseName || '',
				obj.billType || '',
				obj.amount || '',
				obj.dueDate || '',
				item.FEE_STATUS == 1 ? '已缴费' : (item.FEE_STATUS == 9 ? '已作废' : '待缴费'),
				timeUtil.timestamp2Time(item.FEE_ADD_TIME, 'Y-M-D h:m'),
				timeUtil.timestamp2Time(item.FEE_EDIT_TIME, 'Y-M-D h:m')
			]);
		});
		return await exportUtil.exportDataExcel(EXPORT_FEE_DATA_KEY, '账单数据', result.total || (result.list || []).length, data);
	}
}

module.exports = AdminFeeService;
