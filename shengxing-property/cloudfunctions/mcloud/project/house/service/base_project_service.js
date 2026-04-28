/**
 * Notes: 业务基类 
 * Date: 2021-03-15 04:00:00 
 */

const dbUtil = require('../../../framework/database/db_util.js');
const util = require('../../../framework/utils/util.js');
const AdminModel = require('../../../framework/platform/model/admin_model.js');
const NewsModel = require('../model/news_model.js');
const ActivityModel = require('../model/activity_model.js');
const VoteModel = require('../model/vote_model.js');
const FeeModel = require('../model/fee_model.js');
const ComplaintModel = require('../model/complaint_model.js');
const ServiceOrderModel = require('../model/service_order_model.js');
const MallGoodsModel = require('../model/mall_goods_model.js');
const MallOrderModel = require('../model/mall_order_model.js');
const CustomerTicketModel = require('../model/customer_ticket_model.js');
const CommunityModel = require('../model/community_model.js');
const HouseModel = require('../model/house_model.js');
const NoticeConfigModel = require('../model/notice_config_model.js');
const NoticeLogModel = require('../model/notice_log_model.js');
const PayLogModel = require('../model/pay_log_model.js');
const UserHouseModel = require('../model/user_house_model.js');
const BaseService = require('../../../framework/platform/service/base_service.js');

class BaseProjectService extends BaseService {
	getProjectId() {
		return util.getProjectId();
	}

