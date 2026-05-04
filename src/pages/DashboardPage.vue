<template>
	<div class="dashboard-stack">
		<section class="overview-hero">
			<div>
				<span class="eyebrow">运营总览</span>
				<h2>{{ workspace.activeCommunity ? workspace.communityLabel(workspace.activeCommunity) : '请先选择小区' }}</h2>
				<p>统一查看收费、报修、服务、客服和通知概况，按优先级处理相关明细。</p>
			</div>
			<div class="hero-number">
				<span>待办总数</span>
				<strong>{{ totalTodoCount }}</strong>
			</div>
		</section>
		<section class="panel-grid">
			<article v-for="item in workspace.stats" :key="item.label" class="metric">
				<span>{{ item.label }}</span>
				<strong>{{ item.value }}</strong>
			</article>
		</section>
		<DetailCard title="风险概览" subtitle="展示当前小区关键指标">
			<div class="visual-grid">
				<article v-for="item in visualRows" :key="item.key" class="visual-card">
					<div class="visual-top">
						<strong>{{ item.title }}</strong>
						<span>{{ item.value }}{{ item.unit }}</span>
					</div>
					<div class="visual-bar">
						<i :style="{ width: item.percent + '%' }"></i>
					</div>
					<p>{{ item.desc }}</p>
				</article>
			</div>
		</DetailCard>
		<DetailCard title="今日待办汇总" subtitle="按当前小区统计">
			<div class="panel-grid">
				<article v-for="item in workspace.dashboardTodos" :key="item.key" class="metric clickable" @click="workspace.navigate(item.route)">
					<span>{{ item.title }}</span>
					<strong>{{ item.count }}</strong>
				</article>
			</div>
		</DetailCard>
		<DetailCard title="负责人待办" subtitle="按物业人员聚合">
			<div class="permission-grid">
				<div v-for="group in staffTodoGroups" :key="group.key" class="permission-card">
					<div class="panel-head compact">
						<h3>{{ group.name }}</h3>
						<span>{{ group.count }} 条{{ group.onDuty ? ' / 在岗' : group.staffId ? ' / 离岗' : '' }}</span>
					</div>
					<p v-if="group.mobile" class="muted-line">{{ group.role || '物业人员' }} / {{ group.mobile }}</p>
					<div v-for="item in group.items" :key="`${group.key}-${item.moduleKey}-${item.id}`" class="todo-row clickable" @click="workspace.navigate(item.route)">
						<strong>{{ item.moduleName }}：{{ item.title || '-' }}</strong>
						<span>{{ statusText(item.status) }}{{ item.assignee ? ` / ${item.assignee}` : '' }}</span>
					</div>
					<p v-if="!group.items.length" class="empty-text">当前暂无待办事项。</p>
				</div>
			</div>
			<p v-if="!staffTodoGroups.length" class="empty-text">当前暂无负责人待办事项。</p>
		</DetailCard>
		<section class="permission-grid">
			<DetailCard title="待处理报修" :subtitle="`${repairTodos.length} 条`">
				<div v-for="item in repairTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || '-' }}</strong>
					<span>{{ workspace.workStatusText(item.status) }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!repairTodos.length" class="empty-text">当前暂无待处理报修。</p>
			</DetailCard>
			<DetailCard title="待缴账单" :subtitle="`${billTodos.length} 条`">
				<div v-for="item in billTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.billNo }}</strong>
					<span>{{ item.ownerName || '-' }} / {{ workspace.money(item.amount) }}</span>
				</div>
				<p v-if="!billTodos.length" class="empty-text">当前暂无待缴账单。</p>
			</DetailCard>
			<DetailCard title="通知异常" :subtitle="`${noticeTodos.length} 条`">
				<div v-for="item in noticeTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.eventType }}</strong>
					<span>{{ channelText(item.channel) }} / {{ workspace.noticeStatusText(item.status) }}</span>
				</div>
				<p v-if="!noticeTodos.length" class="empty-text">当前暂无通知异常。</p>
			</DetailCard>
			<DetailCard title="待处理投诉" :subtitle="`${complaintTodos.length} 条`">
				<div v-for="item in complaintTodos" :key="item.id" class="todo-row">
					<strong>{{ item.title || item.category || '投诉建议' }}</strong>
					<span>{{ statusText(item.statusText || item.status) }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!complaintTodos.length" class="empty-text">当前暂无待处理投诉。</p>
			</DetailCard>
			<DetailCard title="待处理物业服务" :subtitle="`${serviceTodos.length} 条`">
				<div v-for="item in serviceTodos" :key="item.id" class="todo-row">
					<strong>{{ item.serviceType || item.title || '物业服务' }}</strong>
					<span>{{ statusText(item.statusText || item.status) }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!serviceTodos.length" class="empty-text">当前暂无待处理服务。</p>
			</DetailCard>
			<DetailCard title="待处理客服" :subtitle="`${customerTodos.length} 条`">
				<div v-for="item in customerTodos" :key="item.id" class="todo-row">
					<strong>{{ item.question || item.title || '在线客服' }}</strong>
					<span>{{ statusText(item.statusText || item.status) }} / {{ item.assignee || '未分配' }}</span>
				</div>
				<p v-if="!customerTodos.length" class="empty-text">当前暂无待处理客服工单。</p>
			</DetailCard>
		</section>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const repairTodos = computed(() => workspace.dashboardTodoLists.repairs || []);
const billTodos = computed(() => workspace.dashboardTodoLists.bills || []);
const noticeTodos = computed(() => workspace.dashboardTodoLists.notices || []);
const complaintTodos = computed(() => workspace.dashboardTodoLists.complaints || []);
const serviceTodos = computed(() => workspace.dashboardTodoLists.services || []);
const customerTodos = computed(() => workspace.dashboardTodoLists.customers || []);
const staffTodoGroups = computed(() => workspace.dashboardStaffTodos || []);
const totalTodoCount = computed(() => workspace.dashboardTodos.reduce((sum, item) => sum + Number(item.count || 0), 0));
const visualRows = computed(() => {
	const stats = workspace.dashboardCrossModuleStats || {};
	const ownerTotal = Number(stats.owners?.total || 0);
	const ownerPending = Number(stats.owners?.pending || 0);
	const repairOpen = Number(stats.repairs?.open || 0);
	const repairTimeout = Number(stats.repairs?.timeout || 0);
	const operationsCount = Number(stats.operations?.complaints || 0) + Number(stats.operations?.services || 0) + Number(stats.operations?.customerTickets || 0);
	const noticeCount = Number(stats.notices?.failed || 0) + Number(stats.notices?.pending || 0);
	return [
		{
			key: 'owners',
			title: '业主认证',
			value: ownerPending,
			unit: '户',
			percent: ownerTotal ? Math.min(100, Math.round(ownerPending / ownerTotal * 100)) : 0,
			desc: ownerTotal ? `共 ${ownerTotal} 户，待审核 ${ownerPending} 户` : '当前暂无业主数据'
		},
		{
			key: 'fees',
			title: '待缴金额',
			value: `￥${Number(stats.fees?.unpaidAmount || 0).toFixed(2)}`,
			unit: '',
			percent: Math.min(100, Number(stats.fees?.unpaid || 0) * 12),
			desc: `待缴账单 ${Number(stats.fees?.unpaid || 0)} 笔`
		},
		{
			key: 'repairs',
			title: '报修风险',
			value: repairOpen + repairTimeout,
			unit: '单',
			percent: Math.min(100, (repairOpen + repairTimeout) * 16),
			desc: `处理中 ${repairOpen} 单，超时或升级 ${repairTimeout} 单`
		},
		{
			key: 'operations',
			title: '服务事项',
			value: operationsCount,
			unit: '单',
			percent: Math.min(100, operationsCount * 14),
			desc: '覆盖投诉、物业服务和在线客服'
		},
		{
			key: 'notices',
			title: '通知风险',
			value: noticeCount,
			unit: '条',
			percent: Math.min(100, noticeCount * 20),
			desc: `失败 ${Number(stats.notices?.failed || 0)} 条，待发送 ${Number(stats.notices?.pending || 0)} 条`
		}
	];
});

function statusText(status) {
	if (!status) return '-';
	return workspace.workStatusText(status);
}

function channelText(channel) {
	return {
		system: '系统',
		dingtalk: '钉钉',
		sms: '短信'
	}[channel] || channel || '-';
}
</script>
