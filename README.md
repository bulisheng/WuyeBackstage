# 物业小程序项目文档入口

这个仓库现在拆成三份主文档，方便不同角色快速查看：

- [使用者文档](docs/USER_GUIDE.md) - 给物业人员、运营人员、后台使用者看，说明系统有哪些功能、怎么操作
- [开发者文档](docs/DEV_GUIDE.md) - 给程序员看，说明怎么启动、怎么改配置、怎么联调
- [AI 接手文档](docs/AI_GUIDE.md) - 给后续 AI 快速接手改代码看，说明项目结构、约定和修改入口
- 技能库使用入口：先看 [使用者文档](docs/USER_GUIDE.md#怎么用-ai-客服技能库) 了解操作，再进 Web 管理台的 `AI 客服技能库` 页面维护常见问题、同义问法和模板

## 当前项目

- 微信小程序前端
- Spring Boot 后端
- MongoDB 数据持久化
- Vite + React Web 管理台
- 飞书机器人投诉推送
- DeepSeek 智能助手适配层（当前默认，已实测打通）

## 快速开始

如果你只是想马上跑起来：

1. 启动 MongoDB
2. 启动本地智能引擎
3. 启动后端 `server`
4. 启动 Web 管理台 `web-admin`
5. 用微信开发者工具打开小程序

如果你想省事，可以直接双击根目录的 `start-all.bat`，它会依次拉起：

- MongoDB
- 后端 `server`
- Web 管理台 `web-admin`
- 本地 openclaw（请确保它已单独启动）

`start-all.bat` 现在只是入口包装，真正的启动逻辑在 `start-all.ps1`，这样比纯 cmd 批处理更稳。它不会再自动启动本地大模型。

更详细的步骤请看：

- [开发者文档](docs/DEV_GUIDE.md)
- [使用者文档](docs/USER_GUIDE.md)
- [AI 接手文档](docs/AI_GUIDE.md)