	async initSetup() {
		let F = (c) => 'bx_' + c;
		const INSTALL_CL = 'setup_house';
		const COLLECTIONS = ['setup', 'admin', 'log', 'task', 'news', 'fav', 'user', 'activity', 'activity_join', 'vote', 'vote_join', 'fee_bill', 'complaint', 'service_order', 'mall_goods', 'mall_order', 'customer_ticket', 'community', 'house', 'user_house', 'notice_config', 'notice_log', 'fee_pay_log'];
		const CONST_PIC = '/images/cover.gif';

		const NEWS_CATE = '1=物业公告,2=小区规约,3=业委会,4=房屋租售';
		const VOTE_CATE = '1=业主投票';
		const ACTIVITY_CATE = '1=公益活动,2=室内活动,3=户外活动,4=其他活动';


		if (await dbUtil.isExistCollection(F(INSTALL_CL))) {
			return;
		}

		console.log('### initSetup...');

		let arr = COLLECTIONS;
		for (let k = 0; k < arr.length; k++) {
			if (!await dbUtil.isExistCollection(F(arr[k]))) {
				await dbUtil.createCollection(F(arr[k]));
			}
		}

		if (await dbUtil.isExistCollection(F('admin'))) {
			let adminCnt = await AdminModel.count({});
			if (adminCnt == 0) {
				let data = {};
				data.ADMIN_NAME = 'admin';
				data.ADMIN_PASSWORD = 'e10adc3949ba59abbe56e057f20f883e';
				data.ADMIN_DESC = '超管';
				data.ADMIN_TYPE = 1;
				await AdminModel.insert(data);
			}
		}


		if (await dbUtil.isExistCollection(F('news'))) {
			let newsCnt = await NewsModel.count({});
			if (newsCnt == 0) {
				let newsArr = NEWS_CATE.split(',');
				for (let j in newsArr) {
					let title = newsArr[j].split('=')[1];
					let cateId = newsArr[j].split('=')[0];

					let data = {};
					data.NEWS_TITLE = title + '标题1';
					data.NEWS_DESC = title + '简介1';
					data.NEWS_CATE_ID = cateId;
					data.NEWS_CATE_NAME = title;
					data.NEWS_CONTENT = [{ type: 'text', val: title + '内容1' }];
					data.NEWS_PIC = [CONST_PIC];

					await NewsModel.insert(data);
				}
			}
		}

		if (await dbUtil.isExistCollection(F('vote'))) {
			let voteCnt = await VoteModel.count({});
			if (voteCnt == 0) {
				let voteArr = VOTE_CATE.split(',');
				for (let j in voteArr) {
					let title = voteArr[j].split('=')[1];
					let cateId = voteArr[j].split('=')[0];

					let data = {};
					data.VOTE_TITLE = title + '1';
					data.VOTE_CATE_ID = cateId;
					data.VOTE_CATE_NAME = title;
					data.VOTE_START = this._timestamp;
					data.VOTE_END = this._timestamp + 86400 * 1000 * 30;
					data.VOTE_ITEM = [
						{ label: '选项1', cnt: 0 },
						{ label: '选项2', cnt: 0 },
						{ label: '选项3', cnt: 0 },
						{ label: '选项4', cnt: 0 },
						{ label: '选项5', cnt: 0 },
					]

					data.VOTE_OBJ = {
						cover: [CONST_PIC],
						desc: []
					};

					await VoteModel.insert(data);
				}
			}
		}

		if (await dbUtil.isExistCollection(F('activity'))) {
			let activityCnt = await ActivityModel.count({});
			if (activityCnt == 0) {
				let activityArr = ACTIVITY_CATE.split(',');
				for (let j in activityArr) {
					let title = activityArr[j].split('=')[1];
					let cateId = activityArr[j].split('=')[0];

					let data = {};
					data.ACTIVITY_TITLE = title + '标题1';
					data.ACTIVITY_CATE_ID = cateId;
					data.ACTIVITY_CATE_NAME = title;
					data.ACTIVITY_ADDRESS = '本小区前坪';
					data.ACTIVITY_START = this._timestamp;
					data.ACTIVITY_END = this._timestamp + 86400 * 1000 * 30;
					data.ACTIVITY_STOP = this._timestamp + 86400 * 1000 * 30;
					data.ACTIVITY_OBJ = {
						cover: [CONST_PIC],
						desc: [{ type: 'text', val: title + '活动内容1' }]
					};

					await ActivityModel.insert(data);
				}
			}
		}

		const makeRecord = (Model, title, desc, obj = {}, status = 1, forms = []) => {
			let prefix = Model.FIELD_PREFIX;
			return {
				[prefix + 'TITLE']: title,
				[prefix + 'DESC']: desc,
				[prefix + 'STATUS']: status,
				[prefix + 'FORMS']: forms,
				[prefix + 'OBJ']: obj
			};
		};

		if (await dbUtil.isExistCollection(F('fee_bill'))) {
			await this._seedRecords(FeeModel, [
				makeRecord(FeeModel, '物业费 2024年5月', '￥280.00，截止 2024-05-20', { billType: '物业费', amount: '280.00', dueDate: '2024-05-20', houseName: '1栋2单元1201', statusText: '待缴费' }, 0),
				makeRecord(FeeModel, '水费 2024年5月', '￥68.50，已缴费', { billType: '水费', amount: '68.50', payTime: '2024-05-18 09:30', houseName: '1栋2单元1201', statusText: '已缴费' }, 1),
				makeRecord(FeeModel, '电费 2024年5月', '￥132.40，截止 2024-05-30', { billType: '电费', amount: '132.40', dueDate: '2024-05-30', houseName: '1栋2单元1201', statusText: '待缴费' }, 0),
			]);
		}

		if (await dbUtil.isExistCollection(F('complaint'))) {
			await this._seedRecords(ComplaintModel, [
				makeRecord(ComplaintModel, '小区路灯报修问题', '夜间照明不足，希望尽快处理。', { type: '投诉', anonymous: true, statusText: '处理中' }, 0),
			]);
		}

		if (await dbUtil.isExistCollection(F('service_order'))) {
			await this._seedRecords(ServiceOrderModel, [
				makeRecord(ServiceOrderModel, '快递代寄', '足不出户上门收件', { serviceType: '快递代寄', statusText: '待接单' }, 0),
				makeRecord(ServiceOrderModel, '药品代取', '帮您代取常用药品', { serviceType: '药品代取', statusText: '处理中' }, 0),
			]);
		}

		if (await dbUtil.isExistCollection(F('mall_goods'))) {
			await this._seedRecords(MallGoodsModel, [
				makeRecord(MallGoodsModel, '五常大米 5kg', '社区优选，支持配送', { price: '59.90', stock: 32, cover: '/projects/house/images/home/cute_1.jpg' }, 1),
				makeRecord(MallGoodsModel, '厨房纸巾 6卷装', '限时特惠', { price: '19.90', stock: 48, cover: '/projects/house/images/home/cute_2.jpg' }, 1),
			]);
		}

		if (await dbUtil.isExistCollection(F('mall_order'))) {
			await this._seedRecords(MallOrderModel, [
				makeRecord(MallOrderModel, '五常大米 5kg', '订单已创建，等待支付', { goodsName: '五常大米 5kg', price: '59.90', orderStatus: '待支付' }, 0),
			]);
		}

		if (await dbUtil.isExistCollection(F('customer_ticket'))) {
			await this._seedRecords(CustomerTicketModel, [
				makeRecord(CustomerTicketModel, '咨询物业费', '我想查看本月账单', { source: '在线客服', statusText: '待回复' }, 0),
			]);
		}

		if (await dbUtil.isExistCollection(F('community'))) {
			await this._seedRecords(CommunityModel, [
				makeRecord(CommunityModel, '幸福里小区', '当前默认小区', { current: true, address: '示例路 1 号' }, 1),
				makeRecord(CommunityModel, '阳光城小区', '示例切换小区', { current: false, address: '示例路 2 号' }, 1),
			]);
		}

		if (await dbUtil.isExistCollection(F('house'))) {
			await this._seedRecords(HouseModel, [
				makeRecord(HouseModel, '1栋2单元1201', '建筑面积 98㎡', { communityName: '幸福里小区', building: '1栋', unit: '2单元', no: '1201' }, 1),
				makeRecord(HouseModel, '1栋1单元801', '建筑面积 76㎡', { communityName: '幸福里小区', building: '1栋', unit: '1单元', no: '801' }, 1),
			]);
		}

		if (await dbUtil.isExistCollection(F('notice_config'))) {
			await this._seedRecords(NoticeConfigModel, [
				{
					NOTICE_CODE: 'repair.created',
					NOTICE_TITLE: '报修通知',
					NOTICE_DESC: '用户提交报修后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
				{
					NOTICE_CODE: 'fee.paid',
					NOTICE_TITLE: '缴费成功',
					NOTICE_DESC: '用户缴费后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
				{
					NOTICE_CODE: 'complaint.created',
					NOTICE_TITLE: '投诉建议',
					NOTICE_DESC: '用户提交投诉后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
				{
					NOTICE_CODE: 'service.created',
					NOTICE_TITLE: '物业服务',
					NOTICE_DESC: '用户提交服务后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
				{
					NOTICE_CODE: 'mall.orderCreated',
					NOTICE_TITLE: '商城下单',
					NOTICE_DESC: '用户下单后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
				{
					NOTICE_CODE: 'customer.transferRequested',
					NOTICE_TITLE: '转人工客服',
					NOTICE_DESC: '用户转人工后通知',
					NOTICE_STATUS: 1,
					NOTICE_OBJ: {
						channel: 'log',
						webhook: '',
						miniTemplateId: '',
						page: '',
						atMobiles: []
					}
				},
			]);
		}

		if (await dbUtil.isExistCollection(F('notice_log'))) {
			await this._seedRecords(NoticeLogModel, []);
		}

		if (await dbUtil.isExistCollection(F('fee_pay_log'))) {
			await this._seedRecords(PayLogModel, []);
		}


		if (!await dbUtil.isExistCollection(F(INSTALL_CL))) {
			await dbUtil.createCollection(F(INSTALL_CL));
		}
	}

	async _seedRecords(Model, rows) {
		let cnt = await Model.count({});
		if (cnt > 0 || rows.length == 0) return;
		await Model.insertBatch(rows);
	}

}

module.exports = BaseProjectService;
