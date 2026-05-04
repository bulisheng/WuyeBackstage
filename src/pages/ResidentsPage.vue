<template>
	<section class="panel residents-page">
		<div class="panel-head">
			<div>
				<h2>住户管理</h2>
				<p class="panel-subtitle">手机号优先绑定，业主和租户分开管理，关键资料变更留痕。</p>
			</div>
			<div class="resident-head-actions">
				<span>{{ visibleRows.length }} 条记录</span>
				<button class="primary" :disabled="!workspace.canAction('resident:import')" @click="showImport = true">表格导入</button>
			</div>
		</div>

		<div class="resident-tabs">
			<button
				v-for="tab in tabs"
				:key="tab.key"
				:class="{ active: workspace.residentActiveTab === tab.key }"
				@click="workspace.residentActiveTab = tab.key"
			>
				<strong>{{ tab.label }}</strong>
				<small>{{ tab.count }}</small>
			</button>
		</div>

		<div class="filter-row resident-filters">
			<label class="field wide">
				<span>搜索</span>
				<input v-model="workspace.residentSearchKeyword" type="text" placeholder="手机号 / 房号 / 姓名" />
			</label>
			<label class="field">
				<span>类型</span>
				<select v-model="workspace.residentTypeFilter">
					<option value="all">全部</option>
					<option value="owner">业主</option>
					<option value="tenant">租户</option>
				</select>
			</label>
			<label class="field">
				<span>状态</span>
				<select v-model="workspace.residentStatusFilter">
					<option value="">全部状态</option>
					<option value="pending">待审核</option>
					<option value="approved">已通过</option>
					<option value="rejected">已驳回</option>
					<option value="disabled">已冻结</option>
					<option value="active">租住中</option>
					<option value="moved_out">已迁出</option>
				</select>
			</label>
		</div>

		<ResidentImportDialog
			:open="showImport"
			:submitting="importing"
			@close="showImport = false"
			@import="handleResidentImport"
		/>
		<p v-if="importFeedback" class="empty-text">{{ importFeedback }}</p>

		<table v-if="workspace.residentActiveTab !== 'logs'">
			<thead>
				<tr>
					<th>类型</th>
					<th>姓名</th>
					<th>手机号</th>
					<th>房屋</th>
					<th>状态</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="item in visibleRows"
					:key="`${item.identityType}-${item.id}`"
					class="clickable-row"
					@click="selectResident(item)"
				>
					<td>{{ item.identityType === 'tenant' ? '租户' : '业主' }}</td>
					<td>{{ item.name || '-' }}</td>
					<td>{{ item.mobile || '-' }}</td>
					<td>{{ item.house || '-' }}</td>
					<td><span class="status" :class="item.status">{{ statusLabel(item) }}</span></td>
					<td class="actions resident-actions">
						<button v-if="item.identityType === 'owner'" :disabled="!workspace.canAction('owner:audit')" @click.stop="workspace.auditOwner(item.raw, 'approved')">审核通过</button>
						<button v-if="item.identityType === 'owner'" :disabled="!workspace.canAction('owner:audit')" @click.stop="workspace.auditOwner(item.raw, 'rejected')">驳回</button>
						<button :disabled="!canManage(item)" @click.stop="toggleResidentStatus(item)">{{ item.status === 'disabled' ? '解冻' : '冻结' }}</button>
						<button :disabled="!canManage(item)" @click.stop="editResident(item)">编辑</button>
						<button :disabled="!canManage(item)" @click.stop="changeResidentMobile(item)">换手机号</button>
						<button :disabled="!canManage(item)" @click.stop="changeResidentHouse(item)">换房号</button>
						<button :disabled="!canManage(item)" @click.stop="deleteResident(item)" class="danger">删除</button>
					</td>
				</tr>
			</tbody>
		</table>

		<table v-else>
			<thead>
				<tr>
					<th>住户类型</th>
					<th>住户ID</th>
					<th>字段</th>
					<th>变更前</th>
					<th>变更后</th>
					<th>来源</th>
					<th>时间</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in visibleLogs" :key="item.id">
					<td>{{ item.residentType === 'tenant' ? '租户' : '业主' }}</td>
					<td>{{ item.residentId }}</td>
					<td>{{ item.fieldName }}</td>
					<td>{{ item.beforeValue || '-' }}</td>
					<td>{{ item.afterValue || '-' }}</td>
					<td>{{ item.source || '-' }}</td>
					<td>{{ item.createdAt || '-' }}</td>
				</tr>
			</tbody>
		</table>

		<p v-if="workspace.residentActiveTab !== 'logs' && !visibleRows.length" class="empty-text">暂无匹配住户。</p>
		<p v-if="workspace.residentActiveTab === 'logs' && !visibleLogs.length" class="empty-text">暂无变更记录。</p>

		<ResidentDetailPanel
			:resident="selectedResident"
			:logs="selectedResidentLogs"
			:status-label="selectedResident ? statusLabel(selectedResident) : ''"
			:action-hint="actionHint"
			@close="clearSelectedResident"
		/>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import ResidentDetailPanel from '../components/resident/ResidentDetailPanel.vue';
