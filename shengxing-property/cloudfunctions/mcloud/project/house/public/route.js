/**
 * Notes: 路由配置文件
  * Ver : CCMiniCloud Framework 2.0.1 ALL RIGHTS RESERVED BY cclinux0730 (wechat)
 * User: CC
 * Date: 2020-10-14 07:00:00
 */

module.exports = {
	'test/test': 'test/test_controller@test',

	'home/setup_get': 'home_controller@getSetup',

	'passport/login': 'passport_controller@login',
	'passport/phone': 'passport_controller@getPhone',
	'passport/my_detail': 'passport_controller@getMyDetail',
	'passport/register': 'passport_controller@register',
	'passport/edit_base': 'passport_controller@editBase',

	// 物业基础资源
	'community/list': 'module_controller@getCommunityList',
	'house/list': 'module_controller@getHouseList',
	'house/my_list': 'module_controller@getMyHouseList',
	'notice/list': 'module_controller@getNoticeConfigList',

	// 缴费
	'fee/list': 'module_controller@getFeeList',
	'fee/detail': 'module_controller@getFeeDetail',
	'fee/my_list': 'module_controller@getMyFeeList',
	'fee/pay': 'module_controller@payFee',

	// 投诉建议
	'complaint/insert': 'module_controller@insertComplaint',
	'complaint/my_list': 'module_controller@getMyComplaintList',

	// 物业服务
	'service/list': 'module_controller@getServiceList',
	'service/insert': 'module_controller@insertServiceOrder',
	'service/my_list': 'module_controller@getMyServiceList',

	// 商城
	'mall/list': 'module_controller@getMallList',
	'mall/detail': 'module_controller@getMallDetail',
	'mall/order_insert': 'module_controller@createMallOrder',
	'mall/order_list': 'module_controller@getMyMallOrders',

	// 客服
	'customer/faq_list': 'module_controller@getCustomerFaqList',
	'customer/insert': 'module_controller@insertCustomerTicket',
	'customer/my_list': 'module_controller@getMyCustomerTickets',

	// 收藏
	'fav/update': 'fav_controller@updateFav',
	'fav/del': 'fav_controller@delFav',
	'fav/is_fav': 'fav_controller@isFav',
	'fav/my_list': 'fav_controller@getMyFavList',

	'admin/home': 'admin/admin_home_controller@adminHome',
	'admin/clear_vouch': 'admin/admin_home_controller@clearVouchData',
	'admin/notice_list': 'admin/admin_notice_controller@getNoticeConfigList',
	'admin/notice_save': 'admin/admin_notice_controller@saveNoticeConfig',
	'admin/notice_log_list': 'admin/admin_notice_controller@getNoticeLogList',
	'admin/notice_send_test': 'admin/admin_notice_controller@sendNoticeTest',
	'admin/fee_list': 'admin/admin_fee_controller@getAdminFeeList',
	'admin/fee_save': 'admin/admin_fee_controller@saveFee',
	'admin/fee_detail': 'admin/admin_fee_controller@getFeeDetail',
	'admin/fee_status': 'admin/admin_fee_controller@statusFee',
	'admin/fee_remind': 'admin/admin_fee_controller@remindFee',
	'admin/fee_reminder_list': 'admin/admin_fee_controller@getFeeReminderList',
	'admin/fee_data_get': 'admin/admin_fee_controller@feeDataGet',
	'admin/fee_data_export': 'admin/admin_fee_controller@feeDataExport',
	'admin/fee_data_del': 'admin/admin_fee_controller@feeDataDel',
	'admin/complaint_list': 'admin/admin_complaint_controller@getAdminComplaintList',
	'admin/complaint_detail': 'admin/admin_complaint_controller@getComplaintDetail',
	'admin/complaint_status': 'admin/admin_complaint_controller@statusComplaint',
	'admin/complaint_assign': 'admin/admin_complaint_controller@assignComplaint',
	'admin/complaint_reply': 'admin/admin_complaint_controller@replyComplaint',
	'admin/order_list': 'admin/admin_mall_controller@getAdminOrderList',
	'admin/order_detail': 'admin/admin_mall_controller@getOrderDetail',
	'admin/order_status': 'admin/admin_mall_controller@statusOrder',
	'admin/customer_list': 'admin/admin_customer_controller@getAdminCustomerList',
	'admin/customer_detail': 'admin/admin_customer_controller@getCustomerDetail',
	'admin/customer_status': 'admin/admin_customer_controller@statusCustomer',
	'admin/customer_assign': 'admin/admin_customer_controller@assignCustomer',
	'admin/customer_reply': 'admin/admin_customer_controller@replyCustomer',

	'admin/login': 'admin/admin_mgr_controller@adminLogin',
	'admin/mgr_list': 'admin/admin_mgr_controller@getMgrList',
	'admin/mgr_insert': 'admin/admin_mgr_controller@insertMgr#demo',
	'admin/mgr_del': 'admin/admin_mgr_controller@delMgr#demo',
	'admin/mgr_detail': 'admin/admin_mgr_controller@getMgrDetail',
	'admin/mgr_edit': 'admin/admin_mgr_controller@editMgr#demo',
	'admin/mgr_status': 'admin/admin_mgr_controller@statusMgr#demo',
	'admin/mgr_pwd': 'admin/admin_mgr_controller@pwdMgr#demo',
	'admin/log_list': 'admin/admin_mgr_controller@getLogList',
	'admin/log_clear': 'admin/admin_mgr_controller@clearLog#demo',

	'admin/setup_set': 'admin/admin_setup_controller@setSetup#demo',
	'admin/setup_set_content': 'admin/admin_setup_controller@setContentSetup#demo',
	'admin/setup_qr': 'admin/admin_setup_controller@genMiniQr',

	// 用户
	'admin/user_list': 'admin/admin_user_controller@getUserList',
	'admin/user_detail': 'admin/admin_user_controller@getUserDetail',
	'admin/user_del': 'admin/admin_user_controller@delUser#demo',
	'admin/user_status': 'admin/admin_user_controller@statusUser#demo',

	'admin/user_data_get': 'admin/admin_user_controller@userDataGet',
	'admin/user_data_export': 'admin/admin_user_controller@userDataExport',
	'admin/user_data_del': 'admin/admin_user_controller@userDataDel',

	'payment/callback': 'payment_controller@callback',


	// 内容  
	'home/list': 'home_controller@getHomeList',
	'news/list': 'news_controller@getNewsList',
	'news/view': 'news_controller@viewNews',

	'admin/news_list': 'admin/admin_news_controller@getAdminNewsList',
	'admin/news_insert': 'admin/admin_news_controller@insertNews#demo',
	'admin/news_detail': 'admin/admin_news_controller@getNewsDetail',
	'admin/news_edit': 'admin/admin_news_controller@editNews#demo',
	'admin/news_update_forms': 'admin/admin_news_controller@updateNewsForms#demo',
	'admin/news_update_pic': 'admin/admin_news_controller@updateNewsPic#demo',
	'admin/news_update_content': 'admin/admin_news_controller@updateNewsContent#demo',
	'admin/news_del': 'admin/admin_news_controller@delNews#demo',
	'admin/news_sort': 'admin/admin_news_controller@sortNews#demo',
	'admin/news_status': 'admin/admin_news_controller@statusNews#demo',
	'admin/news_vouch': 'admin/admin_news_controller@vouchNews#demo',

	// 活动
	'activity/list': 'activity_controller@getActivityList',
	'activity/view': 'activity_controller@viewActivity',
	'activity/detail_for_join': 'activity_controller@detailForActivityJoin',
	'activity/join': 'activity_controller@activityJoin',
	'activity/list_by_day': 'activity_controller@getActivityListByDay',
	'activity/list_has_day': 'activity_controller@getActivityHasDaysFromDay',
	'activity/my_join_list': 'activity_controller@getMyActivityJoinList',
	'activity/my_join_cancel': 'activity_controller@cancelMyActivityJoin',
	'activity/my_join_detail': 'activity_controller@getMyActivityJoinDetail',
	'activity/my_join_someday': 'activity_controller@getMyActivityJoinSomeday',
	'activity/my_join_self': 'activity_controller@myJoinSelf',

	'admin/activity_list': 'admin/admin_activity_controller@getAdminActivityList',
	'admin/activity_insert': 'admin/admin_activity_controller@insertActivity#demo',
	'admin/activity_detail': 'admin/admin_activity_controller@getActivityDetail',
	'admin/activity_edit': 'admin/admin_activity_controller@editActivity#demo',
	'admin/activity_update_forms': 'admin/admin_activity_controller@updateActivityForms#demo',
	'admin/activity_clear': 'admin/admin_activity_controller@clearActivityAll#demo',
	'admin/activity_del': 'admin/admin_activity_controller@delActivity#demo',
	'admin/activity_sort': 'admin/admin_activity_controller@sortActivity#demo',
	'admin/activity_vouch': 'admin/admin_activity_controller@vouchActivity#demo',
	'admin/activity_status': 'admin/admin_activity_controller@statusActivity#demo',
	'admin/activity_join_list': 'admin/admin_activity_controller@getActivityJoinList',
	'admin/activity_join_status': 'admin/admin_activity_controller@statusActivityJoin#demo',
	'admin/activity_cancel_join_all': 'admin/admin_activity_controller@cancelActivityJoinAll#demo',
	'admin/activity_join_del': 'admin/admin_activity_controller@delActivityJoin#demo',
	'admin/activity_join_scan': 'admin/admin_activity_controller@scanActivityJoin',
	'admin/activity_join_checkin': 'admin/admin_activity_controller@checkinActivityJoin',
	'admin/activity_self_checkin_qr': 'admin/admin_activity_controller@genActivitySelfCheckinQr',
	'admin/activity_join_data_get': 'admin/admin_activity_controller@activityJoinDataGet',
	'admin/activity_join_data_export': 'admin/admin_activity_controller@activityJoinDataExport',
	'admin/activity_join_data_del': 'admin/admin_activity_controller@activityJoinDataDel',


	// 投票
	'vote/list': 'vote_controller@getVoteList',
	'vote/view': 'vote_controller@viewVote',
	'vote/do': 'vote_controller@doVote',
	'vote/my_cancel': 'vote_controller@cancelMyVote',
	'vote/my_list': 'vote_controller@getMyVoteList',

	'admin/vote_list': 'admin/admin_vote_controller@getAdminVoteList',
	'admin/vote_insert': 'admin/admin_vote_controller@insertVote#demo',
	'admin/vote_detail': 'admin/admin_vote_controller@getVoteDetail',
	'admin/vote_edit': 'admin/admin_vote_controller@editVote#demo',
	'admin/vote_update_forms': 'admin/admin_vote_controller@updateVoteForms#demo',
	'admin/vote_clear': 'admin/admin_vote_controller@clearVoteAll#demo',
	'admin/vote_del': 'admin/admin_vote_controller@delVote#demo',
	'admin/vote_sort': 'admin/admin_vote_controller@sortVote#demo',
	'admin/vote_vouch': 'admin/admin_vote_controller@vouchVote#demo',
	'admin/vote_status': 'admin/admin_vote_controller@statusVote#demo',
	'admin/vote_cancel_all': 'admin/admin_vote_controller@cancelVoteAll#demo',
	'admin/vote_stat_all': 'admin/admin_vote_controller@statVoteAll',

	// 维修工单
	'task/my_type_count': 'task_controller@getTaskCountByType',
	'task/my_list': 'task_controller@getMyTaskList',
	'task/insert': 'task_controller@insertTask',
	'task/detail': 'task_controller@getTaskDetail',
	'task/edit': 'task_controller@editTask',
	'task/del': 'task_controller@delTask',
	'task/task_update_forms': 'task_controller@updateTaskForms',

	'admin/task_list': 'admin/admin_task_controller@getAdminTaskList',
	'admin/task_detail': 'admin/admin_task_controller@getTaskDetail',
	'admin/task_del': 'admin/admin_task_controller@delTask#demo',
	'admin/task_status': 'admin/admin_task_controller@statusTask#demo',
	'admin/task_data_get': 'admin/admin_task_controller@taskDataGet',
	'admin/task_data_export': 'admin/admin_task_controller@taskDataExport',
	'admin/task_data_del': 'admin/admin_task_controller@taskDataDel',
}
