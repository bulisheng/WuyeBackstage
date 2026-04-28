const crypto = require('crypto');
const PayLogModel = require('../model/pay_log_model.js');
const FeeModel = require('../model/fee_model.js');
const MallOrderModel = require('../model/mall_order_model.js');
const NotificationService = require('./notification_service.js');
const AppError = require('../../../framework/core/app_error.js');
const appCode = require('../../../framework/core/app_code.js');
const projectConfig = require('../public/project_config.js');

class PaymentService {
	_getSecret() {
		return projectConfig.PAYMENT_CALLBACK_SECRET || 'shengxing-property-payment-secret';
	}

	_buildSign({ bizType, bizId, tradeNo, amount, channel, timestamp, nonce }) {
		let base = [bizType, bizId, tradeNo, String(amount || ''), channel || '', String(timestamp || ''), nonce || ''].join('|');
		return crypto.createHmac('sha256', this._getSecret()).update(base).digest('hex');
	}

	_prepareCallback({
		bizType,
		bizId,
		tradeNo,
		amount = '',
		channel = 'mock',
		payload = {}
	}) {
		let timestamp = Date.now();
		let nonce = crypto.randomBytes(8).toString('hex');
		let sign = this._buildSign({
			bizType,
			bizId,
			tradeNo,
			amount,
			channel,
			timestamp,
			nonce
		});

		return {
			bizType,
			bizId,
			tradeNo,
			amount: String(amount || ''),
			channel,
			timestamp,
			nonce,
			sign,
			payload
		};
	}

	_verifyCallback(input) {
		let timestamp = Number(input.timestamp || 0);
		if (!timestamp) {
			throw new AppError('支付签名缺少时间戳', appCode.LOGIC);
		}
		let window = Number(projectConfig.PAYMENT_CALLBACK_WINDOW || 60 * 10 * 1000);
		if (Math.abs(Date.now() - timestamp) > window) {
			throw new AppError('支付签名已过期', appCode.LOGIC);
		}
		let sign = this._buildSign({
			bizType: input.bizType,
			bizId: input.bizId,
			tradeNo: input.tradeNo,
			amount: input.amount,
			channel: input.channel,
			timestamp,
			nonce: input.nonce
		});
		if (!input.sign || input.sign !== sign) {
			throw new AppError('支付签名校验失败', appCode.LOGIC);
		}
	}

	async _existsPaid(bizType, bizId, tradeNo) {
		let where = {
			PAY_BIZ_TYPE: bizType,
			PAY_BIZ_ID: bizId
		};
		if (tradeNo) {
			where.PAY_TRADE_NO = tradeNo;
		}
		return await PayLogModel.getOne(where, '*');
	}

	async callback({
		bizType,
		bizId,
		tradeNo = '',
		amount = '',
		channel = 'mock',
		status = 1,
		timestamp = 0,
		nonce = '',
		sign = '',
		payload = {}
	}) {
		if (!bizType || !bizId) {
			throw new AppError('支付回调参数不完整', appCode.LOGIC);
		}
		if (Number(status) === 1) {
			this._verifyCallback({
				bizType,
				bizId,
				tradeNo,
				amount,
				channel,
				timestamp,
				nonce,
				sign
			});
		}

		let existed = await this._existsPaid(bizType, bizId, tradeNo);
		if (existed && existed.PAY_STATUS === 1) {
			return {
				id: bizId,
				alreadyPaid: true
			};
		}

		if (Number(status) !== 1) {
			await PayLogModel.insert({
				PAY_BIZ_TYPE: bizType,
				PAY_BIZ_ID: bizId,
				PAY_TRADE_NO: tradeNo || `MOCK_${Date.now()}`,
				PAY_TITLE: '支付失败',
				PAY_DESC: '支付回调状态为失败',
				PAY_AMOUNT: String(amount || ''),
				PAY_CHANNEL: channel,
				PAY_STATUS: 0,
				PAY_OBJ: Object.assign({}, payload, { status, timestamp, nonce, sign })
			});
			return {
				id: bizId,
				skipped: true
			};
		}

		let result = null;
		if (bizType === 'fee') {
			result = await this._callbackFee(bizId, { tradeNo, amount, channel, status, payload });
		} else if (bizType === 'mall') {
			result = await this._callbackMall(bizId, { tradeNo, amount, channel, status, payload });
		} else {
			throw new AppError('不支持的支付业务类型', appCode.LOGIC);
		}

		await PayLogModel.insert({
			PAY_BIZ_TYPE: bizType,
			PAY_BIZ_ID: bizId,
			PAY_TRADE_NO: tradeNo || `MOCK_${Date.now()}`,
			PAY_TITLE: result.title || '',
			PAY_DESC: result.desc || '',
			PAY_AMOUNT: String(amount || result.amount || ''),
			PAY_CHANNEL: channel,
			PAY_STATUS: status ? 1 : 0,
			PAY_OBJ: Object.assign({}, payload, result, { timestamp, nonce, sign })
		});

		return result;
	}

