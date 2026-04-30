# 小区模块开关与动态首页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 `community_modules`、后台模块开关页、后端模块校验和小程序首页动态入口，完成第一阶段剩余底座能力。

**Architecture:** 代码侧维护全量模块目录，数据库按小区存储模块启停状态。后台“权限管理”页增加模块开关 Tab，后端统一入口增加 `checkModuleEnabled`，小程序首页根据当前小区模块状态动态生成入口列表。实现保持在现有 `sxmini` 云函数与 `web-admin` 页面结构内，不引入新的主菜单页。

**Tech Stack:** CloudBase MySQL、CloudBase 云函数、Vue 3、Vite、微信小程序页面逻辑。

---

### Task 1: 建立 `community_modules` 数据表和模块目录

**Files:**
- Modify: `shengxing-property-core/database/mysql/schema.sql`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/community_modules.test.js`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('assert');
const engine = require('../permission_engine.js');

assert.ok(Array.isArray(engine.MODULE_CATALOG));
assert.ok(engine.MODULE_CATALOG.length > 0);
assert.equal(engine.MODULE_CATALOG.some((item) => item.key === 'permissions'), true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/community_modules.test.js`
Expected: 失败，原因是 `MODULE_CATALOG` 还没导出，且表结构还没补齐。

- [ ] **Step 3: 写最小实现**

```js
// permission_engine.js
const MODULE_CATALOG = [
  { key: 'dashboard', name: '工作台', sort: 1 },
  { key: 'owners', name: '业主', sort: 2 },
  { key: 'communities', name: '小区', sort: 3 },
  { key: 'permissions', name: '权限', sort: 4 },
  { key: 'repairs', name: '报修', sort: 5 },
  { key: 'fees', name: '缴费', sort: 6 },
  { key: 'complaints', name: '投诉', sort: 7 },
  { key: 'notices', name: '通知配置', sort: 8 },
  { key: 'announcements', name: '公告', sort: 9 },
  { key: 'audit', name: '审计', sort: 10 }
];
module.exports.MODULE_CATALOG = MODULE_CATALOG;
```

