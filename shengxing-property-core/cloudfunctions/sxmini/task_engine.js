const TASK_TYPES = {
	repair: '报修',
	complaint: '投诉建议',
	property_service: '物业服务',
	customer_service: '客服工单'
};

const TASK_STATUSES = {
	pending: '待受理',
	assigned: '已分配',
	processing: '处理中',
	completed: '已完成',
	confirmed: '用户已确认',
	rated: '已评价',
	closed: '已关闭',
	timeout: '已超时',
	escalated: '已升级',
	cancelled: '已取消'
};

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function normalizeTaskType(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(TASK_TYPES, next) ? next : next;
}

function normalizeTaskStatus(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(TASK_STATUSES, next) ? next : next;
}

function buildTaskLogPayload(input = {}) {
	return {
		taskId: Number(input.taskId || 0),
		communityId: Number(input.communityId || 0),
		operatorId: Number(input.operatorId || 0),
		operatorType: normalizeText(input.operatorType || 'system'),
		action: normalizeText(input.action),
		fromStatus: normalizeTaskStatus(input.fromStatus),
		toStatus: normalizeTaskStatus(input.toStatus),
		content: normalizeText(input.content)
	};
}

function buildTaskRecord(input = {}) {
	return {
		communityId: Number(input.communityId || 0),
		type: normalizeTaskType(input.type),
		title: normalizeText(input.title),
		content: normalizeText(input.content),
		category: normalizeText(input.category),
		userId: input.userId != null ? Number(input.userId) : null,
		houseId: input.houseId != null ? Number(input.houseId) : null,
		status: normalizeTaskStatus(input.status || 'pending'),
		priority: Number(input.priority || 0),
		assignedTo: input.assignedTo != null ? Number(input.assignedTo) : null,
		appointmentTime: input.appointmentTime || null,
		deadline: input.deadline || null,
		slaStatus: normalizeText(input.slaStatus),
		isAnonymous: input.isAnonymous ? 1 : 0
	};
}

module.exports = {
	TASK_TYPES,
	TASK_STATUSES,
	normalizeTaskType,
	normalizeTaskStatus,
	buildTaskLogPayload,
	buildTaskRecord
};
