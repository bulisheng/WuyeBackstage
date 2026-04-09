# 开发者文档

这份文档给程序员看，重点是启动、配置、修改和联调。

## 技术栈

- 微信小程序
- Spring Boot
- MongoDB
- Vite + React
- 飞书 Webhook
- openclaw 适配层

## 本机启动顺序

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

API 前缀：

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
- 真机联调时把 `devApiBaseUrl` 改成电脑局域网 IP

## 关键配置文件

- 后端正式配置：[server/src/main/resources/application.yml](../server/src/main/resources/application.yml)
- 后端模板配置：[server/src/main/resources/application.example.yml](../server/src/main/resources/application.example.yml)
- Web 开发环境配置：[web-admin/.env.development](../web-admin/.env.development)
- Web 环境模板：[web-admin/.env.example](../web-admin/.env.example)
- 小程序本地配置：[utils/config.js](../utils/config.js)
- 小区功能、项目名称、默认负责人都在 Web 管理台的 `小区管理` 里配置。

## 需要改哪里

### 改数据库
- 后端 Mongo URI 在 `application.yml` 或环境变量 `MONGODB_URI`

### 改飞书
- `FEISHU_WEBHOOK_URL`
- `complaint.default-supervisor`
- 投诉规则表里的 `mentionTargets`

### 改 openclaw
- `OPENCLAW_BASE_URL`
- `OPENCLAW_COMPLAINT_ANALYSIS_PATH`
- `OPENCLAW_ANALYSIS_TIMEOUT_MS`

### 改默认主管
- 后端 `complaint.default-supervisor`
- Web 管理台里的 `小区管理`

### 改项目名称和功能开关
- 小区详情里的 `项目名称` 是正式展示名。
- `功能开关` 控制前端入口和后台菜单是否显示。
- `当前启用功能` 是给人看的概览，不是可编辑字段。
- 记得切换当前小区后再检查对应模块是否同步隐藏或显示。
- Web 管理台顶部会展示当前项目列表、当前小区、当前结果和分页信息。
- 左侧批量操作现在放在控制台底部，不在顶部横排占位。
- 顶部“当前项目列表”默认折叠，展开后才显示项目按钮。

## 业务数据流

- 小程序只打自己的后端 API
- 后端落 MongoDB
- Web 管理台也是打同一个后端
- openclaw 只做分析辅助
- 飞书机器人只负责通知
- 多小区数据要靠 `communityId` 和 `community` 一起对齐，不能只靠名称过滤。

## 常用接口

- `POST /api/v1/auth/wechat/login`
- `GET /api/v1/dashboard`
- `GET /api/v1/bills`
- `POST /api/v1/repairs`
- `POST /api/v1/feedbacks`
- `GET /api/v1/admin/complaint-queue`
- `POST /api/v1/admin/complaint-queue/{id}/analyze`
- `POST /api/v1/admin/complaint-queue/{id}/push-feishu`

## 真机联调

1. 查电脑局域网 IP。
2. 把 `devApiBaseUrl` 设为 `http://<LAN-IP>:8080/api/v1`。
3. 确保后端监听 `0.0.0.0:8080`。
4. 关闭微信开发者工具里的域名校验，或改用正式 HTTPS 域名。
5. 登录后如果房屋绑定正确，首页账单只会看得到当前房屋对应的账单。

## 修改建议

- 前端页面优先改 `pages/`
- Web 管理台优先改 `web-admin/src/pages/`
- 后端业务逻辑优先改 `server/src/main/java/com/example/property/service/`
- API 入口优先改 `server/src/main/java/com/example/property/controller/`

## 注意

- `application.example.yml` 只是模板，不会被 Spring Boot 自动读取。
- 运行时真正生效的是 `application.yml`。
- 改完配置后一般要重启后端。
- 投诉和表扬已经统一进 `feedbacks`，后台反馈页会一起展示。
- 投诉规则里的 `负责人` 是规则所有者，`飞书通知人` 才是实际通知对象。
- 真正能 `@` 到人的前提是物业人员已经绑定了 `feishuUserId`。
- 新项目如果要看起来是空的，记得先切到对应小区，再确认对应记录是否带了 `communityId`。
