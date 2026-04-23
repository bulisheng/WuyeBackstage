# 开发者文档

这份文档给程序员看，重点是启动、配置、修改和联调。

## 技术栈

- 微信小程序
- Spring Boot
- MongoDB
- Vite + React
- 飞书 Webhook
- 智能引擎适配层

## 本机启动顺序

如果你想一键启动，直接运行根目录的 `start-all.bat`，它会先拉起本地智能引擎，再启动 MongoDB、后端和 Web 管理台。`start-all.bat` 只是入口，真正的启动逻辑放在 `start-all.ps1`，这样更稳。

### 1. 启动数据库

默认 MongoDB 连接串：

```text
mongodb://localhost:27017/property_management
```

### 2. 启动后端

```powershell
cd server
mvn spring-boot:run
```

后端默认监听：

```text
http://0.0.0.0:8080
```

接口前缀：

```text
/api/v1
```

### 3. 启动 Web 管理台

```powershell
cd web-admin
npm install
npm run dev
```

### 4. 启动小程序

- 用微信开发者工具导入项目根目录
- 住户端登录页现在只保留手机号和验证码，房屋归属由后端按手机号自动匹配
- 真机联调时把 `devApiBaseUrl` 改成电脑局域网 IP
- `pages/assistant/assistant` 是智能助手页，报修/投诉草稿会先缓存到本地再跳转到对应业务页
- 报修推飞书时会带上预约时间，前端如果填了预约时间，后端通知里也要一起展示
- 报修飞书消息里还会带“师傅已收到”和“师傅已完成”两个链接；师傅点击后，后端会分别把报修状态改成“处理中”或“已完成”，并写入签收时间、签收人和完工时间
- 投诉队列也走同样的链接式状态流转；客服通知机器人里的“客服已受理 / 客服已处理”链接会分别把投诉状态改成“处理中 / 已处理”，并写入受理时间、受理人和处理时间
- 访客和装修不要一概强制飞书；更合理的做法是：报修、投诉、转人工属于“工单协同”必须通知并可点链接改状态，装修属于“审批协同”可通知可链接，访客、快递、蔬菜订单属于“提醒或台账”通常只提醒或只后台改状态即可，默认不要在飞书里要求点链接处理。
- `web-admin/src/pages/AssistantSessionsPage.jsx` 里可以切换 `格式化 / 原始` 数据。
- 提示词页支持 `恢复上一次保存`。
- 技能库页支持按项目、标签、启用状态和当前负责人筛选；记录里建议保留 `responsibleSupervisor`、`synonyms`、`keywords` 和 `pinned` 字段。
- 技能库支持 CSV / JSON 导入，导入前会先预览再保存；还支持按场景下载模板和批量生成同义问法。
- 后台展示层尽量只放中文，不要把 `visitorName`、`visitorPhone`、`statusText` 这类字段键直接露给用户；如果页面上看到英文键，先补 `fieldLabel` 映射，再决定要不要删掉无用字段。

### 智能助手联调

智能助手现在已经可以测，最小联调顺序是：

1. 启动 MongoDB。
2. 启动后端 `server`。
3. 启动 Web 管理台 `web-admin`。
4. 启动本地智能引擎，本地默认入口是 `http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain`。
5. 在 Web 管理台 `智能配置` 页面里确认 `智能引擎类型` 是 `智能引擎`，再把 `连接模式` 切到 `本地` 或 `远程`。
6. 打开小程序首页，点击 `智能助手`。
7. 先测这几个场景：
   - `查本月物业费`
   - `帮我提报修，水管漏水`
   - `帮我生成一条投诉，楼上太吵`
   - `转人工`
8. 如果要看链路是否真的走了智能引擎，去 `web-admin` 的 `会话日志` 页面看原始数据。

最近一次实测补充：

- 当前默认智能引擎已经切到 DeepSeek，并且已经实际测通。
- `POST /api/v1/assistant/settings/test` 返回过 `成功`，对应接口是 `https://api.deepseek.com/chat/completions`，模型是 `deepseek-chat`。
- 保存后再读 `GET /api/v1/assistant/settings?communityId=...` 时，`deepseekApiKeySet` 会回读为 `true`。
- 如果页面还显示“未保存”，优先强刷页面或确认当前项目是否切对，再看后端返回的 `deepseekApiKeySet`。

补充说明：
- 如果智能引擎没启动，智能助手页仍然能打开，但会回退到本地规则或草稿模式。
- 要测真正的智能引擎返回，至少要确认后端能访问本地智能引擎地址。

## 关键配置文件

