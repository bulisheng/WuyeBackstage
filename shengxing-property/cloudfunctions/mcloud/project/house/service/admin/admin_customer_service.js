const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const NotificationService = require('../../notification_service.js');
const CustomerTicketModel = require('../../model/customer_ticket_model.js');

class AdminCustomerService extends BaseProjectAdminService {
	async getAdminCustomerList({
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
			TICKET_ADD_TIME: 'desc'
		};
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};
		if (util.isDefined(search) && search) {
			where.or = [
				{ TICKET_TITLE: ['like', search] },
				{ TICKET_DESC: ['like', search] },
				{ 'TICKET_OBJ.question': ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			switch (sortType) {
				case 'status':
					where.and.TICKET_STATUS = Number(sortVal);
					break;
				case 'sort':
					orderBy = this.fmtOrderBySort(sortVal, 'TICKET_ADD_TIME');
					break;
			}
		}
		return await CustomerTicketModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
	}

	async getCustomerDetail(id) {
		return await CustomerTicketModel.getOne({ _id: id }, '*');
	}

	async assignCustomer(id, input = {}) {
		let ticket = await CustomerTicketModel.getOne({ _id: id }, '*');
		if (!ticket) return null;
		let obj = ticket.TICKET_OBJ || {};
		let assignTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let patch = {
			TICKET_STATUS: 0,
			TICKET_OBJ: Object.assign({}, obj, {
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				assignNote: input.note || '',
				operatorId: input.operatorId || '',
				assignTime
			})
		};
		await CustomerTicketModel.edit(id, patch);
		try {
			let notification = new NotificationService();
			await notification.send('customer.assigned', {
				communityName: input.communityName || '',
				houseName: obj.houseName || '',
				assigneeName: input.assigneeName || '',
				assigneePhone: input.assigneePhone || '',
				content: ticket.TICKET_DESC || '',
				time: assignTime
			}, {
				receiverText: input.assigneeName || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async replyCustomer(id, input = {}) {
		let ticket = await CustomerTicketModel.getOne({ _id: id }, '*');
		if (!ticket) return null;
		let obj = ticket.TICKET_OBJ || {};
		let replyTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let patch = {
			TICKET_STATUS: 1,
			TICKET_OBJ: Object.assign({}, obj, {
				replyContent: input.replyContent || '',
				replyNote: input.note || '',
				replyTime,
				replyBy: input.replyBy || '',
				operatorId: input.operatorId || ''
			})
		};
		await CustomerTicketModel.edit(id, patch);
		try {
			let notification = new NotificationService();
			await notification.send('customer.replied', {
				communityName: input.communityName || '',
				houseName: obj.houseName || '',
				replyContent: input.replyContent || '',
				time: replyTime
			}, {
				receiverText: ticket.TICKET_USER_ID || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async statusCustomer(id, status) {
		let patch = {
			TICKET_STATUS: Number(status)
		};
		if (Number(status) === 9) {
			let ticket = await CustomerTicketModel.getOne({ _id: id }, '*');
			if (ticket) {
				patch.TICKET_OBJ = Object.assign({}, ticket.TICKET_OBJ || {}, {
					closeTime: timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m'),
					statusText: '已归档'
				});
			}
		}
		return await CustomerTicketModel.edit(id, patch);
	}
}

module.exports = AdminCustomerService;
