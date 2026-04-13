# AI 接手文档

这份文档给后续 AI 快速接手改代码用，目标是少翻文件、快速找到修改点。

## 项目一句话

这是一个物业管理系统，包含：

- 微信小程序住户端
- Spring Boot 后端
- MongoDB 持久化
- Vite + React Web 管理台
- 飞书投诉推送
- 智能引擎分析适配

## 当前重要约定

- 业务数据以后端为准，不要回退到前端 mock 逻辑。
- 真机联调默认用电脑局域网 IP，而不是 `127.0.0.1`。
- 多小区已经支持，所有住户、房屋、投诉、人员都要考虑 `community` 字段。
- 切换小区后，Web 管理台顶部会显示当前项目列表，左侧批量操作已经移到控制台底部。
- 顶部项目列表默认折叠，展开后才是项目按钮；不要把它改回一大块横排内容。
- 智能助手确认草稿后，会先把草稿写到本地存储，再跳转到报修页或反馈页；不要把这条链路改成纯聊天。
- 会话详情页里的 `智能引擎原始数据` 可以在 Web 端直接看格式化 / 原始两种展示。
- 提示词页支持 `恢复上一次保存`，改提示词时尽量保留这一能力。
- 常见问题现在多了 `负责人` 字段和 `只看当前负责人相关常见问题` 筛选；如果新增字段，优先补 `responsibleSupervisor`。
- 飞书真 `@` 只认 `feishuUserId`，名字只是显示用。物业人员飞书绑定现在也只保留这一个字段；已经实际验证过，保存后重启仍会保留，不要再把 `feishuOpenId` / `feishuUnionId` 当成必填展示项。
- 物业人员列表里会直接显示 `飞书已绑 / 未绑定`，这是最先看的状态；详情弹窗里再看 `飞书标识` 是否正确。
- 除了“新增物业人员”需要手工填姓名，其他涉及人的地方尽量都改成下拉/搜索选择：住户绑定房屋、房屋产权人/入住人/绑定住户、报修处理人、反馈人员、投诉规则负责人/通知对象、默认负责人等。
- 小区配置里的“负责人列表”也已经改成多选，不要再回退成 textarea 手填；优先用当前已有物业人员做选项来源。
- `负责人` 是规则负责人，`通知对象` 才是实际通知对象。
- `智能配置` 页里的通知路由要优先按 `绑定机器人 / 推送事项 / 负责人 / 备选负责人` 这四个词来保持中文一致。
- 当前本地智能引擎默认入口是 `http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain`，如果要改默认地址，优先改这个模板。
- 后台现在支持智能引擎 `本地 / 远程` 两套预设，部署到云服务器 + Mac mini 时优先改智能引擎模式和对应的本地/远程地址，不要只改单一地址。
- 小区配置里会有 `项目名称`、`功能开关` 和 `当前启用功能` 概览，别再用英文字段当展示名。
- 投诉和表扬已经统一进同一个反馈集合，后台反馈页要一起处理。
- 飞书通知现在拆成三路：客服通知机器人、维修通知机器人、生活服务机器人，不要再回退到单一 webhook 配置。
- 智能助手现在是可测试状态：先起后端、Web 管理台和本地智能引擎，再在小程序里测 `查物业费 / 提报修 / 提投诉 / 转人工` 四个场景。

## 优先看这些文件

- 根入口：[README.md](../README.md)
- 后端入口：[server/README.md](../server/README.md)
- Web 后台入口：[web-admin/README.md](../web-admin/README.md)
- 小程序首页：[pages/index/index.js](../pages/index/index.js)
- 小程序配置：[utils/config.js](../utils/config.js)
- 小程序 mock 数据：[utils/mock-data.js](../utils/mock-data.js)
- 小程序智能助手：[pages/assistant/assistant.js](../pages/assistant/assistant.js)
- 后端总服务：[server/src/main/java/com/example/property/service/InMemoryPropertyDataService.java](../server/src/main/java/com/example/property/service/InMemoryPropertyDataService.java)
- 后端接口：[server/src/main/java/com/example/property/controller/ApiController.java](../server/src/main/java/com/example/property/controller/ApiController.java)
- 后端管理员接口：[server/src/main/java/com/example/property/controller/AdminController.java](../server/src/main/java/com/example/property/controller/AdminController.java)
- Web 管理台主页面：[web-admin/src/pages/DashboardPage.jsx](../web-admin/src/pages/DashboardPage.jsx)
- Web 接口封装：[web-admin/src/lib/api.js](../web-admin/src/lib/api.js)
- Web 样式：[web-admin/src/styles.css](../web-admin/src/styles.css)

## 数据流

### 住户端
- 小程序通过 `utils/api.js` 调后端。
- 首页、账单、报修、投诉、访客、装修、快递都走接口。
- 不要在前端再新增业务真值。

### 管理端
- Web 管理台通过同一个后端接口管理所有数据。
- 列表、筛选、详情、编辑、批量操作都集中在 `DashboardPage.jsx`。

