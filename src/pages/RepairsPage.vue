<template>
	<section class="panel">
		<div class="panel-head">
			<h2>报修管理</h2>
			<span>{{ filteredRepairs.length }} 条工单 / 共 {{ workspace.repairs.length }} 条</span>
		</div>
		<div class="filter-row">
			<label class="field">
				<span>关键词</span>
				<input v-model="keyword" type="text" placeholder="标题 / 联系人 / 电话" />
			</label>
			<label class="field">
				<span>状态</span>
				<select v-model="status">
					<option value="">全部</option>
					<option value="pending">待处理</option>
					<option value="assigned">已派单</option>
					<option value="processing">处理中</option>
					<option value="completed">已完成</option>
					<option value="closed">已关闭</option>
				</select>
			</label>
		</div>
		<table>
			<thead>
				<tr>
					<th>标题</th>
					<th>类型</th>
					<th>联系人</th>
					<th>电话</th>
					<th>状态</th>
					<th>处理人</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in filteredRepairs" :key="item.id" class="clickable-row" @click="selectedRepair = item">
					<td>{{ item.title }}</td>
					<td>{{ item.type }}</td>
					<td>{{ item.contact }}</td>
					<td>{{ item.phone }}</td>
					<td><span class="status" :class="item.status">{{ workspace.workStatusText(item.status) }}</span></td>
					<td>{{ item.assignee || '未分配' }}</td>
				</tr>
			</tbody>
		</table>

		<div v-if="selectedRepair" class="detail-card">
			<div class="panel-head compact">
				<h3>工单详情</h3>
				<span>{{ selectedRepair.status }}</span>
			</div>
			<div class="detail-grid">
				<div><strong>标题</strong><p>{{ selectedRepair.title || '-' }}</p></div>
				<div><strong>类型</strong><p>{{ selectedRepair.type || '-' }}</p></div>
				<div><strong>联系人</strong><p>{{ selectedRepair.contact || '-' }}</p></div>
				<div><strong>电话</strong><p>{{ selectedRepair.phone || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.workStatusText(selectedRepair.status) }}</p></div>
				<div><strong>处理人</strong><p>{{ selectedRepair.assignee || '未分配' }}</p></div>
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
const selectedRepair = ref(null);

const filteredRepairs = computed(() => workspace.repairs.filter((item) => {
	const text = `${item.title || ''} ${item.contact || ''} ${item.phone || ''}`.toLowerCase();
	return (!keyword.value || text.includes(keyword.value.trim().toLowerCase())) && (!status.value || item.status === status.value);
}));
</script>
