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
</script>
