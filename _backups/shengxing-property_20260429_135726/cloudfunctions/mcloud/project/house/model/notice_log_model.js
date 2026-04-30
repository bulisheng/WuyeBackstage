const BaseProjectModel = require('./base_project_model.js');

class NoticeLogModel extends BaseProjectModel { }

NoticeLogModel.CL = BaseProjectModel.C('notice_log');
NoticeLogModel.FIELD_PREFIX = 'NOTICELOG_';
NoticeLogModel.DB_STRUCTURE = {
	_pid: 'string|true',
	NOTICELOG_ID: 'string|true',
	NOTICELOG_CODE: 'string|true|comment=通知编码',
	NOTICELOG_TITLE: 'string|true|comment=通知标题',
	NOTICELOG_SCENE: 'string|true|comment=通知场景',
	NOTICELOG_STATUS: 'int|true|default=1|comment=状态 0/1/9',
	NOTICELOG_RECEIVER: 'string|false|comment=接收对象',
	NOTICELOG_CONTENT: 'string|false|comment=通知内容',
	NOTICELOG_OBJ: 'object|true|default={}',
	NOTICELOG_ADD_TIME: 'int|true',
	NOTICELOG_EDIT_TIME: 'int|true',
	NOTICELOG_ADD_IP: 'string|false',
	NOTICELOG_EDIT_IP: 'string|false',
};

module.exports = NoticeLogModel;