```sql
CREATE TABLE IF NOT EXISTS `cloudbase-d9g78eneac709f5a5`.`community_modules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `_openid` varchar(64) DEFAULT '' NOT NULL,
  `community_id` bigint unsigned NOT NULL,
  `module_key` varchar(64) NOT NULL,
  `module_name` varchar(120) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort` int NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_community_modules` (`community_id`, `module_key`),
  KEY `idx_community_modules_community_enabled` (`community_id`, `enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/community_modules.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add shengxing-property-core/database/mysql/schema.sql shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/cloudfunctions/sxmini/test/community_modules.test.js
git commit -m "新增小区模块表和模块目录"
```

### Task 2: 后端补齐模块开关接口和统一校验

**Files:**
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/permission_engine.js`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/module_enabled.test.js`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('assert');
const engine = require('../permission_engine.js');

assert.equal(typeof engine.hasModuleEnabled, 'function');
assert.equal(engine.hasModuleEnabled({
  enabledModules: [{ moduleKey: 'dashboard', enabled: true }]
}, 'dashboard'), true);
assert.equal(engine.hasModuleEnabled({
  enabledModules: [{ moduleKey: 'dashboard', enabled: true }]
}, 'audit'), false);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/module_enabled.test.js`
Expected: 失败，原因是 `hasModuleEnabled` 还没实现。

- [ ] **Step 3: 写最小实现**

```js
function hasModuleEnabled(access = {}, moduleKey = '') {
  const key = normalizeText(moduleKey);
  if (!key) return false;
  const modules = Array.isArray(access.enabledModules) ? access.enabledModules : [];
  return modules.some((item) => String(item.moduleKey || '') === key && Boolean(item.enabled));
}
module.exports.hasModuleEnabled = hasModuleEnabled;
```

```js
function checkModuleEnabled(context, moduleKey) {
  if (!context) return;
  if (!permissionEngine.hasModuleEnabled(context.access, moduleKey)) {
    throw new Error('当前小区未启用该模块');
  }
}
```

```js
// 在 admin 路由里，先查当前小区，再 checkModuleEnabled，再 checkAdminAccess
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/module_enabled.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/cloudfunctions/sxmini/permission_engine.js shengxing-property-core/cloudfunctions/sxmini/test/module_enabled.test.js
git commit -m "后端增加模块启用校验"
```

### Task 3: 在“权限管理”页增加模块开关 Tab

**Files:**
- Modify: `shengxing-property-core/web-admin/src/App.vue`
- Modify: `shengxing-property-core/web-admin/src/api/admin.js`
- Modify: `shengxing-property-core/web-admin/src/style.css`
- Create: `shengxing-property-core/web-admin/tests/module_permissions.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
import assert from 'node:assert/strict';
import { buildModuleMatrix } from '../src/utils/modules.js';

const matrix = buildModuleMatrix(
  [{ id: 1, name: 'A' }],
  [{ key: 'dashboard', name: '工作台' }],
  [{ communityId: 1, moduleKey: 'dashboard', enabled: true }]
);

assert.equal(matrix[0].modules[0].enabled, true);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node shengxing-property-core/web-admin/tests/module_permissions.test.mjs`
Expected: 失败，原因是 `buildModuleMatrix` 还没实现。

- [ ] **Step 3: 写最小实现**

```js
export function buildModuleMatrix(communities, modules, records) {
  return communities.map((community) => ({
    ...community,
    modules: modules.map((module) => {
      const record = records.find((item) => item.communityId === community.id && item.moduleKey === module.key);
      return {
        ...module,
        enabled: record ? Boolean(record.enabled) : true
      };
    })
  }));
}
```

```vue
<!-- 在 permissions tab 中加入模块开关区域 -->
<button :class="{ active: activePermissionsTab === 'modules' }" @click="activePermissionsTab = 'modules'">模块开关</button>
```

```js
// adminApi 增加 moduleList / moduleSave / moduleBatchSave
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node shengxing-property-core/web-admin/tests/module_permissions.test.mjs`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add shengxing-property-core/web-admin/src/App.vue shengxing-property-core/web-admin/src/api/admin.js shengxing-property-core/web-admin/src/style.css shengxing-property-core/web-admin/tests/module_permissions.test.mjs
git commit -m "后台权限页增加模块开关"
```

### Task 4: 小程序首页改成动态入口版

**Files:**
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.js`
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.wxml`
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.wxss`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`

- [ ] **Step 1: 写失败测试**

```js
const assert = require('assert');
const { buildHomeEntries } = require('../../../../cloudfunctions/sxmini/home_entries.js');

const entries = buildHomeEntries(
  [{ key: 'repair', name: '报修' }],
  { auditStatus: 'approved' }
);

assert.equal(entries.length, 1);
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/home_entries.test.js`
Expected: 失败，原因是 `buildHomeEntries` 还没实现。

- [ ] **Step 3: 写最小实现**

```js
function buildHomeEntries(modules, userState) {
  return modules
    .filter((item) => item.enabled)
    .map((item) => ({
      key: item.key,
      name: item.name,
      visible: true,
      disabled: Boolean(userState && userState.auditStatus !== 'approved' && item.key === 'fees')
    }));
}
module.exports.buildHomeEntries = buildHomeEntries;
```

```xml
<!-- default_index.wxml -->
<block wx:for="{{entries}}" wx:key="key">
  <view wx:if="{{item.visible}}" class="entry">{{item.name}}</view>
</block>
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/home_entries.test.js`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.js shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.wxml shengxing-property-core/miniprogram/projects/house/pages/default/index/default_index.wxss shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/cloudfunctions/sxmini/home_entries.js shengxing-property-core/cloudfunctions/sxmini/test/home_entries.test.js
git commit -m "首页改为动态入口"
```

### Task 5: 文档、构建和静态站点同步

**Files:**
- Modify: `docs/superpowers/specs/2026-04-30-community-modules-dynamic-home-design.md`
- Modify: `docs/superpowers/specs/2026-04-30-ai-handoff-community-permissions.md`
- Update: `shengxing-property-core/web-admin/dist/`

- [ ] **Step 1: 更新交接文档**

补充已完成的模块开关接口、Tab 位置、首页动态入口逻辑和审计范围。

- [ ] **Step 2: 运行全量验证**

Run:
```bash
node shengxing-property-core/cloudfunctions/sxmini/test/community_modules.test.js
node shengxing-property-core/cloudfunctions/sxmini/test/module_enabled.test.js
node shengxing-property-core/web-admin/tests/module_permissions.test.mjs
node shengxing-property-core/web-admin/tests/home_entries.test.mjs
npm run build
```

- [ ] **Step 3: 同步静态站点**

上传 `web-admin/dist` 到 CloudBase 静态站点根目录和 `sxwy-admin/` 目录。

- [ ] **Step 4: 提交**

```bash
git add docs/superpowers/specs/2026-04-30-community-modules-dynamic-home-design.md docs/superpowers/specs/2026-04-30-ai-handoff-community-permissions.md shengxing-property-core/web-admin/dist
git commit -m "同步模块开关和动态首页文档"
```

## 计划自检

- 覆盖了 `community_modules` 表。
- 覆盖了后台模块开关 Tab。
- 覆盖了后端模块启用校验。
- 覆盖了小程序首页动态入口。
- 保持了中文提交记录要求。
- 保持了每个阶段完成后立即提交的节奏。
