<template>
	<div class="dashboard-stack">
		<section class="panel-grid">
			<article v-for="item in workspace.stats" :key="item.label" class="metric">
				<span>{{ item.label }}</span>
				<strong>{{ item.value }}</strong>
			</article>
		</section>
		<section class="panel">
			<div class="panel-head">
				<h2>今日待办聚合</h2>
				<span>按当前小区统计</span>
			</div>
			<div class="panel-grid">
				<article v-for="item in workspace.dashboardTodos" :key="item.key" class="metric clickable" @click="workspace.navigate(item.route)">
					<span>{{ item.title }}</span>
					<strong>{{ item.count }}</strong>
				</article>
			</div>
		</section>
		<section class="panel">
			<div class="panel-head">
				<h2>负责人待办</h2>
				<span>按物业人员聚合</span>
			</div>
			<div class="permission-grid">
				<div v-for="group in staffTodoGroups" :key="group.key" class="permission-card">
					<div class="panel-head compact">
						<h3>{{ group.name }}</h3>
						<span>{{ group.count }} 条{{ group.onDuty ? ' / 在岗' : group.staffId ? ' / 离岗' : '' }}</span>
					</div>
					<p v-if="group.mobile" class="muted-line">{{ group.role || '物业人员' }} / {{ group.mobile }}</p>
					<div v-for="item in group.items" :key="`${group.key}-${item.moduleKey}-${item.id}`" class="todo-row clickable" @click="workspace.navigate(item.route)">
						<strong>{{ item.moduleName }}：{{ item.title || '-' }}</strong>
						<span>{{ item.status || '-' }}{{ item.assignee ? ` / ${item.assignee}` : '' }}</span>
					</div>
					<p v-if="!group.items.length" class="empty-text">暂无待办。</p>
				</div>
			</div>
			<p v-if="!staffTodoGroups.length" class="empty-text">暂无负责人待办。</p>
		</section>
		<section class="permission-grid">
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>待处理报修</h3>
					<span>{{ repairTodos.length }} 条</span>
				</div>
				<div v-for="item in repairTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || '-' }}</strong>
					<span>{{ workspace.workStatusText(item.status) }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!repairTodos.length" class="empty-text">暂无待处理报修。</p>
			</div>
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>待缴账单</h3>
					<span>{{ billTodos.length }} 条</span>
				</div>
				<div v-for="item in billTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.billNo }}</strong>
					<span>{{ item.ownerName || '-' }} / {{ workspace.money(item.amount) }}</span>
				</div>
				<p v-if="!billTodos.length" class="empty-text">暂无待缴账单。</p>
			</div>
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>通知异常</h3>
					<span>{{ noticeTodos.length }} 条</span>
				</div>
				<div v-for="item in noticeTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.eventType }}</strong>
					<span>{{ item.channel }} / {{ workspace.noticeStatusText(item.status) }}</span>
				</div>
				<p v-if="!noticeTodos.length" class="empty-text">暂无通知异常。</p>
			</div>
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>待处理投诉</h3>
					<span>{{ complaintTodos.length }} 条</span>
				</div>
				<div v-for="item in complaintTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.category || '投诉建议' }}</strong>
					<span>{{ item.statusText || item.status }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!complaintTodos.length" class="empty-text">暂无待处理投诉。</p>
			</div>
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>待处理物业服务</h3>
					<span>{{ serviceTodos.length }} 条</span>
				</div>
				<div v-for="item in serviceTodos" :key="item.id" class="todo-row">
					<strong>{{ item.serviceType || item.title || '物业服务' }}</strong>
					<span>{{ item.statusText || item.status }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!serviceTodos.length" class="empty-text">暂无待处理服务。</p>
			</div>
			<div class="permission-card">
				<div class="panel-head compact">
					<h3>待处理客服</h3>
					<span>{{ customerTodos.length }} 条</span>
				</div>
				<div v-for="item in customerTodos" :key="item.id" class="todo-row">
					<strong>{{ item.question || item.title || '在线客服' }}</strong>
					<span>{{ item.statusText || item.status }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!customerTodos.length" class="empty-text">暂无待处理客服工单。</p>
			</div>
		</section>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const repairTodos = computed(() => workspace.dashboardTodoLists.repairs || []);
const billTodos = computed(() => workspace.dashboardTodoLists.bills || []);
const noticeTodos = computed(() => workspace.dashboardTodoLists.notices || []);
const complaintTodos = computed(() => workspace.dashboardTodoLists.complaints || []);
const serviceTodos = computed(() => workspace.dashboardTodoLists.services || []);
const customerTodos = computed(() => workspace.dashboardTodoLists.customers || []);
const staffTodoGroups = computed(() => workspace.dashboardStaffTodos || []);
</script>
