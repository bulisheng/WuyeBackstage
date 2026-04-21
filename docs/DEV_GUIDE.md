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
- 真机联调时把 `devApiBaseUrl` 改成电脑局域网 IP
- `pages/assistant/assistant` 是智能助手页，报修/投诉草稿会先缓存到本地再跳转到对应业务页
- `web-admin/src/pages/AssistantSessionsPage.jsx` 里可以切换 `格式化 / 原始` 数据。
- 提示词页支持 `恢复上一次保存`。
- 技能库页支持按项目、标签、启用状态和当前负责人筛选；记录里建议保留 `responsibleSupervisor`、`synonyms`、`keywords` 和 `pinned` 字段。
- 技能库支持 CSV / JSON 导入，导入前会先预览再保存；还支持按场景下载模板和批量生成同义问法。

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
