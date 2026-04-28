const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const MallOrderModel = require('../../model/mall_order_model.js');

class AdminMallService extends BaseProjectAdminService {
	async getAdminOrderList({
		search,
		sortType,
		sortVal,
		orderBy,
		page,
		size,
		isTotal = true,
		oldTotal
	}) {
		orderBy = orderBy || {
			ORDER_ADD_TIME: 'desc'
		};
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};
		if (util.isDefined(search) && search) {
			where.or = [
				{ ORDER_TITLE: ['like', search] },
				{ ORDER_DESC: ['like', search] },
				{ 'ORDER_OBJ.goodsName': ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			switch (sortType) {
				case 'status':
					where.and.ORDER_STATUS = Number(sortVal);
					break;
				case 'sort':
					orderBy = this.fmtOrderBySort(sortVal, 'ORDER_ADD_TIME');
					break;
			}
		}
		return await MallOrderModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
	}

	async getOrderDetail(id) {
		return await MallOrderModel.getOne({ _id: id }, '*');
	}

	async statusOrder(id, status) {
		return await MallOrderModel.edit(id, {
			ORDER_STATUS: Number(status)
		});
	}
}

module.exports = AdminMallService;
