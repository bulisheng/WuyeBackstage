<template>
	<section class="panel permission-panel">
		<div class="panel-head">
			<h2>权限管理</h2>
			<span>{{ permissionPanelSummary }}</span>
		</div>
		<div class="tab-strip">
			<button :class="{ active: workspace.activePermissionTab === 'admins' }" @click="workspace.activePermissionTab = 'admins'">管理员</button>
			<button :class="{ active: workspace.activePermissionTab === 'permissions' }" @click="workspace.activePermissionTab = 'permissions'">管理权限</button>
			<button :class="{ active: workspace.activePermissionTab === 'modules' }" @click="workspace.activePermissionTab = 'modules'">模块开关</button>
			<button :class="{ active: workspace.activePermissionTab === 'audit' }" @click="workspace.activePermissionTab = 'audit'">操作审计</button>
		</div>

		<template v-if="workspace.activePermissionTab === 'admins'">
			<div class="permission-grid">
				<div class="form-actions">
					<button class="primary" :disabled="!workspace.canAction('admin:user:manage')" @click="openAdminModal()">新增管理员</button>
				</div>
			</div>
			<table class="spaced-table">
				<thead>
					<tr>
						<th>手机号</th>
						<th>全局角色</th>
						<th>默认小区</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in workspace.admins" :key="item.id">
						<td>{{ item.mobileMasked || item.mobile || item.username }}</td>
						<td>{{ item.roleLabel }}</td>
						<td>{{ workspace.communityNameById(item.communityId) }}</td>
						<td><span class="status" :class="item.active ? 'approved' : 'disabled'">{{ item.active ? '启用' : '停用' }}</span></td>
						<td class="actions">
							<button :disabled="!workspace.canAction('admin:user:manage')" @click="openAdminModal(item)">编辑</button>
							<button class="danger" :disabled="!workspace.canAction('admin:user:manage')" @click="workspace.removeAdmin(item)">停用</button>
						</td>
						</tr>
					</tbody>
				</table>

				<ModalDialog v-if="adminModalOpen" :title="adminModalTitle" subtitle="保存后会同步到管理员列表" @close="closeAdminModal">
					<div class="form-grid">
						<label class="field">
							<span>管理员手机号</span>
							<input v-model="workspace.adminForm.mobile" type="tel" maxlength="11" placeholder="请输入管理员手机号" />
						</label>
						<label class="field">
							<span>角色</span>
							<select v-model="workspace.adminForm.role" @change="workspace.syncAdminPermissionRole">
								<option v-for="item in workspace.roleOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
							</select>
						</label>
						<div class="role-preview span-2">
							<div class="preview-head">
								<h4>默认菜单</h4>
								<span>{{ workspace.adminRoleAccess.note || '默认权限预览' }}</span>
							</div>
							<div class="chip-row">
								<span v-for="item in (workspace.adminRoleAccess.menuLabels || [])" :key="item" class="chip">{{ item }}</span>
							</div>
						</div>
						<label class="field">
							<span>可管理小区</span>
							<select v-model.number="workspace.adminForm.communityId">
								<option :value="0">全部小区</option>
								<option v-for="item in workspace.communities" :key="item.id" :value="item.id">{{ workspace.communityLabel(item) }}</option>
							</select>
						</label>
						<label class="field checkbox-field">
							<input v-model="workspace.adminForm.active" :true-value="1" :false-value="0" type="checkbox" />
							<span>启用</span>
						</label>
						<label class="field">
							<span>细分权限小区</span>
							<select v-model.number="workspace.adminForm.permissionCommunityId" @change="workspace.loadAdminPermissionForForm">
								<option :value="0">不设置，按全部小区默认权限</option>
								<option v-for="item in workspace.communities" :key="item.id" :value="item.id">{{ workspace.communityLabel(item) }}</option>
							</select>
						</label>
						<label class="field">
							<span>小区角色</span>
							<select v-model="workspace.adminForm.permissionRole" @change="workspace.adminForm.permissions = ''">
								<option v-for="item in workspace.roleOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
							</select>
						</label>
						<label class="field checkbox-field">
							<input v-model="workspace.adminForm.permissionActive" :true-value="1" :false-value="0" type="checkbox" />
							<span>启用当前配置</span>
						</label>
						<div class="role-preview span-2">
							<div class="preview-head">
								<h4>展示模块</h4>
								<span>决定该管理员在当前小区能看到哪些后台菜单</span>
							</div>
							<div class="chip-row selectable">
								<button v-for="item in workspace.adminMenuOptions" :key="item.key" type="button" class="chip chip-button" :class="{ selected: (workspace.adminPermissionAccess.menus || []).includes(item.key) }" @click="workspace.toggleAdminMenu(item.key)">
									{{ item.label }}
								</button>
							</div>
						</div>
						<div class="role-preview span-2">
							<div class="preview-head">
								<h4>操作权限</h4>
								<span>决定该管理员在当前小区能执行哪些按钮动作</span>
							</div>
							<div class="chip-row selectable">
								<button v-for="item in workspace.adminActionOptions" :key="item.key" type="button" class="chip chip-button" :class="{ selected: (workspace.adminPermissionAccess.actions || []).includes('*') || (workspace.adminPermissionAccess.actions || []).includes(item.key) }" @click="workspace.toggleAdminAction(item.key)">
									{{ item.label }}
								</button>
							</div>
							<p class="helper-text">当前拒绝菜单：{{ deniedMenuText }}</p>
							<p class="helper-text">当前拒绝动作：{{ deniedActionText }}</p>
						</div>
					</div>
					<template #actions>
						<button type="button" @click="closeAdminModal">取消</button>
						<button class="primary" :disabled="!workspace.canAction('admin:user:manage')" @click="saveAdmin">
							{{ workspace.editingAdminId ? '保存' : '新增管理员' }}
						</button>
					</template>
				</ModalDialog>
		</template>

		<template v-else-if="workspace.activePermissionTab === 'permissions'">
			<div class="permission-grid">
				<div class="form-actions">
					<button class="primary" :disabled="!workspace.canAction('admin:permission:manage')" @click="openPermissionModal()">新增权限记录</button>
				</div>
			</div>
			<table class="spaced-table">
				<thead>
					<tr>
						<th>管理员</th>
						<th>小区</th>
						<th>小区角色</th>
						<th>权限令牌</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in workspace.permissions" :key="item.id">
						<td>{{ item.mobileMasked || item.mobile || item.username || `#${item.adminId}` }}</td>
						<td>{{ item.communityName || workspace.communityNameById(item.communityId) }}</td>
						<td>{{ item.roleLabel || item.role }}</td>
						<td>{{ Array.isArray(item.permissions) && item.permissions.length ? item.permissions.join(', ') : '默认角色权限' }}</td>
						<td><span class="status" :class="item.active ? 'approved' : 'disabled'">{{ item.active ? '启用' : '停用' }}</span></td>
						<td class="actions">
							<button :disabled="!workspace.canAction('admin:permission:manage')" @click="openPermissionModal(item)">编辑</button>
							<button v-if="workspace.canAction('admin:permission:manage')" class="danger" :disabled="!workspace.canAction('admin:permission:manage')" @click="workspace.removePermission(item)">删除</button>
						</td>
					</tr>
					<tr v-if="!workspace.permissions.length">
						<td colspan="6" class="empty-cell">当前暂无权限记录。</td>
						</tr>
					</tbody>
				</table>

				<ModalDialog v-if="permissionModalOpen" :title="permissionModalTitle" subtitle="保存后会同步到权限列表" @close="closePermissionModal">
					<div class="form-grid">
						<label class="field">
							<span>管理员</span>
							<select v-model.number="workspace.permissionForm.adminId">
								<option :value="0">选择管理员</option>
								<option v-for="item in workspace.admins" :key="item.id" :value="item.id">{{ item.mobileMasked || item.mobile || item.username }} · {{ item.roleLabel }}</option>
							</select>
						</label>
						<label class="field">
							<span>小区</span>
							<select v-model.number="workspace.permissionForm.communityId">
								<option :value="0">选择小区</option>
								<option v-for="item in workspace.communities" :key="item.id" :value="item.id">{{ workspace.communityLabel(item) }}</option>
							</select>
						</label>
						<label class="field">
							<span>小区角色</span>
							<select v-model="workspace.permissionForm.role">
								<option v-for="item in workspace.roleOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
							</select>
						</label>
						<label class="field checkbox-field">
							<input v-model="workspace.permissionForm.active" :true-value="1" :false-value="0" type="checkbox" />
							<span>启用</span>
						</label>
						<label class="field span-2">
							<span>权限令牌</span>
							<textarea v-model="workspace.permissionForm.permissions" placeholder="如：menu:permissions, action:admin:user:manage, !menu:fees"></textarea>
						</label>
					</div>
					<template #actions>
						<button type="button" @click="closePermissionModal">取消</button>
						<button class="primary" :disabled="!workspace.canAction('admin:permission:manage')" @click="savePermission">
							{{ workspace.editingPermissionId ? '保存' : '新增权限' }}
						</button>
					</template>
				</ModalDialog>
		</template>

		<template v-else-if="workspace.activePermissionTab === 'modules'">
			<div class="permission-grid">
				<DetailCard title="当前小区模块开关" :subtitle="workspace.activeCommunity ? workspace.communityLabel(workspace.activeCommunity) : '请先选择小区'" cardClass="permission-card span-2">
					<div v-if="!workspace.activeCommunity" class="empty-state">
						<div class="empty-title">请先在顶部选择小区。</div>
						<span class="subtle">模块开关按小区保存，新增小区默认全部开启。</span>
					</div>
					<template v-else>
						<div class="module-actions">
							<span class="helper-text">当前状态：{{ workspace.currentCommunityModuleSummary }}</span>
							<div class="form-actions compact">
								<button class="primary" :disabled="!workspace.canAction('community:module:manage')" @click="workspace.restoreAllModules">全部开启</button>
								<button :disabled="!workspace.canAction('community:module:manage')" @click="workspace.batchUpdateModules(0)">全部关闭</button>
							</div>
						</div>
						<table class="spaced-table">
							<thead>
								<tr>
									<th>模块</th>
									<th>说明</th>
									<th>分组</th>
									<th>认证要求</th>
									<th>状态</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="item in workspace.currentCommunityModules" :key="item.key">
									<td>
										<div class="matrix-community">
											<strong>{{ workspace.moduleDisplayLabel(item) }}</strong>
											<span>{{ item.key }}</span>
										</div>
									</td>
									<td>{{ workspace.moduleDisplayDescription(item) || '当前暂无说明。' }}</td>
									<td>{{ item.group || '-' }}</td>
									<td>{{ item.authRequired ? '是' : '否' }}</td>
									<td><span class="status" :class="item.enabled ? 'approved' : 'disabled'">{{ workspace.moduleEnabledLabel(item) }}</span></td>
									<td class="actions">
										<button :disabled="!workspace.canAction('community:module:manage')" @click="workspace.toggleModule(item)">{{ item.enabled ? '关闭' : '开启' }}</button>
									</td>
								</tr>
							</tbody>
						</table>
					</template>
				</DetailCard>
			</div>
		</template>

		<template v-else>
			<DetailCard v-if="workspace.canAction('admin:audit:view')" title="操作审计" :subtitle="`${workspace.auditLogs.length} 条最近记录`" cardClass="audit-panel">
				<table class="spaced-table">
					<thead>
						<tr>
							<th>时间</th>
							<th>操作员</th>
							<th>小区</th>
							<th>路由</th>
							<th>模块 / 动作</th>
							<th>结果</th>
							<th>参数摘要</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in workspace.auditLogs" :key="item.id">
							<td>{{ item.createdAt || '-' }}</td>
							<td>{{ item.mobileMasked || item.mobile || item.username }} · {{ item.roleLabel }}</td>
							<td>{{ item.communityName || '全局' }}</td>
							<td>{{ item.route }}</td>
							<td>{{ item.moduleKey || '-' }} / {{ item.actionKey || '-' }}</td>
							<td><span class="status" :class="item.status === 'success' ? 'approved' : 'disabled'">{{ item.status === 'success' ? '成功' : '失败' }}</span></td>
							<td>{{ item.message ? `${item.message} · ` : '' }}{{ workspace.auditParamsLabel(item) }}</td>
						</tr>
					</tbody>
				</table>
			</DetailCard>
		</template>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import ModalDialog from '../components/common/ModalDialog.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const adminModalOpen = ref(false);