- 后端正式配置：[server/src/main/resources/application.yml](../server/src/main/resources/application.yml)
- 后端模板配置：[server/src/main/resources/application.example.yml](../server/src/main/resources/application.example.yml)
- Web 开发环境配置：[web-admin/.env.development](../web-admin/.env.development)
- Web 环境模板：[web-admin/.env.example](../web-admin/.env.example)
- 小程序本地配置：[utils/config.js](../utils/config.js)
- 小区功能、项目名称、默认负责人都在 Web 管理台的 `小区管理` 里配置。

## 住户登录怎么配置

- 小程序首页只保留手机号和验证码，业主不再手动选小区、楼栋、单元、房号。
- 后端会按 `住户账号 / 房屋档案` 里的手机号关系自动匹配对应的小区、楼栋、单元和房号。
- 这里已经兼容“一个手机号对应多个房屋”和“一个房屋对应多个用户”的情况。
- 如果同一个手机号匹配到多个房屋，后端会返回房屋候选列表，前端登录页会让用户先选房屋再登录。
- `住户账号` 侧可保存多个 `houseIds / houseNos`，`房屋档案` 侧可保存多个 `boundUserIds / boundUserNames / boundUserPhones`，数据库和接口都已兼容数组字段。
- 如果手机号没有绑定任何房屋，后端会直接返回 `该手机号未绑定任何房屋，请联系物业处理`，不会误放行到首页。
- 如果登录后房屋不对，先检查：
  1. `住户账号` 里的手机号是否正确。
  2. `房屋档案` 里的 `绑定住户`、`产权人`、`入住人` 是否已配置。
  3. 住户和房屋的 `communityId / community` 是否一致。
- 住户 / 房屋 / 访客这些编辑页里，展示字段尽量统一成中文；不要在页面上直接显示 `visitorName`、`visitorPhone`、`statusText` 这类键名。

## 账单 / 物业费怎么配置

- 账单、物业费、水费、电费这些数据，都在 Web 管理台的 `账单管理` 页面配置。
- 页面顶部已经加了醒目的说明：`这里配置物业费`。
- 如果按面积计费，先去 `房屋档案` 里维护 `面积`，再在 `账单管理` 里填 `每平米单价`，后端会自动按 `面积 × 单价` 计算 `金额`。
- 配置时先切到对应小区，再点 `新增` 或编辑某条账单。
- 常用字段包括：`标题、类型、面积、每平米单价、金额、周期、到期日、状态、房号、openid`。
- 后端对应的保存接口是 `saveBill`，列表接口是 `listBills`，删除接口是 `deleteBill`。
- 小程序首页的待缴账单，会按照当前房屋和当前小区来过滤，所以账单数据要先把 `communityId / community` 和房屋归属填对。
- 如果你在真机联调时发现账单不对，先检查：
  1. 当前小区是否切对。
  2. 账单里的房号 / openid / 小区字段是否填对。
  3. 住户是否已经绑定到正确房屋。
- 如果要批量整理基础数据，建议先用 CSV 把 `手机号、小区、楼栋、单元、房号、面积、单价` 这些信息整理好，再统一录入住户、房屋和账单。
- 住户端登录时只需要手机号和验证码；后端会按手机号自动匹配住户和房屋，再回填小区、楼栋、单元和房号。

## 需要改哪里

### 改数据库
- 后端 Mongo URI 在 `application.yml` 或环境变量 `MONGODB_URI`

### 改飞书
- `FEISHU_CUSTOMER_WEBHOOK_URL`
- `FEISHU_REPAIR_WEBHOOK_URL`
- `FEISHU_LIFE_WEBHOOK_URL`
- `complaint.default-supervisor`
- 投诉规则表里的 `mentionTargets`
- `web-admin` 的 `智能配置` 页面里，通知路由会显示 `绑定机器人 / 推送事项 / 负责人 / 备选负责人`，这是后续排查飞书路由最先看的地方。
- 原来的单一 `FEISHU_WEBHOOK_URL` 已经删掉，后续只保留这三路机器人配置。

