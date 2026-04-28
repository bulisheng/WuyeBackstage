const makeRecordModel = require('./base_record_model.js');

module.exports = makeRecordModel({
	clName: 'fee_reminder_log',
	prefix: 'REMINDER_'
});