import ResidentImportDialog from '../components/resident/ResidentImportDialog.vue';
import { adminApi } from '../api/admin.js';
import { matchesResidentKeyword } from '../utils/residentDirectory.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const actionHint = ref('');
const showImport = ref(false);
const importing = ref(false);
const importFeedback = ref('');

const ownerRows = computed(() => workspace.ownerRecords.map((item) => ({
	id: item.id,
	identityType: 'owner',
	name: item.name,
	mobile: item.mobile,
	house: item.house,
	communityName: item.communityName,
	status: item.auditStatus || 'pending',
	raw: item
})));

const tenantRows = computed(() => workspace.tenantRecords.map((item) => ({
	id: item.id,
	identityType: 'tenant',
	name: item.name,
	mobile: item.mobile,
	house: item.house,
	communityName: item.communityName,
	status: item.status || 'active',
	raw: item
})));

const allRows = computed(() => [...ownerRows.value, ...tenantRows.value]);

const tabs = computed(() => [
	{ key: 'owner_audit', label: '业主审核', count: ownerRows.value.filter((item) => ['pending', 'rejected'].includes(item.status)).length },
	{ key: 'owners', label: '业主管理', count: ownerRows.value.length },
	{ key: 'tenants', label: '租户管理', count: tenantRows.value.length },
	{ key: 'logs', label: '变更记录', count: workspace.residentChangeLogs.length }
]);

const visibleRows = computed(() => allRows.value.filter((item) => {
	if (workspace.residentActiveTab === 'owner_audit' && (item.identityType !== 'owner' || !['pending', 'rejected'].includes(item.status))) return false;
	if (workspace.residentActiveTab === 'owners' && item.identityType !== 'owner') return false;
	if (workspace.residentActiveTab === 'tenants' && item.identityType !== 'tenant') return false;
	if (workspace.residentTypeFilter !== 'all' && item.identityType !== workspace.residentTypeFilter) return false;
	if (workspace.residentStatusFilter && item.status !== workspace.residentStatusFilter) return false;
	return matchesResidentKeyword(item, workspace.residentSearchKeyword);
}));

const visibleLogs = computed(() => workspace.residentChangeLogs.filter((item) => {
	if (workspace.residentTypeFilter !== 'all' && item.residentType !== workspace.residentTypeFilter) return false;
	return matchesResidentKeyword({
		mobile: item.afterValue,
		house: item.afterValue,
		name: item.operatorName
	}, workspace.residentSearchKeyword);
}));

const selectedResident = computed(() => allRows.value.find((item) =>
	`${item.identityType}-${item.id}` === workspace.residentSelectedId
) || null);

const selectedResidentLogs = computed(() => {
	if (!selectedResident.value) return [];
	return workspace.residentChangeLogs.filter((item) =>
		item.residentType === selectedResident.value.identityType
		&& Number(item.residentId) === Number(selectedResident.value.id)
	).slice(0, 8);
});

function selectResident(item) {
	const nextId = `${item.identityType}-${item.id}`;
	if (workspace.residentSelectedId === nextId) {
		clearSelectedResident();
		return;
	}
	workspace.residentSelectedId = nextId;
	actionHint.value = '';
}

function clearSelectedResident() {
	workspace.residentSelectedId = '';
	actionHint.value = '';
}

function statusLabel(item) {
	if (item.identityType === 'tenant') {
		return {
			active: '租住中',
			moved_out: '已迁出',
			disabled: '已冻结'
		}[item.status] || item.status;
	}
	return workspace.statusText(item.status);
}

function canManage(item) {
	return item.identityType === 'tenant' ? workspace.canAction('tenant:manage') : workspace.canAction('owner:manage');
}

async function refreshResidents() {
	await Promise.all([
		workspace.loadOwnerRecords(),
		workspace.loadTenantRecords(),
		workspace.loadResidentChangeLogs({ limit: 100 })
	]);
}

