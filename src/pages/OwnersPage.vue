<template>
	<section class="panel">
		<div class="panel-head">
			<h2>业主认证审核</h2>
			<span>{{ filteredOwners.length }} 条待处理 / 共 {{ workspace.owners.length }} 条</span>
		</div>
		<div class="filter-row">
			<label class="field">
				<span>关键词</span>
				<input v-model="keyword" type="text" placeholder="姓名 / 手机号 / 房屋" />
			</label>
			<label class="field">
				<span>状态</span>
				<select v-model="status">
					<option value="">全部</option>
					<option value="pending">待审核</option>
					<option value="approved">已通过</option>
					<option value="rejected">已驳回</option>
				</select>
			</label>
		</div>
		<table>
			<thead>
				<tr>
					<th>姓名</th>
					<th>手机号</th>
					<th>小区</th>
					<th>房屋</th>
					<th>状态</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="owner in filteredOwners" :key="owner.id" @click="selectedOwner = owner" class="clickable-row">
					<td>{{ owner.name }}</td>
					<td>{{ owner.mobile }}</td>
					<td>{{ owner.communityName }}</td>
					<td>{{ owner.house }}</td>
					<td><span class="status" :class="owner.auditStatus">{{ workspace.statusText(owner.auditStatus) }}</span></td>
					<td class="actions">
						<button :disabled="!workspace.canAction('owner:audit')" @click.stop="workspace.auditOwner(owner, 'approved')">通过</button>
						<button :disabled="!workspace.canAction('owner:audit')" @click.stop="workspace.auditOwner(owner, 'rejected')">驳回</button>
					</td>
				</tr>
			</tbody>
		</table>

		<div v-if="selectedOwner" class="detail-card">
			<div class="panel-head compact">
				<h3>认证详情</h3>
				<span>{{ selectedOwner.auditStatus || 'pending' }}</span>
			</div>
			<div class="detail-grid">
				<div><strong>姓名</strong><p>{{ selectedOwner.name || '-' }}</p></div>
				<div><strong>手机号</strong><p>{{ selectedOwner.mobile || '-' }}</p></div>
				<div><strong>小区</strong><p>{{ selectedOwner.communityName || '-' }}</p></div>
				<div><strong>房屋</strong><p>{{ selectedOwner.house || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.statusText(selectedOwner.auditStatus) }}</p></div>
				<div><strong>备注</strong><p>{{ selectedOwner.note || '暂无' }}</p></div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const keyword = ref('');
const status = ref('');
const selectedOwner = ref(null);

const filteredOwners = computed(() => workspace.owners.filter((item) => {
	const text = `${item.name || ''} ${item.mobile || ''} ${item.house || ''} ${item.communityName || ''}`.toLowerCase();
	const keywordMatch = !keyword.value || text.includes(keyword.value.trim().toLowerCase());
	const statusMatch = !status.value || item.auditStatus === status.value;
	return keywordMatch && statusMatch;
}));
</script>
