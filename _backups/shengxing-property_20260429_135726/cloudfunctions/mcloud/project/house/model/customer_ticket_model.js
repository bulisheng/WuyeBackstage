const makeRecordModel = require('./base_record_model.js');

module.exports = makeRecordModel({
	clName: 'customer_ticket',
	prefix: 'TICKET_'
});
