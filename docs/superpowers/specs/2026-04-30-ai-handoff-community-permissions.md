# 社区权限交接说明

> 本文档是给下一位继续推进盛兴物业后台 SaaS 的 AI 使用的。开始修改前请先阅读。

## 已经完成了什么

### 第一阶段基础能力
- 后台已经支持小区切换。
- 当前小区选择已经持久化。
- 后台已经有小区增删改查。
- 静态站点已经更新到最新的 `web-admin/dist`。

### 权限系统
- 后端和后台页面已经有管理员、小区权限、角色的基础模型。
- 权限页已经展示按小区 / 按角色的矩阵。
- 前端辅助函数里已经定义了角色默认值：
  - `super_admin`
  - `admin`
  - `finance`
  - `customer_service`
  - `repairman`
- 角色级菜单预设和动作级预设已经放在：
  - `web-admin/src/utils/permissions.js`
- 权限页现在已经有：
  - 角色默认菜单预览
  - 快速动作 token 面板
  - 可点击的矩阵单元格，点击后可以直接跳转到对应权限记录编辑

### 最近提交
- `c10d783 feat: 优化权限规则交互`
- `562a9dd 文档: 新增角色权限规则实施计划`

### 本轮新增
- 操作员目录已经从 `admin/user/list` 中拆出，新增了更轻量的 `admin/access/operators` 入口，用于顶部当前操作员切换。
- `admin/user/list` 现在只保留给真正的管理列表读取，不再承担 bootstrap 目录职责。
- 后端已经接入模块 / 动作级审计日志，新增 `admin/audit/list` 作为可查询的审计入口。
- 审计日志会记录：
  - 操作员
  - 小区
  - 路由
  - 模块 / 动作
  - 成功 / 失败结果
  - 参数摘要
- 前端权限页已经增加“操作审计”面板，可以直接查看最近的后端审计记录。
- `admin_audit_logs` 已经同步到 CloudBase MySQL，且资源权限是 `ADMINONLY`。
- `community_modules` 已经同步到 CloudBase MySQL，且资源权限是 `ADMINONLY`。
- 后端已经能按小区补齐模块目录，并通过 `checkModuleEnabled` 拦截未启用模块。
- 后端模块拦截已经从后台路由扩展到用户侧路由，像 `repair/list`、`repair/create`、`user/community_switch`、`user/house_bind` 这类入口也会先校验小区模块是否启用。
- 后台“权限管理”页已经新增“模块开关” Tab，支持当前小区单模块开关、全部开启和全部关闭。
- 小程序首页已经改成动态入口版，会根据当前小区模块和业主认证状态生成入口。
- 本地代码和静态站点已经同步到最新版本。

## 下一步应该做什么

### 优先级 1：用真实后台操作验证审计日志
现在 `admin_audit_logs` 表和 `community_modules` 表都已经建好，资源权限也已经锁到 `ADMINONLY`。下一步要做的是：
- 触发一两个真实的后台接口
- 确认审计日志能落库
- 确认 `admin/audit/list` 能正常看到成功 / 失败记录

### 优先级 2：把审计数据做成可排查视图
现在已经能在权限页里看到最近记录，但后续可以再做两件事：
- 加筛选条件：按操作员、小区、路由、时间范围筛选
- 加详情弹窗：展开查看更完整的参数摘要和失败原因

### 优先级 3：继续收紧剩余后台目录
当前已经完成：
- `admin/user/list` 从 bootstrap 目录拆出
- 顶部操作员目录改用 `admin/access/operators`

下一步可以继续把其它 bootstrap 入口拆成“最小可用目录”和“真正的管理入口”两层，避免目录职责继续膨胀。

### 优先级 4：把权限模型继续下沉到菜单显示
后端已经按“角色 + 小区 + 动作”做了校验，前端还可以进一步同步这套规则：
- 从当前角色推导出可见模块
- 隐藏或禁用没有权限的入口
- 按钮被隐藏或禁用时，要给出明确原因

### 优先级 5：继续完善首页入口和模块映射
- 现在首页已经支持按模块开关动态显示入口。
- 后续如果新增模块，需要同时更新后台模块目录、首页入口映射和测试。

### 权限判断顺序
后端判断权限时，建议一直保持这个顺序：
- 角色先决定默认可见菜单范围
- 小区权限再覆盖到按钮 / 动作级
- 用户只要被限制在指定小区，小区范围就应该始终优先生效

## 注意事项

- 不要在没有重新构建的情况下直接覆盖现有 `web-admin/dist`。
- 不要把“角色默认菜单”模型替换成每个页面各写各的临时判断。
- 不要让小区权限把角色默认值完全抹掉。小区权限应该是在动作级做覆盖或扩展，而不是删掉基础菜单结构。
- 提交记录请继续使用中文。这个仓库的功能提交已经采用中文总结。
- 后端和数据库改动时，要保持 CloudBase 和 Git 同步，并放在同一个改动集合里处理。
- 审计日志里不要记录明文密码、令牌或过长正文，当前已经做了基础脱敏，但后续新增字段时仍要继续保持脱敏。
- 如果后续新增新的用户侧业务路由，记得同步补进 `permission_engine.js` 的路由规则表，否则它不会进入全局模块拦截。

## 最重要的文件

- `web-admin/src/utils/permissions.js`
- `web-admin/src/App.vue`
- `web-admin/src/style.css`
- `web-admin/tests/permission_utils.test.mjs`
- `web-admin/dist/`
- `cloudfunctions/sxmini/index.js`
- `cloudfunctions/sxmini/admin_audit.js`
- `cloudfunctions/sxmini/community_modules.js`
- `cloudfunctions/sxmini/permission_engine.js`
- `database/mysql/schema.sql`
- `web-admin/src/utils/modules.js`
- `miniprogram/utils/modules.js`

## 建议的下一步顺序

1. 用一次真实后台操作验证审计记录写入。
2. 如果需要，再把审计页加筛选和详情。
3. 后续继续拆分剩余 bootstrap 入口，保持“目录”和“管理”职责分离。
4. 把前端菜单可见性继续接到 `module + action` 权限上。
