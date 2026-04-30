const BaseProjectModel = require('./base_project_model.js');

function makeRecordModel({ clName, prefix }) {
	class RecordModel extends BaseProjectModel { }

	RecordModel.CL = BaseProjectModel.C(clName);
	RecordModel.FIELD_PREFIX = prefix;
	RecordModel.DB_STRUCTURE = {
		_pid: 'string|true',
		[prefix + 'ID']: 'string|true',
		[prefix + 'TITLE']: 'string|true|comment=标题',
		[prefix + 'DESC']: 'string|false|comment=描述',
		[prefix + 'STATUS']: 'int|true|default=1|comment=状态 0/1/9',
		[prefix + 'USER_ID']: 'string|false|comment=用户openid',
		[prefix + 'FORMS']: 'array|true|default=[]',
		[prefix + 'OBJ']: 'object|true|default={}',
		[prefix + 'ADD_TIME']: 'int|true',
		[prefix + 'EDIT_TIME']: 'int|true',
		[prefix + 'ADD_IP']: 'string|false',
		[prefix + 'EDIT_IP']: 'string|false',
	};

	return RecordModel;
}

module.exports = makeRecordModel;
