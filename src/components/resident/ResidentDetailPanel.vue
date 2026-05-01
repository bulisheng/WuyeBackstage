<template>
	<div v-if="resident" class="detail-card resident-detail">
		<div class="panel-head compact">
			<h3>{{ resident.identityType === 'tenant' ? '租户详情' : '业主详情' }}</h3>
			<div class="head-actions">
				<span>{{ buildResidentDisplayLabel(resident) }}</span>
				<button type="button" @click="$emit('close')">收起</button>
			</div>
		</div>
		<div class="detail-grid">
			<div><strong>姓名</strong><p>{{ resident.name || '-' }}</p></div>
			<div><strong>手机号</strong><p>{{ resident.mobile || '-' }}</p></div>
			<div><strong>当前房号</strong><p>{{ resident.house || '-' }}</p></div>
			<div><strong>状态</strong><p>{{ statusLabel || resident.status || '-' }}</p></div>
			<div><strong>住户类型</strong><p>{{ resident.identityType === 'tenant' ? '租户' : '业主' }}</p></div>
			<div><strong>小区</strong><p>{{ resident.communityName || '-' }}</p></div>
			<div class="wide"><strong>最近动作</strong><p>{{ actionHint || '暂无待处理动作' }}</p></div>
		</div>

		<div class="state-panel">
			<div class="panel-head compact">
				<h3>最近变更记录</h3>
				<span>{{ logs.length }} 条</span>
			</div>
			<div v-if="logs.length" class="timeline">
				<div v-for="log in logs" :key="log.id" class="timeline-item">
					<strong>{{ log.fieldName }}</strong>
					<p>{{ log.beforeValue || '-' }} -> {{ log.afterValue || '-' }}</p>
					<small>{{ log.source || '-' }} · {{ log.operatorName || '系统' }} · {{ log.createdAt || '-' }}</small>
				</div>
			</div>
			<p v-else class="empty-text">暂无手机号、房号或状态变更记录。</p>
		</div>
	</div>
</template>

<script setup>
import { buildResidentDisplayLabel } from '../../utils/residentDirectory.js';

defineProps({
	resident: {
		type: Object,
		default: null
	},
	logs: {
		type: Array,
		default: () => []
	},
	statusLabel: {
		type: String,
		default: ''
	},
	actionHint: {
		type: String,
		default: ''
	}
});

defineEmits(['close']);
</script>

<style scoped>
.resident-detail {
	border-left: 4px solid #13b35d;
}

.timeline-item strong {
	color: #1f2933;
}

.timeline-item p {
	margin: 0;
	color: #475569;
}
</style>
