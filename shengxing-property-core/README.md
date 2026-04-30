# 盛兴物业重建版

这是从零重建的最小骨架工程。

## 启动

1. 用微信开发者工具打开 `project.config.json`。
2. 上传并部署 `cloudfunctions/sxmini`。
3. 进入首页后，云函数会自动做基础初始化。

## 当前阶段

- 4 个 tab 页：首页、生活、报修、我的
- 单文件云函数 `sxmini`
- 基础初始化与报修闭环
- 网页后台 `web-admin`
- MySQL 建表脚本 `database/mysql/schema.sql`
- 后台第二批模块入口：报修、缴费、投诉建议、通知配置
- MySQL 已规划第二批业务表：`fee_bills`、`complaints`、`service_orders`、`notice_configs`

## 网页后台部署

1. 先在 CloudBase 控制台开通 MySQL。
2. 执行 `database/mysql/schema.sql` 初始化表。
3. 修改 `cloudbaserc.json` 里的 `envId`。
4. 在项目根目录执行：

```bash
tcb app deploy --framework vite -e 你的环境ID
```

当前已部署方式为本地构建后上传静态托管：

```bash
npm --prefix web-admin run build
tcb hosting deploy ./web-admin/dist /sxwy-admin -e 你的环境ID
```

`web-admin` 当前支持 Mock 数据预览，页面模块和 MySQL 表结构已准备好。真实审核、派单、账单核销等写操作下一步需要接受控云函数接口，不直接开放 MySQL 表给匿名网页读写。
