<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>{{ meta.title }}</h2>
				<p>{{ meta.desc }}</p>
			</div>
			<div class="form-actions compact">
				<button type="button" @click="showList = !showList">{{ showList ? '收起列表' : '展开列表' }}</button>
				<button class="primary" type="button" @click="loadList">重新加载</button>
			</div>
		</div>

		<div v-show="showList" class="table-card">
			<table>
				<thead>
					<tr>
						<th>编号</th>
						<th>标题/类型</th>
						<th>住户</th>
						<th>房号</th>
						<th>状态</th>
						<th>处理人</th>
						<th>时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in list" :key="item.id" :class="{ selected: selectedId === item.id }" @click="openDetail(item)">
						<td>#{{ item.id }}</td>
						<td>{{ item.title || item.serviceType || item.question || '-' }}</td>
						<td>{{ item.contact || item.ownerMobile || '-' }}</td>
						<td>{{ item.house || '-' }}</td>
						<td><span class="status-pill">{{ item.statusText || item.status }}</span></td>
						<td>{{ item.assignee || '-' }}</td>
						<td>{{ item.createdAt || '-' }}</td>
						<td class="actions">
							<button v-if="workspace.canShowDeleteButton" @click.stop="deleteItem(item)">删除</button>
						</td>
					</tr>
					<tr v-if="!list.length">
						<td colspan="8" class="empty-cell">当前没有{{ meta.title }}记录。</td>
					</tr>
				</tbody>
			</table>
		</div>

		<DetailCard v-if="detail" :title="`${meta.title}详情`" :subtitle="detail.item.statusText || detail.item.status">
			<template #actions>
				<button type="button" @click="closeDetail">收起</button>
			</template>
			<div class="detail-grid">
				<div><span>住户</span><strong>{{ detail.item.contact || '-' }}</strong></div>
				<div><span>手机号</span><strong>{{ detail.item.phone || detail.item.ownerMobile || '-' }}</strong></div>
				<div><span>房号</span><strong>{{ detail.item.house || '-' }}</strong></div>
				<div><span>状态</span><strong>{{ detail.item.statusText || detail.item.status }}</strong></div>
				<div><span>满意度</span><strong>{{ detail.item.ratingScore ? `${detail.item.ratingScore} 星` : '未评价' }}</strong></div>
				<div><span>回访</span><strong>{{ detail.item.followupStatus === 'done' ? '已回访' : '待回访' }}</strong></div>
			</div>
			<div class="detail-block">
				<h4>内容</h4>
				<p>{{ detail.item.content || detail.item.question || '-' }}</p>
				<p v-if="detail.item.aiAnswer" class="subtle">智能分析：{{ detail.item.aiAnswer }}</p>
				<p v-if="detail.item.reply" class="subtle">当前回复：{{ detail.item.reply }}</p>
				<p v-if="detail.item.ratingRemark" class="subtle">评价：{{ detail.item.ratingRemark }}</p>
				<p v-if="detail.item.followupRemark" class="subtle">回访：{{ detail.item.followupRemark }}{{ detail.item.followupAt ? ` / ${detail.item.followupAt}` : '' }}</p>
			</div>
			<div class="form-grid compact-form">
				<label>
					<span>处理动作</span>
					<select v-model="actionForm.action">
						<option value="accept">受理</option>
						<option value="complete">完成</option>
						<option value="followup">回访记录</option>
						<option value="close">关闭</option>
					</select>
				</label>
				<label>
					<span>负责人</span>
					<select v-model="actionForm.staffId">
						<option value="">选择物业人员</option>
						<option v-for="staff in activeStaff" :key="staff.id" :value="staff.id">{{ staff.name }}{{ staff.mobile ? ` / ${staff.mobile}` : '' }}{{ staff.onDuty ? ' · 在岗' : ' · 离岗' }}</option>
					</select>
				</label>
				<label class="full">
					<span>{{ actionForm.action === 'followup' ? '回访说明' : '处理说明 / 回复' }}</span>
					<textarea v-model="actionForm.reply" :placeholder="actionForm.action === 'followup' ? '填写回访结果、住户反馈和满意度情况' : '填写处理说明，将记录到工单日志'"></textarea>
				</label>
			</div>
			<button class="primary" type="button" @click="submitAction">保存处理</button>

			<div class="timeline">
				<h4>处理记录</h4>
				<div v-if="!detail.logs.length" class="empty-cell">当前暂无处理记录。</div>
				<div v-for="log in detail.logs" :key="log.id" class="timeline-item">
					<strong>{{ log.action || '记录' }}</strong>
					<span>{{ log.fromStatus || '-' }} -> {{ log.toStatus || '-' }}</span>
					<p>{{ log.content || '-' }}</p>
					<small>{{ log.createdAt }}</small>
				</div>
			</div>
		</DetailCard>
	</section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import { adminApi } from '../api/admin.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const list = ref([]);
const detail = ref(null);
const selectedId = ref(0);
const actionForm = ref({ action: 'accept', assignee: '', staffId: '', reply: '' });
const showList = ref(true);

const config = {
	complaints: {
		title: '投诉建议',
		desc: '受理住户投诉建议，分配负责人并沉淀处理记录。',
		list: adminApi.complaintList,
		detail: adminApi.complaintDetail,
		action: adminApi.complaintAction
	},
	property_service: {
		title: '物业服务',
		desc: '处理便民服务、预约代办和物业服务申请。',
		list: adminApi.serviceList,
		detail: adminApi.serviceDetail,
		action: adminApi.serviceAction
	},
	customer_service: {
		title: '在线客服',
		desc: '查看常见问题和智能分析后的人工客服工单。',
		list: adminApi.customerList,
		detail: adminApi.customerDetail,
		action: adminApi.customerAction
	}
};

const meta = computed(() => config[workspace.activeRoute] || config.complaints);
const activeStaff = computed(() => workspace.propertyStaff.filter((item) =>
	item.active && (!item.moduleKeys || String(item.moduleKeys).includes(workspace.activeRoute) || String(item.moduleKeys).includes('notices'))
));

async function loadList() {
	const res = await meta.value.list();
	list.value = res.list || [];
}

async function openDetail(item) {
	if (selectedId.value === item.id && detail.value) {
		closeDetail();
		return;
	}
	selectedId.value = item.id;
	const res = await meta.value.detail(item.id);
	detail.value = res;
	actionForm.value = { action: 'accept', assignee: res.item.assignee || '', staffId: '', reply: res.item.reply || '' };
}

function closeDetail() {
	selectedId.value = 0;
	detail.value = null;
	actionForm.value = { action: 'accept', assignee: '', staffId: '', reply: '' };
}

async function submitAction() {
	if (!detail.value) return;
	const res = await meta.value.action(Object.assign({ id: detail.value.item.id }, actionForm.value));
	detail.value = res;
	await loadList();
}

async function deleteItem(item) {
	if (!workspace.canShowDeleteButton) return;
	const confirmed = window.confirm(`确认删除「${item.title || item.serviceType || item.question || item.id}」？`);
	if (!confirmed) return;
	const deleteMap = {
		complaints: adminApi.complaintDelete,
		property_service: adminApi.serviceDelete,
		customer_service: adminApi.customerDelete
	};
	await deleteMap[workspace.activeRoute](item.id);
	if (selectedId.value === item.id) {
		closeDetail();
	}
	await loadList();
}

onMounted(loadList);
watch(() => workspace.activeRoute, async () => {
	closeDetail();
	await loadList();
});
watch(() => workspace.selectedSchema, async () => {
	closeDetail();
	await loadList();
});
</script>
