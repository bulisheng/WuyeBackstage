const BaseProjectModel = require('./base_project_model.js');

class UserHouseModel extends BaseProjectModel { }

UserHouseModel.CL = BaseProjectModel.C('user_house');
UserHouseModel.FIELD_PREFIX = 'USERHOUSE_';
UserHouseModel.DB_STRUCTURE = {
	_pid: 'string|true',
	USERHOUSE_ID: 'string|true',
	USER_MINI_OPENID: 'string|true|comment=用户openid',
	USER_NAME: 'string|false|comment=用户名称',
	USER_MOBILE: 'string|false|comment=手机号',
	COMMUNITY_NAME: 'string|false|comment=小区名称',
	HOUSE_TEXT: 'string|true|comment=楼栋房号',
	USERHOUSE_STATUS: 'int|true|default=1|comment=状态 0/1/9',
	USERHOUSE_ADD_TIME: 'int|true',
	USERHOUSE_EDIT_TIME: 'int|true',
	USERHOUSE_ADD_IP: 'string|false',
	USERHOUSE_EDIT_IP: 'string|false',
};

module.exports = UserHouseModel;
