# AI Handoff: Community Permissions State

> This document is for the next AI agent that continues work on the Shengxing Property admin SaaS. Read this before making changes.

## What has already been done

### Stage 1 foundation
- Community switching has been introduced in the admin backend.
- Current community selection is persisted.
- Community CRUD exists in the admin UI.
- Static hosting has been updated with the latest `web-admin/dist`.

### Permission system
- Admins, community permissions, and roles are already modeled in the backend and admin UI.
- The permissions page now shows a community-by-role matrix.
- Role defaults are already defined in the frontend helper:
  - `super_admin`
  - `admin`
  - `finance`
  - `customer_service`
  - `repairman`
- Role-level menu presets and action-level presets now exist in:
  - `web-admin/src/utils/permissions.js`
- The permissions page already has:
  - a role default-menu preview
  - a quick action token panel
  - clickable matrix cells that jump into the matching permission record

### Latest commits
- `c10d783 feat: 优化权限规则交互`
- `562a9dd 文档: 新增角色权限规则实施计划`

## What should happen next

### Priority 1: move permission enforcement into the backend
The current work mainly improves UI and frontend rule previews. The next real milestone is backend enforcement.

Implement these checks in the relevant admin/business endpoints:
- `checkCommunityPermission`
- `checkModuleEnabled`
- `checkRolePermission`

The backend should treat permissions in this order:
- role decides the default visible menu range
- community permissions override to action/button level
- community scope always wins when the user is restricted to specific communities

### Priority 2: connect the permission model to real menu visibility
The admin UI currently previews role menus, but most navigation is still static.
Next step:
- derive visible modules from the active role
- hide or disable entries that are not allowed
- show a clear reason when a button is hidden or disabled

### Priority 3: make community overrides explicit
Add or improve UI so an operator can tell:
- which permissions come from the role default
- which permissions are added by the community override
- which actions are still missing and need to be granted

## What to watch out for

- Do not overwrite the existing `web-admin/dist` without rebuilding first.
- Do not replace the role-default/menu model with a per-page ad hoc check.
- Do not let community permissions erase the role defaults entirely. Community permissions should override or extend at action level, not remove the baseline menu structure.
- Keep Chinese commit messages. This repo already uses Chinese commit summaries for feature work.
- When updating backend and database changes, keep CloudBase and Git in sync in the same change set.

## Files that matter most

- `web-admin/src/utils/permissions.js`
- `web-admin/src/App.vue`
- `web-admin/src/style.css`
- `web-admin/tests/permission_utils.test.mjs`
- `web-admin/dist/`

## Suggested next implementation order

1. Add backend permission middleware.
2. Wire permission middleware into the admin endpoints.
3. Make the menu layer consume role defaults.
4. Make button/action layer consume community overrides.
5. Rebuild and publish `web-admin/dist`.
