const BaseProjectController = require('./base_project_controller.js');
const PaymentService = require('../service/payment_service.js');

class PaymentController extends BaseProjectController {
	async callback() {
		let input = this.validateData({
			bizType: 'must|string|name=业务类型',
			bizId: 'must|id',
			tradeNo: 'string|name=交易号',
			amount: 'string|name=金额',
			channel: 'string|name=渠道',
			status: 'int|default=1',
			timestamp: 'must|int|name=时间戳',
			nonce: 'must|string|name=随机串',
			sign: 'must|string|name=签名',
			payload: 'object|default={}'
		});

		let service = new PaymentService();
		return await service.callback(input);
	}
}

module.exports = PaymentController;
