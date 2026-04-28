# 钉钉机器人配置与通知规范

---

## 一、机器人配置总表

| 机器人名称 | Webhook | 加签 Secret | 模块 | 接收群 | 用途 |
|---|---|---|---|---|---|
| 财务通知机器人 | https://oapi.dingtalk.com/robot/send?access_token=fa25219096e65b694b0b735b0deb3f8b71156bca95adfe4b88087e9b3d54bbb7 | SECa79a581655539c3652328c1d97c99ec42af92d383ff0140bb019f5d4edd47862 | 生活缴费 | 财务群 | 账单生成、缴费成功、逾期催缴 |
| 报修通知机器人 | https://oapi.dingtalk.com/robot/send?access_token=d6dbf92cdade136ecbc1f0b8586fae6e4cdbf2e228a913186a709924856d4ee0| SECe56b1d5d669458c10d72037560cce9136b828d945944891b6cfb1a52789b39e5 | 报事报修 | 工程维修群 | 新报修、分配、超时提醒 |
| 投诉客服机器人 | https://oapi.dingtalk.com/robot/send?access_token=99152e3e647ae67e8893fb7c840d25e467f83f3170f1e33ec3a95b447d482eab| SEC5fb82274c299c7f80195226cdd49b1e7341784a44b052940c0a0990baa8af7ad| 投诉建议 | 客服群 | 新投诉、处理进度、超时升级 |
| 物业服务机器人 |https://oapi.dingtalk.com/robot/send?access_token=530c49f87c4d093fcfbfd01c2606d90bc5c3be5a6ba4966c2faf8601387c53ee  |SEC073b03759b979bfc6bb8e5f28333119cc69c68848c19807cde10accc8167283b | 物业服务 | 物业服务群 | 快递代寄、药品代取服务申请 |
| 商城订单机器人 | https://oapi.dingtalk.com/robot/send?access_token=f2ddfcba0e3d0f35663c9a8e3586fc2a8d9daa8e386ac953ac84e9b66226b43d | SECa7618772fa106c07e1b0020d65d7fe862bc671b1c3920d4c2ae94b9618c783aa | 盛兴严选 | 商城运营群 | 新订单、发货、异常订单 |
| 在线客服机器人 | https://oapi.dingtalk.com/robot/send?access_token=ecb86b4829cacc661c080210d6f7cc91d9bb2404a0a4e2358b494beab66c4402| SECfebc89b871b45366a32f2ffc76ccc3c7c18e36fb31794d204cf0ec815e46c840 | 在线客服 | 客服群 | 转人工客服、工单提醒 |
| 活动运营机器人 | https://oapi.dingtalk.com/robot/send?access_token=eae62a24092c08659fd6cb9fd6f48dc4885462da5ac6985e60c202cd2010d5d0 | SECd1a4cfd1e4f41ebe7e068f6798c9b59b8ac8b64e082f880f4152a6214b961371 | 社区活动 | 运营群 | 报名通知、名额满、活动统计 |
| 系统告警机器人 | https://oapi.dingtalk.com/robot/send?access_token=1ae8e210b23160d12431e269320bf30d63298e6d464bb0009c9745dc011d62df | SECfc768b7e9aff715eba4576401bc8647ebad947f4c5d463e5aa8cfca769071d43| 系统监控 | 技术群 | 支付异常、接口异常、通知失败 |

---
# 通知模板规范

---

## 1. 生活缴费

### 1.1 逾期提醒

#### 【缴费逾期提醒】

小区：{{communityName}}  
业主：{{userName}}  
房屋：{{houseName}}  

账单类型：{{billType}}  
金额：￥{{amount}}  
截止日期：{{dueDate}}  
逾期天数：{{overdueDays}} 天  

请及时催缴！

👉 {{detailUrl}}

---

### 1.2 缴费成功

#### 【缴费成功】

小区：{{communityName}}  
业主：{{userName}}  
房屋：{{houseName}}  

账单类型：{{billType}}  
支付金额：￥{{amount}}  
支付时间：{{payTime}}  

👉 {{detailUrl}}

---

## 2. 报事报修

### 2.1 新报修

#### 【新报修工单】

小区：{{communityName}}  
业主：{{userName}}  
房屋：{{houseName}}  

报修分类：{{repairCategory}}  
问题描述：{{description}}  
预约时间：{{appointmentTime}}  

请尽快分配维修人员！

👉 {{detailUrl}}

---

### 2.2 超时提醒

#### 【报修超时提醒】

工单编号：{{repairNo}}  
小区：{{communityName}}  
当前状态：{{status}}  
等待时长：{{waitTime}}  

⚠️ 已超 SLA，请立即处理！

👉 {{detailUrl}}

---

## 3. 投诉建议

### 3.1 新投诉

#### 【新投诉/建议】

小区：{{communityName}}  
提交人：{{userName}}（{{isAnonymous}}）  

内容：  
{{content}}  

请客服及时处理！

👉 {{detailUrl}}

---

### 3.2 投诉超时

#### 【投诉处理超时】

投诉编号：{{complaintNo}}  
负责人：{{handlerName}}  
当前状态：{{status}}  
等待时长：{{waitTime}}  

⚠️ 请立即处理或升级！

👉 {{detailUrl}}

---

## 4. 物业服务

### 4.1 新服务申请

#### 【物业服务申请】

小区：{{communityName}}  
业主：{{userName}}  
房屋：{{houseName}}  

服务类型：{{serviceType}}  
预约时间：{{appointmentTime}}  
服务内容：{{content}}  

请物业人员及时接单！

👉 {{detailUrl}}

---

### 4.2 服务超时

#### 【物业服务超时】

服务单号：{{serviceNo}}  
服务类型：{{serviceType}}  
当前状态：{{status}}  
等待时长：{{waitTime}}  

⚠️ 请主管及时处理！

👉 {{detailUrl}}

---

## 5. 商城订单

### 5.1 新订单

#### 【商城新订单】

小区：{{communityName}}  
用户：{{userName}}  

订单编号：{{orderNo}}  
商品：{{goodsName}}  
订单金额：￥{{amount}}  

请及时发货！

👉 {{detailUrl}}

---

### 5.2 异常订单

#### 【商城异常订单】

订单编号：{{orderNo}}  
异常类型：{{exceptionType}}  
异常说明：{{reason}}  

⚠️ 请尽快处理！

👉 {{detailUrl}}

---

## 6. 在线客服

### 6.1 转人工

#### 【转人工客服】

小区：{{communityName}}  
用户：{{userName}}  
房屋：{{houseName}}  

问题：  
{{question}}  

请客服尽快介入！

👉 {{detailUrl}}

---

## 7. 社区活动

### 7.1 报名成功

#### 【活动报名成功】

活动名称：{{activityName}}  
小区：{{communityName}}  
用户：{{userName}}  

报名人数：{{signupCount}} / {{limitCount}}  

👉 {{detailUrl}}

---

### 7.2 名额已满

#### 【活动名额已满】

活动名称：{{activityName}}  
报名人数：{{signupCount}} / {{limitCount}}  

请运营关注现场安排！

👉 {{detailUrl}}

---

## 8. 系统告警

### 8.1 支付异常

#### 【支付异常】

订单号：{{orderNo}}  
异常原因：{{errorMessage}}  
发生时间：{{time}}  

⚠️ 请技术立即排查！

👉 {{detailUrl}}

---

### 8.2 通知失败

#### 【通知发送失败】

模块：{{module}}  
通知类型：{{noticeType}}  
失败原因：{{errorMessage}}  

⚠️ 请检查配置！

👉 {{detailUrl}}

---