const permissionModalOpen = ref(false);

const permissionPanelSummary = computed(() => {
	if (workspace.activePermissionTab === 'modules') {
		const community = workspace.activeCommunity ? workspace.communityLabel(workspace.activeCommunity) : '请先选择小区';
		return `${workspace.currentCommunityModuleSummary} · ${community}`;
	}
	if (workspace.activePermissionTab === 'permissions') {
		return `${workspace.permissions.length} 条权限记录`;
	}
	if (workspace.activePermissionTab === 'audit') {
		return `${workspace.auditLogs.length} 条审计记录`;
	}
	return `${workspace.admins.length} 个管理员`;
});

const deniedMenuText = computed(() => {
	const labels = workspace.adminPermissionAccess && Array.isArray(workspace.adminPermissionAccess.deniedMenuLabels)
		? workspace.adminPermissionAccess.deniedMenuLabels
		: [];
	return labels.join('、') || '无';
});

const deniedActionText = computed(() => {
	const labels = workspace.adminPermissionAccess && Array.isArray(workspace.adminPermissionAccess.deniedActionLabels)
		? workspace.adminPermissionAccess.deniedActionLabels
		: [];
	return labels.join('、') || '无';
});

const adminModalTitle = computed(() => workspace.editingAdminId ? '编辑管理员' : '新增管理员');
const permissionModalTitle = computed(() => workspace.editingPermissionId ? '编辑权限记录' : '新增权限记录');

function openAdminModal(item = null) {
	if (item) workspace.editAdmin(item);
	else workspace.resetAdminForm();
	adminModalOpen.value = true;
}

function closeAdminModal() {
	adminModalOpen.value = false;
	workspace.resetAdminForm();
}

async function saveAdmin() {
	const result = await workspace.saveAdmin();
	if (result) {
		adminModalOpen.value = false;
	}
}

function openPermissionModal(item = null) {
	if (item) workspace.editPermission(item);
	else workspace.resetPermissionForm();
	permissionModalOpen.value = true;
}

function closePermissionModal() {
	permissionModalOpen.value = false;
	workspace.resetPermissionForm();
}

async function savePermission() {
	const result = await workspace.savePermission();
	if (result) {
		permissionModalOpen.value = false;
	}
}
</script>
