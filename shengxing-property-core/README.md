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
- MySQL 建表脚本 `database/mysql/schema.sql`
- 后台第二批模块入口：报修、缴费、投诉建议、通知配置
- MySQL 已规划第二批业务表：`fee_bills`、`complaints`、`service_orders`、`notice_configs`

## 后台仓库

后台网页已经独立到：

```text
C:\GmaeProJect\SXWY\WuyeBackstage
```

后续后台页面、登录、退出、权限矩阵和静态站点发布，都在 `WuyeBackstage` 单独维护。

## 主工程部署

1. 先在 CloudBase 控制台开通 MySQL。
2. 执行 `database/mysql/schema.sql` 初始化表。
3. 修改 `cloudbaserc.json` 里的 `envId`。
4. 上传并部署 `cloudfunctions/sxmini`。

主工程当前只维护小程序、云函数和数据库，不再包含后台网页源码。