function buildResidentPayload(item, overrides = {}) {
	return {
		id: item.raw?.id,
		name: overrides.name !== undefined ? overrides.name : item.name || '',
		mobile: overrides.mobile !== undefined ? overrides.mobile : item.mobile || '',
		house: overrides.house !== undefined ? overrides.house : item.house || ''
	};
}

async function editResident(item) {
	const name = window.prompt('请输入姓名', item.name || '');
	if (name === null) return;
	const mobile = window.prompt('请输入手机号', item.mobile || '');
	if (mobile === null) return;
	const house = window.prompt('请输入房号', item.house || '');
	if (house === null) return;
	await saveResident(item, { name: name.trim(), mobile: mobile.trim(), house: house.trim() });
}

async function toggleResidentStatus(item) {
	const nextStatus = item.identityType === 'tenant'
		? (item.status === 'disabled' ? 'active' : 'disabled')
		: (item.status === 'disabled' ? 'approved' : 'disabled');
	await saveResident(item, { status: nextStatus });
}

async function changeResidentMobile(item) {
	const mobile = window.prompt('请输入新的手机号', item.mobile || '');
	if (mobile === null) return;
	await saveResident(item, { mobile: mobile.trim() });
}

async function changeResidentHouse(item) {
	const house = window.prompt('请输入新的房号', item.house || '');
	if (house === null) return;
	await saveResident(item, { house: house.trim() });
}

async function saveResident(item, overrides = {}) {
	const payload = buildResidentPayload(item, overrides);
	try {
		if (item.identityType === 'tenant') {
			await adminApi.tenantSave({
				...payload,
				status: overrides.status || item.status || 'active'
			});
		} else {
			await adminApi.ownerSave({
				...payload,
				auditStatus: overrides.status || item.status || 'approved'
			});
		}
		actionHint.value = '住户资料已更新';
		await refreshResidents();
	} catch (err) {
		window.alert(err.message || '保存失败');
	}
}

async function deleteResident(item) {
	const confirmed = window.confirm(`确认删除${item.identityType === 'tenant' ? '租户' : '业主'}「${item.name || item.mobile || item.id}」？`);
	if (!confirmed) return;
	try {
		if (item.identityType === 'tenant') {
			await adminApi.tenantDelete(item.raw.id);
		} else {
			await adminApi.ownerDelete(item.raw.id);
		}
		actionHint.value = '住户已删除';
		await refreshResidents();
		if (workspace.residentSelectedId === `${item.identityType}-${item.id}`) {
			clearSelectedResident();
		}
	} catch (err) {
		window.alert(err.message || '删除失败');
	}
}

async function handleResidentImport(payload) {
	importing.value = true;
	importFeedback.value = '';
	try {
		const api = payload.residentType === 'tenant' ? adminApi.tenantImport : adminApi.ownerImport;
		const result = await api({ rows: payload.rows });
		const summary = result.summary || {};
		importFeedback.value = `导入完成：新增 ${summary.created || 0}，更新 ${summary.updated || 0}，待确认 ${summary.manualReview || 0}，失败 ${summary.failed || 0}`;
		showImport.value = false;
		await Promise.all([
			workspace.loadOwnerRecords(),
			workspace.loadTenantRecords(),
			workspace.loadResidentChangeLogs({ limit: 100 })
		]);
	} catch (err) {
		importFeedback.value = err.message || '导入失败';
	} finally {
		importing.value = false;
	}
}
</script>

<style scoped>
.residents-page {
	display: grid;
	gap: 16px;
}

.panel-subtitle {
	margin-top: 6px;
	color: #6b7280;
	line-height: 1.6;
}

.resident-head-actions {
	display: flex;
	align-items: center;
	gap: 12px;
}

.resident-tabs {
	display: grid;
	grid-template-columns: repeat(4, minmax(120px, 1fr));
	gap: 10px;
}

.resident-tabs button {
	border: 1px solid #e8eeea;
	border-radius: 12px;
	padding: 12px;
	background: #f9fbfa;
	text-align: left;
	color: #1f2933;
}

.resident-tabs button.active {
	border-color: #13b35d;
	background: #eaf7ef;
	color: #0f7a43;
}

.resident-tabs strong,
.resident-tabs small {
	display: block;
}

.resident-tabs small {
	margin-top: 4px;
	color: #6b7280;
}

.resident-filters {
	grid-template-columns: minmax(240px, 2fr) minmax(140px, 1fr) minmax(140px, 1fr);
}

.resident-actions {
	flex-wrap: wrap;
}

.resident-actions button {
	padding: 7px 10px;
}

.resident-actions button:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}

@media (max-width: 960px) {
	.resident-tabs,
	.resident-filters {
		grid-template-columns: 1fr;
	}
}
</style>
