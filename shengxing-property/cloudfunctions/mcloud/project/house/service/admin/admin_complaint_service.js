const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const NotificationService = require('../../notification_service.js');
const ComplaintModel = require('../../model/complaint_model.js');

class AdminComplaintService extends BaseProjectAdminService {
	async getAdminComplaintList({
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
			COMPLAINT_ADD_TIME: 'desc'
		};
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};
		if (util.isDefined(search) && search) {
			where.or = [
				{ COMPLAINT_TITLE: ['like', search] },
				{ COMPLAINT_DESC: ['like', search] },
				{ 'COMPLAINT_OBJ.question': ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			switch (sortType) {
				case 'status':
					where.and.COMPLAINT_STATUS = Number(sortVal);
					break;
				case 'sort':
					orderBy = this.fmtOrderBySort(sortVal, 'COMPLAINT_ADD_TIME');
					break;
			}
		}
		return await ComplaintModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
	}

	async getComplaintDetail(id) {
		return await ComplaintModel.getOne({ _id: id }, '*');
	}

	async assignComplaint(id, input = {}) {
		let complaint = await ComplaintModel.getOne({ _id: id }, '*');
		if (!complaint) return null;
		let obj = complaint.COMPLAINT_OBJ || {};
		let assignTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let patch = {
			COMPLAINT_STATUS: 1,
			COMPLAINT_OBJ: Object.assign({}, obj, {
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				assignNote: input.note || '',
				operatorId: input.operatorId || '',
				assignTime
			})
		};
		await ComplaintModel.edit(id, patch);
		try {
			let notification = new NotificationService();
			await notification.send('complaint.assigned', {
				communityName: input.communityName || '',
				houseName: obj.houseName || '',
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				content: complaint.COMPLAINT_DESC || '',
				time: assignTime
			}, {
				receiverText: input.assigneeName || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async replyComplaint(id, input = {}) {
		let complaint = await ComplaintModel.getOne({ _id: id }, '*');
		if (!complaint) return null;
		let obj = complaint.COMPLAINT_OBJ || {};
		let replyTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let patch = {
			COMPLAINT_STATUS: 2,
			COMPLAINT_OBJ: Object.assign({}, obj, {
				replyContent: input.replyContent || '',
				replyNote: input.note || '',
				replyTime,
				replyBy: input.replyBy || '',
				operatorId: input.operatorId || ''
			})
		};
		await ComplaintModel.edit(id, patch);
		try {
			let notification = new NotificationService();
			await notification.send('complaint.replied', {
				communityName: input.communityName || '',
				houseName: obj.houseName || '',
				replyContent: input.replyContent || '',
				time: replyTime
			}, {
				receiverText: complaint.COMPLAINT_USER_ID || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async statusComplaint(id, status) {
		let patch = {
			COMPLAINT_STATUS: Number(status)
		};
		if (Number(status) === 9) {
			let complaint = await ComplaintModel.getOne({ _id: id }, '*');
			if (complaint) {
				patch.COMPLAINT_OBJ = Object.assign({}, complaint.COMPLAINT_OBJ || {}, {
					closeTime: timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m'),
					statusText: '已关闭'
				});
			}
		}
		return await ComplaintModel.edit(id, patch);
	}
}

module.exports = AdminComplaintService;
