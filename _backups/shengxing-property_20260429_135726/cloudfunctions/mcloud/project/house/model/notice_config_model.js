const BaseProjectModel = require('./base_project_model.js');

class NoticeConfigModel extends BaseProjectModel { }

NoticeConfigModel.CL = BaseProjectModel.C('notice_config');
NoticeConfigModel.FIELD_PREFIX = 'NOTICE_';
NoticeConfigModel.DB_STRUCTURE = {
	_pid: 'string|true',
	NOTICE_ID: 'string|true',
	NOTICE_CODE: 'string|true|comment=通知编码',
	NOTICE_TITLE: 'string|true|comment=通知名称',
	NOTICE_DESC: 'string|false|comment=通知说明',
	NOTICE_STATUS: 'int|true|default=1|comment=状态 0/1/9',
	NOTICE_OBJ: 'object|true|default={}',
	NOTICE_FORMS: 'array|true|default=[]',
	NOTICE_ADD_TIME: 'int|true',
	NOTICE_EDIT_TIME: 'int|true',
	NOTICE_ADD_IP: 'string|false',
	NOTICE_EDIT_IP: 'string|false',
};

module.exports = NoticeConfigModel;
