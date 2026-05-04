<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>社区活动</h2>
				<p>发布活动、查看报名并核销签到。</p>
			</div>
			<button class="primary" type="button" @click="reload">重新加载</button>
		</div>

		<DetailCard title="活动编辑" subtitle="保存后会同步到活动列表">
			<div class="form-grid">
				<label><span>标题</span><input v-model="form.title" placeholder="活动标题" /></label>
				<label><span>状态</span><select v-model="form.status"><option value="published">发布</option><option value="draft">草稿</option><option value="closed">关闭</option><option value="archived">归档</option></select></label>
				<label><span>地点</span><input v-model="form.location" placeholder="活动地点" /></label>
				<label><span>名额</span><input v-model.number="form.capacity" type="number" min="0" /></label>
				<label><span>开始时间</span><input v-model="form.startAt" placeholder="年-月-日 时:分:秒" /></label>
				<label><span>结束时间</span><input v-model="form.endAt" placeholder="年-月-日 时:分:秒" /></label>
				<label class="full"><span>摘要</span><input v-model="form.summary" placeholder="摘要" /></label>
				<label class="full"><span>内容</span><textarea v-model="form.content" rows="4" placeholder="活动说明"></textarea></label>
			</div>
			<div class="form-actions">
				<button class="primary" type="button" @click="save">保存活动</button>
				<button type="button" @click="reset">重置</button>
			</div>
		</DetailCard>

		<DetailCard title="活动列表" subtitle="点击行可加载对应报名记录">
			<table>
				<thead><tr><th>活动</th><th>时间</th><th>名额</th><th>状态</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in list" :key="item.id" :class="{ selected: selectedActivityId === item.id }">
						<td>{{ item.title }}</td>
						<td>{{ item.startAt || '-' }}</td>
						<td>{{ item.joinedCount }} / {{ item.capacity || '不限' }}</td>
						<td>{{ statusText(item.status) }}</td>
						<td class="actions">
							<button @click="edit(item)">编辑</button>
							<button @click="remove(item)">删除</button>
							<button @click="loadSignups(item)">报名</button>
						</td>
					</tr>
					<tr v-if="!list.length"><td colspan="5" class="empty-cell">当前暂无活动。</td></tr>
				</tbody>
			</table>
		</DetailCard>

		<DetailCard title="报名记录" :subtitle="`${signups.length} 条`">
			<table>
				<thead><tr><th>活动</th><th>住户</th><th>房号</th><th>状态</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in signups" :key="item.id">
						<td>{{ item.activityTitle || selectedActivityTitle }}</td>
						<td>{{ item.contact || item.ownerMobile }}</td>
						<td>{{ item.house || '-' }}</td>
						<td>{{ signupStatusText(item.status) }}</td>
						<td class="actions">
							<button :disabled="item.status === 'checked_in'" @click="signupAction(item, 'checkin')">签到</button>
							<button :disabled="item.status === 'cancelled'" @click="signupAction(item, 'cancel')">取消</button>
						</td>
					</tr>
					<tr v-if="!signups.length"><td colspan="5" class="empty-cell">当前暂无报名记录。</td></tr>
				</tbody>
			</table>
		</DetailCard>
	</section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import { adminApi } from '../api/admin.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const list = ref([]);
const signups = ref([]);
const selectedActivityId = ref('');
const selectedActivityTitle = ref('');
const form = ref(emptyForm());

function emptyForm() {
	return { id: '', title: '', summary: '', content: '', location: '', startAt: '', endAt: '', capacity: 0, status: 'published' };
}

function statusText(status) {
	return { published: '发布', draft: '草稿', closed: '关闭', archived: '归档' }[status] || status || '-';
}

function signupStatusText(status) {
	return { signed: '已报名', checked_in: '已签到', cancelled: '已取消' }[status] || status || '-';
}

async function reload() {
	const res = await adminApi.activityList();
	list.value = res.list || [];
	if (selectedActivityId.value) await loadSignups({ id: selectedActivityId.value, title: selectedActivityTitle.value });
}

function edit(item) {
	form.value = { id: item.id, title: item.title, summary: item.summary, content: item.content, location: item.location, startAt: item.startAt, endAt: item.endAt, capacity: item.capacity, status: item.status };
}

function reset() {
	form.value = emptyForm();
}

async function save() {
	await adminApi.activitySave(form.value);
	reset();
	await reload();
}

async function remove(item) {
	if (!window.confirm(`确认归档活动「${item.title}」？`)) return;
	await adminApi.activityDelete(item.id);
	if (selectedActivityId.value === item.id) {
		selectedActivityId.value = '';
		selectedActivityTitle.value = '';
		signups.value = [];
	}
	await reload();
}

async function loadSignups(item) {
	selectedActivityId.value = item.id;
	selectedActivityTitle.value = item.title || '';
	const res = await adminApi.activitySignupList({ activityId: item.id });
	signups.value = res.list || [];
}

async function signupAction(item, action) {
	await adminApi.activitySignupAction({ id: item.id, action, activityId: selectedActivityId.value });
	await loadSignups({ id: selectedActivityId.value, title: selectedActivityTitle.value });
}

onMounted(reload);
watch(() => workspace.selectedSchema, async () => {
	selectedActivityId.value = '';
	selectedActivityTitle.value = '';
	signups.value = [];
	await reload();
});
</script>
