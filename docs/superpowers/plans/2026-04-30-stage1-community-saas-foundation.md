# Stage 1 Community SaaS Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `shengxing-property` treat the current community as a first-class request context so the admin can switch communities, the selection persists, and backend list/detail reads can start filtering by community.

**Architecture:** Introduce one small shared community-scope utility in the Cloud Function layer, then thread the current community through the mini program request wrapper and admin/community pages. The backend should keep the existing CCMiniCloud structure, but add a lightweight community context helper so Stage 1 can filter community-bound data without rewriting every controller.

**Tech Stack:** WeChat Mini Program, CloudBase cloud functions, vanilla Node.js, existing CCMiniCloud framework, `wx` local storage.

---

### Task 1: Add a shared community-scope utility and test it first

**Files:**
- Create: `cloudfunctions/mcloud/project/house/service/community_scope.js`
- Create: `cloudfunctions/mcloud/test/community_scope.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const scope = require('../project/house/service/community_scope.js');

test('community names are normalized before storage and comparison', () => {
  assert.equal(scope.normalizeCommunityName('  幸福里小区  '), '幸福里小区');
  assert.equal(scope.normalizeCommunityName(''), '');
  assert.equal(scope.normalizeCommunityName(null), '');
});

test('current community resolves from request before fallback', () => {
  assert.equal(
    scope.resolveCommunityName({ communityName: '阳光城小区' }, '幸福里小区'),
    '阳光城小区'
  );
  assert.equal(scope.resolveCommunityName({}, '幸福里小区'), '幸福里小区');
});

test('community scope filter only adds a condition when a community exists', () => {
  assert.deepEqual(scope.attachCommunityWhere({}, '幸福里小区'), { COMMUNITY_NAME: '幸福里小区' });
  assert.deepEqual(scope.attachCommunityWhere({ STATUS: 1 }, ''), { STATUS: 1 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: FAIL because `community_scope.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeCommunityName(name) {
  if (name == null) return '';
  return String(name).trim();
}

function resolveCommunityName(request = {}, fallback = '') {
  const direct = normalizeCommunityName(request.communityName);
  if (direct) return direct;
  return normalizeCommunityName(fallback);
}

function attachCommunityWhere(where = {}, communityName = '') {
  const name = normalizeCommunityName(communityName);
  if (!name) return Object.assign({}, where);
  return Object.assign({}, where, { COMMUNITY_NAME: name });
}

module.exports = {
  normalizeCommunityName,
  resolveCommunityName,
  attachCommunityWhere,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS with 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/mcloud/project/house/service/community_scope.js cloudfunctions/mcloud/test/community_scope.test.js
git commit -m "test: add community scope utility coverage"
```

### Task 2: Thread current community through the mini program request wrapper

**Files:**
- Modify: `miniprogram/helper/cloud_helper.js`
- Modify: `miniprogram/comm/constants.js`
- Modify: `miniprogram/comm/biz/admin_biz.js`
- Modify: `miniprogram/projects/house/pages/community/switch/community_switch.js`
- Modify: `miniprogram/projects/house/pages/admin/index/home/admin_home.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const scope = require('../../cloudfunctions/mcloud/project/house/service/community_scope.js');

test('community storage key is available as a shared constant', () => {
  assert.equal(scope.normalizeCommunityName('  A  '), 'A');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS from Task 1, then Task 2 implementation validation is done by the changed app behavior.

- [ ] **Step 3: Write minimal implementation**

```js
// cloud helper sends CURRENT_COMMUNITY on every cloud function call.
// constants.js defines CACHE_CURRENT_COMMUNITY.
// admin/community switch pages read and write the same key.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/helper/cloud_helper.js miniprogram/comm/constants.js miniprogram/comm/biz/admin_biz.js miniprogram/projects/house/pages/community/switch/community_switch.js miniprogram/projects/house/pages/admin/index/home/admin_home.js
git commit -m "feat: persist current community in mini program"
```

### Task 3: Add an admin community switcher that uses the real community list

**Files:**
- Modify: `miniprogram/projects/house/pages/admin/workbench/module/admin_module.js`
- Modify: `miniprogram/projects/house/pages/admin/index/home/admin_home.js`
- Modify: `miniprogram/projects/house/pages/admin/workbench/module/admin_module.wxml`
- Modify: `miniprogram/projects/house/pages/admin/workbench/module/admin_module.wxss`

- [ ] **Step 1: Write the failing test**

No new pure logic is required here; verify manually in the app by loading the admin community module and confirming the list comes from `community/list`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS.

- [ ] **Step 3: Write minimal implementation**

```js
// admin_module.js loads communities from the backend when type === 'community'
// and stores the selected item to CACHE_CURRENT_COMMUNITY.
// admin_home.js routes the community tile to the same switcher view.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/projects/house/pages/admin/workbench/module/admin_module.js miniprogram/projects/house/pages/admin/index/home/admin_home.js miniprogram/projects/house/pages/admin/workbench/module/admin_module.wxml miniprogram/projects/house/pages/admin/workbench/module/admin_module.wxss
git commit -m "feat: add admin community switcher"
```

### Task 4: Apply the first backend data-isolation hook

**Files:**
- Modify: `cloudfunctions/mcloud/framework/platform/controller/base_controller.js`
- Modify: `cloudfunctions/mcloud/project/house/service/base_project_service.js`
- Modify: `cloudfunctions/mcloud/project/house/service/module_service.js`
- Modify: `cloudfunctions/mcloud/project/house/controller/module_controller.js`
- Modify: `cloudfunctions/mcloud/project/house/controller/admin/admin_home_controller.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const scope = require('../project/house/service/community_scope.js');

test('community scope filter keeps existing fields and appends COMMUNITY_NAME', () => {
  assert.deepEqual(
    scope.attachCommunityWhere({ STATUS: 1 }, '幸福里小区'),
    { STATUS: 1, COMMUNITY_NAME: '幸福里小区' }
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS after Task 1, then any stage-1 backend hook can reuse the same utility.

- [ ] **Step 3: Write minimal implementation**

```js
// BaseController captures communityName from the request.
// BaseProjectService exposes helper methods to resolve current community context.
// ModuleService uses the helper when reading/writing community-bound records.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test cloudfunctions/mcloud/test/community_scope.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add cloudfunctions/mcloud/framework/platform/controller/base_controller.js cloudfunctions/mcloud/project/house/service/base_project_service.js cloudfunctions/mcloud/project/house/service/module_service.js cloudfunctions/mcloud/project/house/controller/module_controller.js cloudfunctions/mcloud/project/house/controller/admin/admin_home_controller.js
git commit -m "feat: add first community isolation hook"
```

### Task 5: Verify the stage-1 flow end to end

**Files:**
- Review: `miniprogram/app.json`
- Review: `miniprogram/projects/house/pages/default/index/default_index.js`
- Review: `cloudfunctions/mcloud/project/house/public/route.js`

- [ ] **Step 1: Verify request propagation**
- [ ] **Step 2: Verify admin switch persistence**
- [ ] **Step 3: Verify community-filtered reads**
- [ ] **Step 4: Verify no unrelated pages break**
- [ ] **Step 5: Commit the stage**

```bash
git add -A
git commit -m "feat: complete stage 1 community foundation"
```
