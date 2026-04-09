# AI 接手文档

这份文档给后续 AI 快速接手改代码用，目标是少翻文件、快速找到修改点。

## 项目一句话

这是一个物业管理系统，包含：

- 微信小程序住户端
- Spring Boot 后端
- MongoDB 持久化
- Vite + React Web 管理台
- 飞书投诉推送
- openclaw 智能分析适配

## 当前重要约定

- 业务数据以后端为准，不要回退到前端 mock 逻辑。
- 真机联调默认用电脑局域网 IP，而不是 `127.0.0.1`。
- 多小区已经支持，所有住户、房屋、投诉、人员都要考虑 `community` 字段。
- 切换小区后，Web 管理台顶部会显示当前项目列表，左侧批量操作已经移到控制台底部。
- 顶部项目列表默认折叠，展开后才是项目按钮；不要把它改回一大块横排内容。
- 飞书真 `@` 只认 `feishuUserId`，名字只是显示用。
- `负责人` 是规则负责人，`飞书通知人` 才是实际通知对象。
- 小区配置里会有 `项目名称`、`功能开关` 和 `当前启用功能` 概览，别再用英文字段当展示名。
- 投诉和表扬已经统一进同一个反馈集合，后台反馈页要一起处理。

## 优先看这些文件

- 根入口：[README.md](../README.md)
- 后端入口：[server/README.md](../server/README.md)
- Web 后台入口：[web-admin/README.md](../web-admin/README.md)
- 小程序首页：[pages/index/index.js](../pages/index/index.js)
- 小程序配置：[utils/config.js](../utils/config.js)
- 小程序 mock 数据：[utils/mock-data.js](../utils/mock-data.js)
- 后端总服务：[server/src/main/java/com/example/property/service/InMemoryPropertyDataService.java](../server/src/main/java/com/example/property/service/InMemoryPropertyDataService.java)
- 后端 API：[server/src/main/java/com/example/property/controller/ApiController.java](../server/src/main/java/com/example/property/controller/ApiController.java)
- 后端管理员 API：[server/src/main/java/com/example/property/controller/AdminController.java](../server/src/main/java/com/example/property/controller/AdminController.java)
- Web 管理台主页面：[web-admin/src/pages/DashboardPage.jsx](../web-admin/src/pages/DashboardPage.jsx)
- Web API 封装：[web-admin/src/lib/api.js](../web-admin/src/lib/api.js)
- Web 样式：[web-admin/src/styles.css](../web-admin/src/styles.css)

## 数据流

### 住户端
- 小程序通过 `utils/api.js` 调后端。
- 首页、账单、报修、投诉、访客、装修、快递都走 API。
- 不要在前端再新增业务真值。

### 管理端
- Web 管理台通过同一个后端 API 管理所有数据。
- 列表、筛选、详情、编辑、批量操作都集中在 `DashboardPage.jsx`。

### 通知链路
- 用户投诉 -> 后端入队 -> openclaw 分析 -> 飞书 webhook 推送 -> 规则里的飞书通知人
- 如果要修改飞书通知文案，优先看 `buildFeishuComplaintMessage` 和投诉规则页。

## 常见坑

### 字体报错
- 不要再恢复 base64 WOFF2 字体。
- 现在图标走 Unicode，不依赖额外字体资源。

### 账单串户
- 账单必须按 `openid / houseId / houseNo / room / community` 过滤。
- demo 账单已经改成 `101` 为主，不要再把 `1001` 作为默认房号。

### 规则显示英文
- `severity`、`priority`、`analysisStatus`、`pushStatus` 都要中文显示。
- `项目名称`、`负责人`、`飞书通知人`、`当前启用功能` 这些词要优先保持中文。

### 多小区
- 所有新增的居民、房屋、投诉、员工字段，都要带上 `community`。
- 同时尽量带上 `communityId`，当前前端和后端都在按这个字段收口，避免只按名称误匹配。
- 规则和默认主管要按当前小区生效。

### 表扬数据
- 表扬和投诉都走 `feedbacks`。
- 前端 `pages/feedback/feedback.js` 和 `pages/complaint/complaint.js` 都会写入同一条反馈链路。

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
