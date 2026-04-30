const BILL_STATUSES = {
	pending: '待支付',
	paid: '已支付',
	overdue: '已逾期',
	cancelled: '已取消',
	refunded: '已退款'
};

const PAYMENT_STATUSES = {
	pending: '待支付',
	success: '支付成功',
	failed: '支付失败',
	cancelled: '已取消',
	refunded: '已退款'
};

const PAYMENT_CHANNELS = {
	wechat: '微信支付',
	cash: '现金',
	system: '系统入账'
};

const BILL_REMINDER_STATUSES = {
	pending: '待发送',
	sent: '已发送',
	failed: '发送失败'
};

function normalizeText(value) {
	return String(value == null ? '' : value).trim();
}

function normalizeBillStatus(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(BILL_STATUSES, next) ? next : next;
}

function normalizePaymentStatus(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(PAYMENT_STATUSES, next) ? next : next;
}

function normalizeChannel(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(PAYMENT_CHANNELS, next) ? next : next;
}

function normalizeReminderStatus(value) {
	const next = normalizeText(value);
	return Object.prototype.hasOwnProperty.call(BILL_REMINDER_STATUSES, next) ? next : next;
}

function buildBillRecord(input = {}) {
	return {
		communityId: Number(input.communityId || 0),
		houseId: input.houseId != null ? Number(input.houseId) : null,
		userId: input.userId != null ? Number(input.userId) : null,
		ownerName: normalizeText(input.ownerName),
		house: normalizeText(input.house),
		billNo: normalizeText(input.billNo),
		title: normalizeText(input.title),
		billType: normalizeText(input.billType || '物业费'),
		amount: Number(input.amount || 0),
		status: normalizeBillStatus(input.status || 'pending'),
		dueDate: input.dueDate || null,
		paidAt: input.paidAt || null
	};
}

function buildBillItemRecord(input = {}) {
	return {
		billId: Number(input.billId || 0),
		communityId: Number(input.communityId || 0),
		name: normalizeText(input.name),
		amount: Number(input.amount || 0),
		remark: normalizeText(input.remark)
	};
}

function buildPaymentRecord(input = {}) {
	return {
		communityId: Number(input.communityId || 0),
		userId: input.userId != null ? Number(input.userId) : null,
		houseId: input.houseId != null ? Number(input.houseId) : null,
		billId: Number(input.billId || 0),
		paymentNo: normalizeText(input.paymentNo),
		amount: Number(input.amount || 0),
		channel: normalizeChannel(input.channel || 'wechat'),
		status: normalizePaymentStatus(input.status || 'pending'),
		transactionId: normalizeText(input.transactionId),
		paidAt: input.paidAt || null
	};
}

function buildBillReminderRecord(input = {}) {
	return {
		communityId: Number(input.communityId || 0),
		billId: Number(input.billId || 0),
		userId: input.userId != null ? Number(input.userId) : null,
		channel: normalizeChannel(input.channel || 'system'),
		title: normalizeText(input.title),
		content: normalizeText(input.content),
		status: normalizeReminderStatus(input.status || 'pending'),
		sentAt: input.sentAt || null
	};
}

module.exports = {
	BILL_STATUSES,
	PAYMENT_STATUSES,
	PAYMENT_CHANNELS,
	BILL_REMINDER_STATUSES,
	normalizeBillStatus,
	normalizePaymentStatus,
	normalizeChannel,
	normalizeReminderStatus,
	buildBillRecord,
	buildBillItemRecord,
	buildPaymentRecord,
	buildBillReminderRecord
};