### 改智能引擎
- 现在后台可切换 `深度求索` 和 `兼容引擎`
- `智能配置` 页面已经拆成 `基础配置 / 引擎配置 / 通知配置 / 提示词配置` 四块，顶部有 `当前生效配置 vs 编辑中配置` 对比条，右侧有 `查看当前生效配置` 折叠面板，底部按钮是 `保存后立即测试连接`
- 保存后会自动调用测试接口，成功 / 失败都会用中文状态条展示在页面上，还可以直接复制测试结果
- 深度求索默认地址是 `https://api.deepseek.com/v1`
- 深度求索默认路径是 `/chat/completions`
- 深度求索模型默认是 `deepseek-chat`
- 密钥只保存在后端 `property_assistant_settings`，不要写进前端默认值或文档示例
- 兼容引擎默认本地入口仍然是 `http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain`
- 远程入口默认占位仍然是示例地址 `https://openclaw.example.com`
- Web 管理台会优先保存 `assistantProvider`、`deepseekMode`、`deepseekBaseUrl`、`deepseekLocalBaseUrl`、`deepseekRemoteBaseUrl`
- `OPENCLAW_BASE_URL`
- `OPENCLAW_LOCAL_BASE_URL`
- `OPENCLAW_REMOTE_BASE_URL`
- `OPENCLAW_COMPLAINT_ANALYSIS_PATH`
- `OPENCLAW_ANALYSIS_TIMEOUT_MS`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_LOCAL_BASE_URL`
- `DEEPSEEK_REMOTE_BASE_URL`
- `DEEPSEEK_CHAT_PATH`
- `DEEPSEEK_MODEL`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_TEMPERATURE`
- `DEEPSEEK_MAX_TOKENS`
- DeepSeek 当前默认按 `https://api.deepseek.com` + `/chat/completions` + `deepseek-chat` 走，测试已实测成功；如果测试失败，先确认密钥是否真的保存成真，再看当前项目和引擎模式是否切对。
- 未来如果要部署成“云后端 + Mac mini 上智能引擎”，优先在 Web 管理台里切换 `本地 / 远程`，不要只改一个地址。
- 现在默认智能引擎已经回到 `深度求索` 路线，兼容引擎和本地模型都只是备选。

### 改默认负责人
- 后端 `complaint.default-supervisor`
- Web 管理台里的 `小区管理`

### 改项目名称和功能开关
- 小区详情里的 `项目名称` 是正式展示名。
- `功能开关` 控制前端入口和后台菜单是否显示。
- `当前启用功能` 是给人看的概览，不是可编辑字段。
- 小区管理里的模块开关支持新增 / 编辑都配置，保存后是按小区写入数据库的；切换当前小区后，前端和后台菜单会立即按这个小区的开关生效。
- 记得切换当前小区后再检查对应模块是否同步隐藏或显示。
- Web 管理台顶部会展示当前项目列表、当前小区、当前结果和分页信息。
- 左侧批量操作现在放在控制台底部，不在顶部横排占位。
- 顶部“当前项目列表”默认折叠，展开后才显示项目按钮。

## 业务数据流

- 小程序只打自己的后端接口
- 后端落 MongoDB
- Web 管理台也是打同一个后端
- 智能引擎只做分析辅助
- 飞书机器人只负责通知
- 多小区数据要靠 `communityId` 和 `community` 一起对齐，不能只靠名称过滤。

## 配置项、业务数据、运行时匹配对照表

这张表用来区分：**什么该配置、什么该存业务表、什么运行时再去查。**

| 类别 | 该不该落库 | 典型内容 | 运行时怎么用 |
| --- | --- | --- | --- |
| 配置项 | 要 | 小区项目名称、功能开关、默认负责人、负责人列表、通知机器人、通知对象、智能引擎配置、提示词模板、FAQ / 技能库 | 后台直接改，前端和后端按当前小区读取后生效 |
| 业务数据 | 要 | 账单、报修、投诉/表扬、访客、装修、快递、蔬菜订单、智能助手会话、飞书推送结果、转人工记录 | 用户或系统产生后单独落业务集合，只做查询、统计、追踪 |
| 运行时匹配 | 要查库，不要写死 | 手机号 -> 住户 -> 房屋 -> 小区；房屋 -> 账单；投诉类型 -> 通知路由；关键词 -> FAQ；当前小区 -> 默认负责人 | 用户登录或发起动作时，后端按当前小区、手机号、房号、功能开关去查对应记录 |

### 适合落库的配置
- 小区基础配置：项目名称、地址、功能开关、默认负责人、负责人列表。
- 房屋基础配置：小区、楼栋、单元、房号、面积、产权人、入住人、绑定住户。
- 住户基础配置：手机号、姓名、绑定房屋、小区归属、角色。
- 账单规则配置：物业费单价、水费单价、电费单价、周期、计费方式、到期日规则、是否按面积计费。
- 物业人员配置：姓名、岗位、班次、负责楼栋、飞书成员标识。
- 通知路由配置：绑定机器人、推送事项、主负责人、备选负责人。
- 智能助手配置：智能引擎类型、接口地址、模型名、提示词、超时时间、回退规则。
- FAQ / 技能库：问题、答案、同义问法、标签、关键词、负责人。

