const BaseProjectModel = require('./base_project_model.js');

class PayLogModel extends BaseProjectModel { }

PayLogModel.CL = BaseProjectModel.C('fee_pay_log');
PayLogModel.FIELD_PREFIX = 'PAY_';
PayLogModel.DB_STRUCTURE = {
	_pid: 'string|true',
	PAY_ID: 'string|true',
	PAY_BIZ_TYPE: 'string|true|comment=业务类型',
	PAY_BIZ_ID: 'string|true|comment=业务ID',
	PAY_TRADE_NO: 'string|false|comment=交易号',
	PAY_TITLE: 'string|false|comment=标题',
	PAY_DESC: 'string|false|comment=描述',
	PAY_AMOUNT: 'string|false|comment=金额',
	PAY_CHANNEL: 'string|false|comment=渠道',
	PAY_STATUS: 'int|true|default=1|comment=状态 0/1/9',
	PAY_OBJ: 'object|true|default={}',
	PAY_ADD_TIME: 'int|true',
	PAY_EDIT_TIME: 'int|true',
	PAY_ADD_IP: 'string|false',
	PAY_EDIT_IP: 'string|false',
};

module.exports = PayLogModel;