	async payFee(feeId, payload = {}) {
		let fee = await FeeModel.getOne({ _id: feeId }, '*');
		if (!fee) return null;
		let feeObj = fee.FEE_OBJ || {};
		return this._prepareCallback({
			bizType: 'fee',
			bizId: feeId,
			tradeNo: payload.tradeNo || `FEE_${feeId}_${Date.now()}`,
			amount: payload.amount || feeObj.amount || '',
			channel: payload.channel || 'mock',
			payload: Object.assign({}, payload, {
				feeTitle: fee.FEE_TITLE,
				houseName: feeObj.houseName || '',
				billType: feeObj.billType || fee.FEE_TITLE || '账单'
			})
		});
	}

	prepareMallOrder(orderId, payload = {}) {
		return this._prepareCallback({
			bizType: 'mall',
			bizId: orderId,
			tradeNo: payload.tradeNo || `MALL_${orderId}_${Date.now()}`,
			amount: payload.amount || '',
			channel: payload.channel || 'mock',
			payload
		});
	}

	async _callbackFee(feeId, { tradeNo, amount, channel, status, payload }) {
		let fee = await FeeModel.getOne({ _id: feeId }, '*');
		if (!fee) {
			throw new AppError('账单不存在', appCode.LOGIC);
		}
		if (fee.FEE_STATUS === 1) {
			return {
				id: feeId,
				title: fee.FEE_TITLE,
				amount: amount || (fee.FEE_OBJ || {}).amount || '',
				payTime: (fee.FEE_OBJ || {}).payTime || ''
			};
		}
		let feeObj = fee.FEE_OBJ || {};
		let payTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
		let paidObj = Object.assign({}, feeObj, {
			tradeNo,
			amount: amount || feeObj.amount || '',
			channel,
			payTime,
			statusText: '已缴费'
		});
		await FeeModel.edit(feeId, {
			FEE_STATUS: 1,
			FEE_OBJ: paidObj
		});

		try {
			let notification = new NotificationService();
			await notification.send('fee.paid', {
				communityName: payload.communityName || feeObj.communityName || '',
				houseName: payload.houseName || feeObj.houseName || '',
				billType: payload.billType || feeObj.billType || fee.FEE_TITLE || '账单',
				amount: amount || feeObj.amount || '',
				billName: fee.FEE_TITLE || '',
				payTime
			}, {
				receiverText: payload.userName || feeObj.userName || ''
			});
		} catch (err) {
			console.log(err);
		}

		return {
			id: feeId,
			title: fee.FEE_TITLE,
			amount: amount || feeObj.amount || '',
			payTime
		};
	}

	async _callbackMall(orderId, { tradeNo, amount, channel, status, payload }) {
		let order = await MallOrderModel.getOne({ _id: orderId }, '*');
		if (!order) {
			throw new AppError('订单不存在', appCode.LOGIC);
		}
		if (order.ORDER_STATUS === 1) {
			return {
				id: orderId,
				title: order.ORDER_TITLE,
				amount: amount || (order.ORDER_OBJ || {}).price || '',
				payTime: (order.ORDER_OBJ || {}).payTime || ''
			};
		}
		let obj = order.ORDER_OBJ || {};
		let payTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
		let newObj = Object.assign({}, obj, {
			tradeNo,
			amount: amount || obj.price || '',
			channel,
			payTime,
			statusText: '已支付'
		});
		await MallOrderModel.edit(orderId, {
			ORDER_STATUS: 1,
			ORDER_OBJ: newObj
		});

		try {
			let notification = new NotificationService();
			await notification.send('mall.orderPaid', {
				communityName: payload.communityName || '',
				userName: payload.userName || '',
				productNames: payload.productNames || order.ORDER_TITLE || '',
				amount: amount || obj.price || '',
				createTime: payTime
			}, {
				receiverText: payload.userName || ''
			});
		} catch (err) {
			console.log(err);
		}

		return {
			id: orderId,
			title: order.ORDER_TITLE,
			amount: amount || obj.price || '',
			payTime
		};
	}
}

module.exports = PaymentService;
