const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../billing_engine.js');

test('billing engine exposes the canonical billing statuses', () => {
	assert.equal(engine.BILL_STATUSES.pending, '待支付');
	assert.equal(engine.BILL_STATUSES.paid, '已支付');
	assert.equal(engine.PAYMENT_STATUSES.success, '支付成功');
	assert.equal(engine.PAYMENT_CHANNELS.wechat, '微信支付');
});

test('billing records normalize fields for bills and payments', () => {
	const bill = engine.buildBillRecord({
		communityId: 3,
		houseId: 8,
		userId: 9,
		ownerName: '张三',
		house: '1-2-301',
		billNo: 'BILL-001',
		title: '2026年4月物业费',
		amount: 188.5,
		status: 'pending'
	});
	const payment = engine.buildPaymentRecord({
		communityId: 3,
		userId: 9,
		houseId: 8,
		billId: 12,
		paymentNo: 'PAY-001',
		amount: 188.5,
		channel: 'wechat',
		status: 'pending'
	});
	assert.equal(bill.billNo, 'BILL-001');
	assert.equal(bill.status, 'pending');
	assert.equal(payment.paymentNo, 'PAY-001');
	assert.equal(payment.channel, 'wechat');
});

test('billing reminder records normalize fields', () => {
	const reminder = engine.buildBillReminderRecord({
		communityId: 3,
		billId: 12,
		userId: 9,
		channel: 'system',
		title: '缴费提醒',
		content: '请尽快缴费',
		status: 'pending'
	});
	assert.equal(reminder.channel, 'system');
	assert.equal(reminder.status, 'pending');
	assert.equal(reminder.billId, 12);
});

test('billing schema contains the new tables', () => {
	const schemaPath = path.join(__dirname, '../../../database/mysql/schema.sql');
	const schema = fs.readFileSync(schemaPath, 'utf8');
	assert.match(schema, /CREATE TABLE IF NOT EXISTS `rzb`\.`bills`/);
	assert.match(schema, /CREATE TABLE IF NOT EXISTS `rzb`\.`bill_items`/);
	assert.match(schema, /CREATE TABLE IF NOT EXISTS `rzb`\.`payments`/);
	assert.match(schema, /CREATE TABLE IF NOT EXISTS `rzb`\.`bill_reminders`/);
});

console.log('billing engine assertions passed');