### 通知链路
- 用户投诉 -> 后端入队 -> 智能引擎分析 -> 客服通知机器人 -> 规则里的通知对象
- 报修 -> 维修通知机器人
- 快递代寄 / 蔬菜代买 -> 生活服务机器人
- 如果要修改飞书通知文案，优先看 `buildFeishuComplaintMessage`、`notifyRepairFeishu`、`notifyLifeServiceFeishu` 和对应页面。

## 常见坑

### 字体报错
- 不要再恢复 base64 WOFF2 字体。
- 现在图标走 Unicode，不依赖额外字体资源。

### 账单串户
- 账单必须按 `openid / houseId / houseNo / room / community` 过滤。
- demo 账单已经改成 `101` 为主，不要再把 `1001` 作为默认房号。

### 规则显示英文
- `severity`、`priority`、`analysisStatus`、`pushStatus` 都要中文显示。
- `项目名称`、`负责人`、`通知对象`、`当前启用功能` 这些词要优先保持中文。

### 多小区
- 所有新增的居民、房屋、投诉、员工字段，都要带上 `community`。
- 同时尽量带上 `communityId`，当前前端和后端都在按这个字段收口，避免只按名称误匹配。
- 规则和默认负责人要按当前小区生效。

### 表扬数据
- 表扬和投诉都走 `feedbacks`。
- 前端 `pages/feedback/feedback.js` 和 `pages/complaint/complaint.js` 都会写入同一条反馈链路。

### 智能助手
- Web 端有 `常见问题 / 提示词 / 会话日志` 三个页面，入口在 `web-admin/src/pages/`。
- 小程序智能助手页会把报修草稿写入 `assistantPendingRepairDraft`，投诉草稿写入 `assistantPendingFeedbackDraft`，然后跳到对应页面。
- 如果要改智能助手的返回结构，优先看 `assistantMessage`、`assistantHandoff` 和 `assistant/settings` 相关接口。
- 如果要确认智能链路是否真的走了智能引擎，优先看 Web 端 `会话日志` 页面里的原始数据。
- 如果要测本地调试，默认优先入口是 `http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain`。

### 智能助手测试顺序
1. 启动 MongoDB、后端、Web 管理台、本地智能引擎。
2. 小程序首页点击 `智能助手`。
3. 先测 `查本月物业费`，看账单查询是否正常。
4. 再测 `帮我提报修，水管漏水`，看是否生成报修草稿。
5. 再测 `帮我生成一条投诉，楼上太吵`，看是否生成投诉草稿。
6. 再测 `转人工`，看是否进入人工接管。
7. 最后去 `会话日志` 确认原始数据、格式化数据、回退逻辑都正常。

### 最近一次实测结论

- 本地智能引擎本身是可用的，已经能跑出真实的技能调用和助手回复。
- 后端 `/api/v1/assistant/messages` 这条链路现在默认走智能引擎，不会再默认去起本地模型。
- 这类问题优先看：
  - 智能引擎模式（`openclawMode`）是否和当前部署方式一致；
  - 智能引擎地址（`openclawBaseUrl`）是否真的指向可对话的本地入口；
  - 会话日志里的 `raw` 是否是智能引擎回包，而不是本地回退结果。
- 如果你想一键拉起本机测试环境，根目录的 `start-all.bat` 现在只启动 MongoDB、后端和 Web 管理台，不会自动起本地大模型。
- 如果后面要换别的本地模型，建议单独再加适配层，不要把它恢复成默认主路径。

### 当前智能助手状态

- `智能助手` 页面已经改成更像真实客服接入的“排队中”状态，发送后会显示提交、排队、整理回复三个阶段。
- 现在测试优先看：
  - 页面是否进入排队状态
  - 后端是否能返回 `code: 0`
  - 返回里是否带会话地址
  - 会话日志里的原始数据是否是智能引擎返回
- 简短更新说明可以直接说：
  - 智能助手已切回智能引擎
  - 发送时会显示排队接入状态
  - 现在可测 `查物业费 / 提报修 / 提投诉 / 转人工`
  - 后台会话日志可直接查看原始返回

## 修改入口建议

- 改住户端页面：先看 `pages/`
- 改后台表格和表单：先看 `web-admin/src/pages/DashboardPage.jsx`
- 改接口字段：先看 `server/src/main/java/com/example/property/dto/`
- 改业务逻辑：先看 `InMemoryPropertyDataService.java`
- 改配置：先看 `server/src/main/resources/application.yml`

## 运行检查

改完代码后，优先检查：

1. 后端能否 `mvn -f server/pom.xml -DskipTests compile`
2. Web 管理台能否 `npm run build`
3. 小程序能否在开发者工具里编译
4. 真机是否还能访问 `devApiBaseUrl`

## 写代码的原则

- 优先改现有结构，不要重建一套平行系统。
- 优先兼容旧字段，再逐步收敛。
- 顶部工具条要保持紧凑，不要把登录信息、结果统计和批量操作继续堆成三张大卡。
- 尽量把新字段同步到：
  - 后端 DTO
  - 服务层
  - Web 管理台表单
  - 文档
