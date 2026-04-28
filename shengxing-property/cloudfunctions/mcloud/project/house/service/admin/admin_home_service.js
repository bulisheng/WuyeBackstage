/**
 * Notes: 后台HOME/登录模块 
 * Date: 2021-06-15 07:48:00 
 * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 */

const BaseProjectAdminService = require('./base_project_admin_service.js');
const UserModel = require('../../model/user_model.js'); 
const NewsModel = require('../../model/news_model.js'); 
const VoteModel = require('../../model/vote_model.js');
const ActivityModel = require('../../model/activity_model.js'); 
const TaskModel = require('../../model/task_model.js'); 
const FeeModel = require('../../model/fee_model.js');
const ComplaintModel = require('../../model/complaint_model.js');
const ServiceOrderModel = require('../../model/service_order_model.js');
const MallGoodsModel = require('../../model/mall_goods_model.js');
const MallOrderModel = require('../../model/mall_order_model.js');
const CustomerTicketModel = require('../../model/customer_ticket_model.js');
const CommunityModel = require('../../model/community_model.js');
const HouseModel = require('../../model/house_model.js');
const PayLogModel = require('../../model/pay_log_model.js');
const NoticeConfigModel = require('../../model/notice_config_model.js');
const constants = require('../../public/constants.js');
const setupUtil = require('../../../../framework/utils/setup/setup_util.js');

class AdminHomeService extends BaseProjectAdminService {

	/**
	 * 首页数据归集
	 */
	async adminHome() {
		let where = {};

		let userCnt = await UserModel.count(where);
		let newsCnt = await NewsModel.count(where);   
		let activityCnt = await ActivityModel.count(where);  
		let voteCnt = await VoteModel.count(where);  
		let taskCnt = await TaskModel.count(where);  
		let feeCnt = await FeeModel.count(where);
		let complaintCnt = await ComplaintModel.count(where);
		let serviceCnt = await ServiceOrderModel.count(where);
		let goodsCnt = await MallGoodsModel.count(where);
		let orderCnt = await MallOrderModel.count(where);
		let ticketCnt = await CustomerTicketModel.count(where);
		let communityCnt = await CommunityModel.count(where);
		let houseCnt = await HouseModel.count(where);
		let payCnt = await PayLogModel.count(where);
		let noticeCnt = await NoticeConfigModel.count(where);
		return [
			{ title: '用户数', cnt: userCnt },
			{ title: '资讯数', cnt: newsCnt },   
			{ title: '活动数', cnt: activityCnt },   
			{ title: '投票项目', cnt: voteCnt },   
			{ title: '报事报修', cnt: taskCnt },   
			{ title: '缴费账单', cnt: feeCnt },
			{ title: '支付日志', cnt: payCnt },
			{ title: '投诉建议', cnt: complaintCnt },
			{ title: '物业服务', cnt: serviceCnt },
			{ title: '商城商品', cnt: goodsCnt },
			{ title: '商城订单', cnt: orderCnt },
			{ title: '客服工单', cnt: ticketCnt },
			{ title: '通知配置', cnt: noticeCnt },
			{ title: '小区数', cnt: communityCnt },
			{ title: '房屋数', cnt: houseCnt },
		]
	}

	// 用户数据清理  
	async clearUserData(userId) {

	}


	//##################首页推荐
	// 首页推荐清理
	async clearVouchData() {
		this.AppError('该功能暂不开放，如有需要请加作者微信：cclinux0730');

	}


	/**添加首页推荐 */
	async updateHomeVouch(node) {
		this.AppError('该功能暂不开放，如有需要请加作者微信：cclinux0730');

	}

	/**删除推荐数据 */
	async delHomeVouch(id) {
		this.AppError('该功能暂不开放，如有需要请加作者微信：cclinux0730'); 
	}
}

module.exports = AdminHomeService;
