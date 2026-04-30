# 盛兴物业小程序目录规范

本文档用于固定后续开发目录结构。当前主工程为 `shengxing-property`，`WK-main` 和 `drivermini-master` 仅作为参考工程，不再作为主要开发入口。

## 主工程入口

```text
shengxing-property/
├─ miniprogram/                  # 微信小程序端
├─ cloudfunctions/mcloud/         # CloudBase 云函数
├─ docs/                          # 项目文档与后续开发规范
├─ project.config.json            # 微信开发者工具项目配置
└─ README.md
```

## 小程序端结构

业务页面统一放在 `miniprogram/projects/house/pages` 下。后续新增页面按“业务模块 / 页面”两级组织。

```text
miniprogram/
├─ app.js
├─ app.json                       # 页面注册、TabBar、全局窗口配置
├─ app.wxss
├─ helper/                        # 通用工具
├─ comm/                          # 通用业务封装
├─ cmpts/                         # 公共组件
├─ style/                         # 全局基础样式
└─ projects/house/
   ├─ biz/                        # 小程序端业务 API 封装
   ├─ images/                     # 当前项目图片资源
   ├─ public/                     # 项目配置
   ├─ style/                      # 当前项目样式
   └─ pages/
      ├─ default/                 # 首页
      ├─ community/               # 小区切换、房屋体系
      ├─ life/                    # 生活 Tab 聚合页
      ├─ fee/                     # 生活缴费
      ├─ task/                    # 报事报修
      ├─ complaint/               # 投诉建议
      ├─ service/                 # 物业服务
      ├─ mall/                    # 盛兴严选商城
      ├─ customer/                # 在线客服
      ├─ vote/                    # 业主投票
      ├─ activity/                # 社区活动
      ├─ my/                      # 我的/业主认证
      └─ admin/                   # 小程序后台管理页
```

### 页面命名规则

每个页面目录保持微信小程序四件套：

```text
pages/{module}/{page}/{module_or_page}.js
pages/{module}/{page}/{module_or_page}.json
pages/{module}/{page}/{module_or_page}.wxml
pages/{module}/{page}/{module_or_page}.wxss
```

示例：

```text
pages/fee/list/fee_list.js
pages/fee/list/fee_list.json
pages/fee/list/fee_list.wxml
pages/fee/list/fee_list.wxss
```

## 云函数结构

CloudBase 后端仍沿用现有 CCMiniCloud 风格：`model / service / controller / route` 分层，不按模块拆云函数，统一走 `mcloud`。

```text
cloudfunctions/mcloud/
├─ index.js
├─ framework/                     # 框架核心，不随业务改动
└─ project/house/
   ├─ model/                      # 数据模型，定义集合和字段结构
   ├─ service/                    # 业务逻辑
   ├─ controller/                 # 云函数控制器
   │  └─ admin/                   # 后台管理控制器
   └─ public/
      └─ route.js                 # 云函数路由注册
```

后续模块文件命名：

```text
model/fee_bill_model.js
service/fee_service.js
controller/fee_controller.js
controller/admin/admin_fee_controller.js

model/complaint_model.js
service/complaint_service.js
controller/complaint_controller.js
controller/admin/admin_complaint_controller.js

model/mall_goods_model.js
model/mall_order_model.js
service/mall_service.js
controller/mall_controller.js
controller/admin/admin_mall_controller.js

model/notice_config_model.js
model/notice_log_model.js
service/notice_service.js
controller/admin/admin_notice_controller.js
```

通知模板统一记录在：

```text
docs/NOTICE_TEMPLATES.md
cloudfunctions/mcloud/project/house/public/notice_templates.js
```

## 数据集合规划

后续 CloudBase 集合按业务边界命名，字段前缀与 Model 保持一致。

```text
house_user                  # 业主/用户
house_task                  # 报事报修
house_complaint             # 投诉建议
house_fee_bill              # 缴费账单
house_fee_pay_log           # 缴费记录
house_reminder_log          # 催缴提醒记录
house_service_order         # 快递代寄/药品代取
house_mall_goods            # 商品
house_mall_order            # 商城订单
house_customer_ticket       # 人工客服工单
house_vote                  # 投票
house_vote_join             # 投票记录
house_activity              # 活动
house_activity_join         # 活动报名/签到
house_notice_config         # 钉钉/短信/订阅消息配置
house_notice_log            # 通知发送记录
house_house                 # 房屋
house_user_house            # 用户房屋关系
```

## 后续开发顺序

1. 先做用户端真实数据接口：缴费、投诉、物业服务、商城、客服工单。
2. 再做后台管理页：账单、催缴、投诉、订单、通知配置。
3. 最后接通知体系：钉钉机器人、小程序订阅消息、短信、电话人工任务。

## 约束

- 不移动 `framework/`、`helper/`、`comm/`、`cmpts/` 等模板基础目录。
- 新业务优先放到 `projects/house/pages/{module}`。
- 页面注册必须同步更新 `miniprogram/app.json`。
- 云函数新增接口必须同步更新 `cloudfunctions/mcloud/project/house/public/route.js`。
- 后续开发默认以本文档结构为准。
