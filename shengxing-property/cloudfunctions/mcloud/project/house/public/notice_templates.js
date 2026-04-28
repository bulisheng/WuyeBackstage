const NOTICE_TEMPLATES = {
	'repair.created': {
		title: '报修通知',
		scene: 'repair',
		content:
`【报修通知】

小区：{communityName}
房号：{building}-{unit}-{room}
用户：{userName} {phone}

类型：{category}
内容：{content}

预约时间：{appointmentTime}
优先级：{priority}

提交时间：{createTime}`
	},

	'repair.assigned': {
		title: '报修已分配',
		scene: 'repair',
		content:
`【报修已分配】

小区：{communityName}
房号：{houseName}

维修人员：{staffName}
联系电话：{staffPhone}

预约时间：{appointmentTime}

请及时处理`
	},

	'repair.appointmentChanged': {
		title: '报修预约变更',
		scene: 'repair',
		content:
`【报修预约变更】

小区：{communityName}
房号：{houseName}

原时间：{oldTime}
新时间：{newTime}

请注意调整安排`
	},

	'repair.visitReminder': {
		title: '上门提醒',
		scene: 'repair',
		content:
`【上门提醒】

小区：{communityName}
房号：{houseName}

预约时间：{appointmentTime}
用户：{userName} {phone}

请按时上门处理`
	},

	'complaint.created': {
		title: '投诉建议',
		scene: 'complaint',
		content:
`【投诉建议】

小区：{communityName}
房号：{houseName}

类型：{type}
内容：{content}

是否匿名：{anonymousText}

提交时间：{createTime}`
	},

	'complaint.replied': {
		title: '投诉已处理',
		scene: 'complaint',
		content:
`【投诉已处理】

小区：{communityName}
房号：{houseName}

处理结果：
{replyContent}

处理时间：{time}`
	},

	'complaint.assigned': {
		title: '投诉已分配',
		scene: 'complaint',
		content:
`【投诉已分配】

小区：{communityName}
房号：{houseName}

负责人：{assigneeName}
联系电话：{assigneePhone}

投诉内容：
{content}

分配时间：{time}`
	},

	'fee.billCreated': {
		title: '账单通知',
		scene: 'fee',
		content:
`【账单通知】

小区：{communityName}
房号：{houseName}

账单类型：{billType}
金额：¥{amount}

截止日期：{dueDate}

请及时缴费`
	},

	'fee.paid': {
		title: '缴费成功',
		scene: 'fee',
		content:
`【缴费成功】

小区：{communityName}
房号：{houseName}

金额：¥{amount}
账单：{billName}

支付时间：{payTime}`
	},

	'fee.overdue': {
		title: '缴费逾期提醒',
		scene: 'fee',
		content:
`【缴费逾期提醒】

小区：{communityName}
房号：{houseName}

账单：{billName}
金额：¥{amount}
截止日期：{dueDate}

已逾期：{overdueDays}天

请尽快联系业主处理`
	},

	'fee.reminder': {
		title: '账单催缴',
		scene: 'fee',
		content:
`【账单催缴】

小区：{communityName}
房号：{houseName}

账单：{billName}
金额：¥{amount}
截止日期：{dueDate}

催缴方式：{method}
催缴结果：{result}

催缴时间：{time}`
	},

	'mall.orderCreated': {
		title: '新订单通知',
		scene: 'mall',
		content:
`【新订单通知】

小区：{communityName}
用户：{userName} {phone}

商品：{productNames}
数量：{number}
金额：¥{amount}

下单时间：{createTime}`
	},

	'mall.orderPaid': {
		title: '订单已支付',
		scene: 'mall',
		content:
`【订单已支付】

小区：{communityName}
用户：{userName}

商品：{productNames}
金额：¥{amount}

支付时间：{payTime}`
	},

	'mall.orderCancelled': {
		title: '订单取消',
		scene: 'mall',
		content:
`【订单取消】

小区：{communityName}
用户：{userName}

订单号：{orderNo}

已取消`
	},

	'customer.transferRequested': {
		title: '人工客服请求',
		scene: 'customer',
		content:
`【人工客服请求】

小区：{communityName}
用户：{userName} {phone}

问题：
{content}

时间：{createTime}

请尽快回复`
	},

	'customer.assigned': {
		title: '客服已分配',
		scene: 'customer',
		content:
`【客服已分配】

小区：{communityName}
房号：{houseName}

客服：{assigneeName}
联系电话：{assigneePhone}

问题：
{content}

分配时间：{time}`
	},

	'customer.replied': {
		title: '客服已回复',
		scene: 'customer',
		content:
`【客服已回复】

小区：{communityName}
房号：{houseName}

回复内容：
{replyContent}

回复时间：{time}`
	},

	'service.created': {
		title: '物业服务申请',
		scene: 'service',
		content:
`【物业服务申请】

小区：{communityName}
房号：{houseName}

服务类型：{serviceType}
内容：{content}

提交时间：{createTime}`
	}
};

module.exports = NOTICE_TEMPLATES;
