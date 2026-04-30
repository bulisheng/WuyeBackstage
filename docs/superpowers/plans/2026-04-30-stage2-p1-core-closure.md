# Stage 2 P1 Core Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the second-stage P1 must-go-live capabilities for billing, repair, and the shared task engine so the platform can charge, accept repair requests, and reuse a unified workflow backbone.

**Architecture:** Keep the existing CloudBase MySQL + cloud function stack. Add a unified task foundation first, then layer billing and repair on top of it with shared community isolation, shared auditability, and a consistent status/log model. Billing and repair each get their own page flows, but both write through the same community-scoped backend conventions so later complaint/service modules can reuse the same engine.

**Tech Stack:** CloudBase MySQL, CloudBase cloud functions, WeChat Mini Program, Vue admin, vanilla Node.js, existing static hosting.

---

### Task 1: Add the unified task foundation that billing and repair can share

**Files:**
- Modify: `shengxing-property-core/database/mysql/schema.sql`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Create: `shengxing-property-core/cloudfunctions/sxmini/task_engine.js`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/task_engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../task_engine.js');

test('task engine exposes billing and repair status presets', () => {
  assert.equal(engine.TASK_TYPES.repair, '报修');
  assert.equal(engine.TASK_TYPES.complaint, '投诉建议');
  assert.equal(engine.TASK_STATUSES.pending, '待受理');
  assert.equal(engine.TASK_STATUSES.completed, '已完成');
});