### 运行时应该查库匹配的东西
- 用户登录手机号 -> 匹配住户 -> 匹配房屋 -> 匹配小区。
- 房屋房号 -> 匹配账单。
- 住户手机号 -> 匹配智能助手上下文。
- 小区 -> 匹配当前负责人 / 负责人列表 / 通知机器人。
- 报修类别 -> 匹配处理人 / 维修组。
- 投诉类型 -> 匹配客服机器人 / 主负责人 / 备选负责人。
- 智能助手问题 -> 匹配 FAQ / 技能库 / 提示词 / 当前小区配置。

## 常用接口

- `POST /api/v1/auth/wechat/login`
- `GET /api/v1/dashboard`
- `GET /api/v1/bills`
- `POST /api/v1/repairs`
- `POST /api/v1/feedbacks`
- `POST /api/v1/assistant/messages`
- `POST /api/v1/assistant/handoff`
- `GET /api/v1/assistant/settings`
- `PUT /api/v1/assistant/settings`
- `GET /api/v1/assistant/faq`
- `POST /api/v1/assistant/faq`
- `GET /api/v1/assistant/sessions`
- `GET /api/v1/admin/complaint-queue`
- `POST /api/v1/admin/complaint-queue/{id}/analyze`
- `POST /api/v1/admin/complaint-queue/{id}/push-feishu`

## 模块通知规范表

这张表用来定哪些模块要飞书、哪些模块只后台改状态，避免整套系统都强上通知。

| 模块 | 是否飞书通知 | 是否链接改状态 | 后端状态字段 | 前端展示字段 | 说明 |
| --- | --- | --- | --- | --- | --- |
| 账单、住户、房屋、小区、物业人员、智能配置、FAQ | 否 | 否 | 只做配置或台账字段 | 列表、详情、配置页 | 纯配置或基础资料，不需要飞书通知 |
| 报修 | 是 | 是 | `status`、`statusName`、`ackTime`、`ackBy`、`completionTime` | `已签收`、`处理中`、`已完成` | 标准工单协同，师傅点链接后改状态 |
| 投诉 / 客服 | 是 | 是 | `serviceStatus`、`serviceStatusName`、`serviceAckTime`、`serviceAckBy`、`serviceCompleteTime`、`serviceCompleteBy` | `待受理`、`处理中`、`已处理` | 客服协同工单，通知和状态流转要一起做 |
| 智能助手转人工 | 是 | 视情况 | `status`、`ticketId`、`handoffTime` | `接人工中`、`已转人工` | 需要飞书通知，是否点链接接单按场景决定 |
| 装修 | 建议是 | 可选 | `status`、`statusText`、`reviewTime` | `待审核`、`已通过`、`已驳回` | 审批协同，通知可以有，若要审批也可保留链接；但不是所有小区都必须启用链接 |
| 访客 | 可选 | 否 | `status`、`statusText`、`invalidateTime` | `有效`、`已失效` | 默认只做提醒，不强制飞书点链接处理 |
| 快递 / 蔬菜订单 | 可选 | 否 | `status`、`statusText`、`pickupTime` / `completeTime` | `待取件`、`已取件`、`待处理`、`已完成` | 更适合后台按钮改状态，飞书只做提醒即可 |

## 真机联调

1. 查电脑局域网 IP。
2. 把 `devApiBaseUrl` 设为 `http://<LAN-IP>:8080/api/v1`。
3. 确保后端监听 `0.0.0.0:8080`。
4. 关闭微信开发者工具里的域名校验，或改用正式 HTTPS 域名。
5. 登录后如果房屋绑定正确，首页账单只会看得到当前房屋对应的账单。

## 智能助手测试清单

1. 打开小程序首页 `智能助手`。
2. 输入 `查本月物业费`，确认返回当前房屋账单摘要。
3. 输入 `帮我提报修，水管漏水`，确认是否出现报修草稿卡。
4. 输入 `帮我生成一条投诉，楼上太吵`，确认是否出现投诉草稿卡。
5. 输入 `转人工`，确认是否进入人工接管流程。
6. 打开后台 `会话日志`，确认原始数据、格式化数据和回退逻辑都正常。
7. 如果智能引擎未命中，检查：
   - 智能引擎模式（`openclawMode`）
   - 智能引擎地址（`openclawBaseUrl`）
   - 本地智能引擎进程是否已启动

## 技能库说明

- 技能库数据落在 `property_assistant_faqs`。
- 后端命中时会综合看 `question`、`answer`、`tags`、`synonyms`、`keywords` 和 `pinned`。
- Web 管理台导出的是 Excel 友好的 CSV，模板里会带说明行和场景示例。
- 导入文件支持：
  - CSV，适合 Excel 批量维护
  - JSON 数组
  - `{ items: [...] }` 或 `{ faqs: [...] }`
- 导入 UI 先预览再确认保存。
- 场景模板按 `账单 / 报修 / 投诉 / 门禁 / 停车` 拆分，适合运营直接拿去维护。
