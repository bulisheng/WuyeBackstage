const BaseProjectService = require('./base_project_service.js');
const dataUtil = require('../../../framework/utils/data_util.js');
const util = require('../../../framework/utils/util.js');

class ModuleService extends BaseProjectService {
	_getPrefix(Model) {
		return Model.FIELD_PREFIX || '';
	}

	_getTitle(input, forms) {
		let obj = dataUtil.dbForms2Obj(forms || []);
		return input.title || obj.title || obj.name || obj.billType || obj.goodsName || obj.communityName || obj.question || obj.serviceType || obj.type || '未命名';
	}

	_getDesc(input, forms) {
		let obj = dataUtil.dbForms2Obj(forms || []);
		return input.desc || obj.desc || obj.content || obj.description || obj.reason || '';
	}

	async getList(Model, input = {}, { userId = '', extraWhere = {}, orderBy = {}, status = null, withUser = false } = {}) {
		let where = Object.assign({}, extraWhere);
		if (userId) where[Model.FIELD_PREFIX + 'USER_ID'] = userId;
		if (status !== null && status !== undefined && status !== '') where[Model.FIELD_PREFIX + 'STATUS'] = Number(status);
		if (util.isDefined(input.search) && input.search) {
			where[Model.FIELD_PREFIX + 'TITLE'] = {
				$regex: '.*' + input.search,
				$options: 'i'
			};
		}

		orderBy = orderBy || {};
		if (Object.keys(orderBy).length == 0) {
			orderBy[Model.FIELD_PREFIX + 'ADD_TIME'] = 'desc';
		}

		return await Model.getList(where, '*', orderBy, input.page || 1, input.size || 20, input.isTotal !== false, input.oldTotal || 0);
	}

	async getOne(Model, id, extraWhere = {}) {
		let where = Object.assign({ _id: id }, extraWhere);
		return await Model.getOne(where, '*');
	}

	async insert(Model, userId, input = {}, { defaultStatus = 0 } = {}) {
		let forms = Array.isArray(input.forms) ? input.forms : [];
		let data = {};
		data[Model.FIELD_PREFIX + 'TITLE'] = this._getTitle(input, forms);
		data[Model.FIELD_PREFIX + 'DESC'] = this._getDesc(input, forms);
		data[Model.FIELD_PREFIX + 'STATUS'] = Number(util.isDefined(input.status) ? input.status : defaultStatus);
		data[Model.FIELD_PREFIX + 'FORMS'] = forms;
		data[Model.FIELD_PREFIX + 'OBJ'] = dataUtil.dbForms2Obj(forms);
		if (userId) data[Model.FIELD_PREFIX + 'USER_ID'] = userId;
		return await Model.insert(data);
	}

	async edit(Model, id, input = {}) {
		let forms = Array.isArray(input.forms) ? input.forms : [];
		let data = {};
		if (util.isDefined(input.title)) data[Model.FIELD_PREFIX + 'TITLE'] = input.title;
		if (util.isDefined(input.desc)) data[Model.FIELD_PREFIX + 'DESC'] = input.desc;
		if (util.isDefined(input.status)) data[Model.FIELD_PREFIX + 'STATUS'] = Number(input.status);
		if (forms.length > 0) {
			data[Model.FIELD_PREFIX + 'FORMS'] = forms;
			data[Model.FIELD_PREFIX + 'OBJ'] = dataUtil.dbForms2Obj(forms);
		}
		await Model.edit(id, data);
	}

	async del(Model, id) {
		await Model.del(id);
	}

	async seed(Model, rows = []) {
		let cnt = await Model.count({});
		if (cnt > 0) return;
		if (rows.length > 0) {
			await Model.insertBatch(rows);
		}
	}
}

module.exports = ModuleService;
