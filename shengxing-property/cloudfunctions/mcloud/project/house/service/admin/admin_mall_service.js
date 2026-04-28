const BaseProjectAdminService = require('./base_project_admin_service.js');
const util = require('../../../../framework/utils/util.js');
const timeUtil = require('../../../../framework/utils/time_util.js');
const NotificationService = require('../../notification_service.js');
const PaymentService = require('../../payment_service.js');
const MallGoodsModel = require('../../model/mall_goods_model.js');
const MallOrderModel = require('../../model/mall_order_model.js');

class AdminMallService extends BaseProjectAdminService {
	async getAdminGoodsList({
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
			MALL_ADD_TIME: 'desc'
		};
		let where = {};
		where.and = {
			_pid: this.getProjectId()
		};
		if (util.isDefined(search) && search) {
			where.or = [
				{ MALL_TITLE: ['like', search] },
				{ MALL_DESC: ['like', search] },
				{ 'MALL_OBJ.name': ['like', search] },
			];
		} else if (sortType && util.isDefined(sortVal)) {
			switch (sortType) {
				case 'status':
					where.and.MALL_STATUS = Number(sortVal);
					break;
				case 'sort':
					orderBy = this.fmtOrderBySort(sortVal, 'MALL_ADD_TIME');
					break;
			}
		}
		let result = await MallGoodsModel.getList(where, '*', orderBy, page, size, isTotal, oldTotal);
		result.condition = encodeURIComponent(JSON.stringify(where));
		return result;
	}

	async getGoodsDetail(id) {
		return await MallGoodsModel.getOne({ _id: id }, '*');
	}

	async saveGoods(input) {
		let oldGoods = null;
		if (input.id) {
			oldGoods = await MallGoodsModel.getOne({ _id: input.id }, '*');
		}
		let goodsObj = Object.assign({}, oldGoods ? (oldGoods.MALL_OBJ || {}) : {}, input.obj || {});
		if (util.isDefined(input.cover)) goodsObj.cover = input.cover;
		if (util.isDefined(input.price)) goodsObj.price = input.price;
		if (util.isDefined(input.stock)) goodsObj.stock = input.stock;
		if (util.isDefined(input.name)) goodsObj.name = input.name;
		let data = {
			MALL_TITLE: input.title,
			MALL_DESC: input.desc || '',
			MALL_STATUS: Number(util.isDefined(input.status) ? input.status : (oldGoods ? oldGoods.MALL_STATUS : 1)),
			MALL_OBJ: goodsObj,
			MALL_FORMS: (Array.isArray(input.forms) && input.forms.length > 0) ? input.forms : (oldGoods ? (oldGoods.MALL_FORMS || []) : [])
		};
		if (input.id) {
			await MallGoodsModel.edit(input.id, data);
			return { id: input.id };
		}
		let id = await MallGoodsModel.insert(data);
		return { id };
	}

	async statusGoods(id, status) {
		return await MallGoodsModel.edit(id, {
			MALL_STATUS: Number(status)
		});
	}

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
		let order = await MallOrderModel.getOne({ _id: id }, '*');
		if (!order) return null;
		let obj = order.ORDER_OBJ || {};
		let next = Number(status);
		let patch = {
			ORDER_STATUS: next,
			ORDER_OBJ: Object.assign({}, obj, {
				statusText: next === 2 ? '已发货' : (next === 3 ? '已完成' : (next === 4 ? '已退款' : (next === 9 ? '已关闭' : '待支付')))
			})
		};
		if (next === 2) {
			patch.ORDER_OBJ.shippingTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		}
		if (next === 4) {
			patch.ORDER_OBJ.refundTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		}
		return await MallOrderModel.edit(id, patch);
	}

	async shipOrder(id, input = {}) {
		let order = await MallOrderModel.getOne({ _id: id }, '*');
		if (!order) return null;
		let obj = order.ORDER_OBJ || {};
		let shippingTime = timeUtil.timestamp2Time(Date.now(), 'Y-M-D h:m');
		let patch = {
			ORDER_STATUS: 2,
			ORDER_OBJ: Object.assign({}, obj, {
				shippingNo: input.shippingNo || '',
				shippingCompany: input.shippingCompany || '',
				shippingTime,
				statusText: '已发货'
			})
		};
		await MallOrderModel.edit(id, patch);
		try {
			let notification = new NotificationService();
			await notification.send('mall.orderShipped', {
				communityName: input.communityName || '',
				userName: input.userName || '',
				productNames: input.productNames || order.ORDER_TITLE || '',
				shippingNo: input.shippingNo || '',
				time: shippingTime
			}, {
				receiverText: input.userName || ''
			});
		} catch (err) {
			console.log(err);
		}
		return patch;
	}

	async refundOrder(id, input = {}) {
		let payment = new PaymentService();
		return await payment.refund('mall', id, input);
	}
}

module.exports = AdminMallService;
