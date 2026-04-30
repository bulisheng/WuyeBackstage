# Role Permission Rules and Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make role permissions first decide which admin menus are visible, then let community permissions override action/button-level operations, and expose both layers clearly in the permissions page.

**Architecture:** Keep the existing admin and community permission tables, but move the meaning of each permission record into a small shared rule helper. The permissions page will render a role menu preview, an action override preview, and a clickable community/role matrix so operators can jump from the summary view into the exact record they need to edit.

**Tech Stack:** Vue 3, Vite, vanilla JavaScript, CloudBase static hosting.

---

### Task 1: Add role access presets and preview helpers

**Files:**
- Modify: `web-admin/src/utils/permissions.js`
- Modify: `web-admin/tests/permission_utils.test.mjs`

- [ ] **Step 1: Add a failing test for role menu presets and merged access**

```js
import assert from 'node:assert/strict';
import {
  buildEffectiveAccess,
  buildRoleAccessProfile
} from '../src/utils/permissions.js';

const finance = buildRoleAccessProfile('finance');
assert.deepEqual(finance.menus, ['dashboard', 'fees', 'notices']);
assert.ok(finance.actions.includes('fee:view'));

const merged = buildEffectiveAccess('repairman', ['repair:close', 'repair:assign']);
assert.ok(merged.menus.includes('repairs'));
assert.ok(merged.actions.includes('repair:close'));
assert.ok(merged.extraActions.includes('repair:assign'));
```

- [ ] **Step 2: Run the test and confirm it fails before implementation**

Run: `node web-admin/tests/permission_utils.test.mjs`

Expected: FAIL because the new helper functions do not exist yet.

- [ ] **Step 3: Implement the minimal helper logic**

```js
const ROLE_ACCESS_PRESETS = {
  super_admin: {
    menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
    actions: ['*']
  },
  admin: {
    menus: ['dashboard', 'owners', 'announcements', 'communities', 'permissions', 'repairs', 'fees', 'complaints', 'notices'],
    actions: ['community:edit', 'announcement:publish', 'owner:audit', 'repair:assign', 'fee:manage', 'complaint:handle', 'notice:publish']
  },
  finance: {
    menus: ['dashboard', 'fees', 'notices'],
    actions: ['fee:view', 'fee:collect', 'fee:remind', 'fee:export']
  },
  customer_service: {
    menus: ['dashboard', 'owners', 'announcements', 'repairs', 'complaints', 'notices'],
    actions: ['owner:audit', 'announcement:publish', 'repair:view', 'repair:assign', 'complaint:handle', 'notice:publish']
  },
  repairman: {
    menus: ['dashboard', 'repairs', 'notices'],
    actions: ['repair:view', 'repair:assign', 'repair:update', 'repair:close']
  }
};
```

- [ ] **Step 4: Re-run the test and confirm it passes**

Run: `node web-admin/tests/permission_utils.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the helper change**

```bash
git add web-admin/src/utils/permissions.js web-admin/tests/permission_utils.test.mjs
git commit -m "feat: add role access preview helpers"
```

### Task 2: Make the permissions page interactive

**Files:**
- Modify: `web-admin/src/App.vue`
- Modify: `web-admin/src/style.css`

- [ ] **Step 1: Add the role preview panel and clickable matrix cells**

```vue
<div class="access-preview">
  <div class="preview-block">
    <h4>默认菜单</h4>
    <div class="chip-row">
      <span v-for="item in selectedRoleAccess.menus" :key="item" class="chip">{{ item }}</span>
    </div>
  </div>
  <div class="preview-block">
    <h4>动作权限</h4>
    <div class="chip-row">
      <button v-for="item in selectedRoleAccess.actions" :key="item" class="chip chip-button" @click="appendPermissionToken(item)">{{ item }}</button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Wire the matrix cell click to open the matching record**

```js
function openMatrixCell(row, cell) {
  const activeRecord = cell.records.find((item) => item.active !== false && item.active !== 0 && item.active !== '0');
  if (activeRecord) {
    editPermission(activeRecord);
    return;
  }
  editingPermissionId.value = '';
  permissionForm.value = { adminId: 0, communityId: row.communityId, role: cell.role, permissions: '', active: 1 };
  activeTab.value = 'permissions';
}
```

- [ ] **Step 3: Add styles so the preview reads like a rule editor**

```css
.access-preview {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid #edf0ee;
  border-radius: 8px;
  background: #fff;
}
```

- [ ] **Step 4: Verify the UI still builds**

Run: `npm run build` in `web-admin`

Expected: PASS.

- [ ] **Step 5: Commit the interaction change**

```bash
git add web-admin/src/App.vue web-admin/src/style.css
git commit -m "feat: improve permission rule interaction"
```

### Task 3: Publish the updated admin site

**Files:**
- Modify: `web-admin/dist/**`

- [ ] **Step 1: Build the site**

Run: `npm run build` in `web-admin`

Expected: PASS with a fresh `dist` directory.

- [ ] **Step 2: Upload the new dist to CloudBase static hosting**

Run: upload the rebuilt `web-admin/dist` to the current static hosting root and `sxwy-admin/`.

- [ ] **Step 3: Verify the uploaded files changed**

Run: `findFiles` for `index.html` and `sxwy-admin/index.html`

Expected: both entries point to the new build timestamp.

- [ ] **Step 4: Commit the published build**

```bash
git add web-admin/dist
git commit -m "chore: sync admin static build"
```