test('task logs normalize the change payload', () => {
  const payload = engine.buildTaskLogPayload({
    taskId: 9,
    communityId: 3,
    operatorId: 88,
    operatorType: 'admin',
    action: 'assign',
    fromStatus: 'pending',
    toStatus: 'assigned',
    content: '派给维修人员',
  });
  assert.equal(payload.taskId, 9);
  assert.equal(payload.communityId, 3);
  assert.equal(payload.toStatus, 'assigned');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/task_engine.test.js`

Expected: FAIL because `task_engine.js` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
const TASK_TYPES = {
  repair: '报修',
  complaint: '投诉建议',
  property_service: '物业服务',
  customer_service: '客服工单'
};

const TASK_STATUSES = {
  pending: '待受理',
  assigned: '已分配',
  processing: '处理中',
  completed: '已完成',
  confirmed: '用户已确认',
  rated: '已评价',
  closed: '已关闭',
  timeout: '已超时',
  escalated: '已升级',
  cancelled: '已取消'
};

function buildTaskLogPayload(input = {}) {
  return {
    taskId: Number(input.taskId || 0),
    communityId: Number(input.communityId || 0),
    operatorId: Number(input.operatorId || 0),
    operatorType: String(input.operatorType || '').trim(),
    action: String(input.action || '').trim(),
    fromStatus: String(input.fromStatus || '').trim(),
    toStatus: String(input.toStatus || '').trim(),
    content: String(input.content || '').trim()
  };
}

module.exports = { TASK_TYPES, TASK_STATUSES, buildTaskLogPayload };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/task_engine.test.js`

Expected: PASS with 2 assertions.

- [ ] **Step 5: Commit**

```bash
git add shengxing-property-core/database/mysql/schema.sql shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/cloudfunctions/sxmini/task_engine.js shengxing-property-core/cloudfunctions/sxmini/test/task_engine.test.js
git commit -m "新增: 统一工单底座"
```

### Task 2: Build the billing system backend and admin list flow

**Files:**
- Modify: `shengxing-property-core/database/mysql/schema.sql`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Modify: `shengxing-property-core/web-admin/src/App.vue`
- Modify: `shengxing-property-core/web-admin/src/api/admin.js`
- Modify: `shengxing-property-core/web-admin/src/style.css`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/billing_engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');

test('billing schema includes bill number and payment records', () => {
  const schema = require('node:fs').readFileSync(
    'shengxing-property-core/database/mysql/schema.sql',
    'utf8'
  );
  assert.match(schema, /CREATE TABLE IF NOT EXISTS `rzb`\.`fee_bills`/);
  assert.match(schema, /bill_no/);
  assert.match(schema, /payments/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/billing_engine.test.js`

Expected: FAIL because the test file is not implemented yet and billing engine support is incomplete.

- [ ] **Step 3: Write minimal implementation**

```js
// Add billing tables for bills, bill_items, payments, and reminder logs.
// Expose admin routes for list/detail/create/submit-reminder.
// Expose user routes for list/detail and payment record lookup.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/billing_engine.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shengxing-property-core/database/mysql/schema.sql shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/web-admin/src/App.vue shengxing-property-core/web-admin/src/api/admin.js shengxing-property-core/web-admin/src/style.css shengxing-property-core/cloudfunctions/sxmini/test/billing_engine.test.js
git commit -m "实现: 缴费系统基础闭环"
```

### Task 3: Build the repair system on top of the task foundation

**Files:**
- Modify: `shengxing-property-core/database/mysql/schema.sql`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.js`
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.wxml`
- Modify: `shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.wxss`
- Modify: `shengxing-property-core/web-admin/src/App.vue`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/repair_engine.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../task_engine.js');

test('repair tasks reuse the shared task status map', () => {
  assert.equal(engine.TASK_TYPES.repair, '报修');
  assert.equal(engine.TASK_STATUSES.assigned, '已分配');
  assert.equal(engine.TASK_STATUSES.timeout, '已超时');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/repair_engine.test.js`

Expected: FAIL until repair routes and shared task data flow are wired.

- [ ] **Step 3: Write minimal implementation**

```js
// Implement repair submission, repair list, repair detail, and status update flow.
// Persist every status change into task_logs.
// Make the admin repair list read from the same shared task engine.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/repair_engine.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shengxing-property-core/database/mysql/schema.sql shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.js shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.wxml shengxing-property-core/miniprogram/projects/house/pages/repair/index/repair_index.wxss shengxing-property-core/web-admin/src/App.vue shengxing-property-core/cloudfunctions/sxmini/test/repair_engine.test.js
git commit -m "实现: 报修系统基础闭环"
```

### Task 4: Wire billing and repair into the unified task engine and refresh docs

**Files:**
- Modify: `shengxing-property-core/cloudfunctions/sxmini/index.js`
- Modify: `shengxing-property-core/cloudfunctions/sxmini/task_engine.js`
- Modify: `shengxing-property-core/docs/AI理解文档.md`
- Modify: `shengxing-property-core/docs/闭环.md`
- Modify: `shengxing-property-core/docs/03-页面功能说明.md`
- Create: `shengxing-property-core/cloudfunctions/sxmini/test/p1_closure.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../task_engine.js');

test('task engine keeps billing and repair concepts separate but compatible', () => {
  assert.equal(engine.TASK_TYPES.repair, '报修');
  assert.ok(Object.keys(engine.TASK_TYPES).includes('customer_service'));
  assert.ok(Object.keys(engine.TASK_STATUSES).includes('cancelled'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/p1_closure.test.js`

Expected: FAIL until the final integration layer is wired.

- [ ] **Step 3: Write minimal implementation**

```js
// Normalize all repair-like records through the task engine.
// Ensure billing reminder actions and repair status actions write task_logs.
// Refresh AI理解文档, 闭环, and 页面功能说明 to reflect the live P1 scope.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node shengxing-property-core/cloudfunctions/sxmini/test/p1_closure.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shengxing-property-core/cloudfunctions/sxmini/index.js shengxing-property-core/cloudfunctions/sxmini/task_engine.js shengxing-property-core/docs/AI理解文档.md shengxing-property-core/docs/闭环.md shengxing-property-core/docs/03-页面功能说明.md shengxing-property-core/cloudfunctions/sxmini/test/p1_closure.test.js
git commit -m "完善: 第二阶段P1核心闭环"
```

### Task 5: Final verification and CloudBase sync

**Files:**
- Review: all files changed in Tasks 1-4

- [ ] **Step 1: Run the full focused test set**

Run:
```bash
node shengxing-property-core/cloudfunctions/sxmini/test/task_engine.test.js
node shengxing-property-core/cloudfunctions/sxmini/test/billing_engine.test.js
node shengxing-property-core/cloudfunctions/sxmini/test/repair_engine.test.js
node shengxing-property-core/cloudfunctions/sxmini/test/p1_closure.test.js
node --check shengxing-property-core/cloudfunctions/sxmini/index.js
```

Expected: all pass.

- [ ] **Step 2: Sync CloudBase resources**

Update the `sxmini` cloud function code and any MySQL schema changes in CloudBase.

- [ ] **Step 3: Confirm online state**

Verify the cloud function detail and database resource state show the latest version.

- [ ] **Step 4: Commit any final doc-only follow-up**

If docs need a last pass, commit it in Chinese with a short summary.

