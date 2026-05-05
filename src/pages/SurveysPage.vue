<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>社区调研</h2>
				<p>配置问卷星链接或小程序跳转参数，住户端展示“社区调研”。</p>
			</div>
			<div class="form-actions compact">
				<button type="button" @click="loadList">重新加载</button>
				<button class="primary" type="button" @click="openSurveyModal()">新增调研</button>
			</div>
		</div>

		<DetailCard title="调研列表" subtitle="编辑、删除与查看现有调研">
			<template #actions>
				<button type="button" @click="showList = !showList">{{ showList ? '收起列表' : '展开列表' }}</button>
			</template>
			<table v-show="showList">
				<thead><tr><th>调研</th><th>状态</th><th>链接</th><th>有效期</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in list" :key="item.id">
						<td>
							<strong>{{ item.title }}</strong>
					<p>{{ item.summary || '当前暂无说明。' }}</p>
						</td>
						<td>{{ statusText(item.status) }}</td>
						<td>{{ item.miniAppId ? `小程序编号：${item.miniAppId}` : (item.externalUrl || '-') }}</td>
						<td>{{ item.startAt || '不限' }} 至 {{ item.endAt || '不限' }}</td>
						<td class="actions">
							<button @click="openSurveyModal(item)">编辑</button>
							<button v-if="workspace.canShowDeleteButton" @click="remove(item)">删除</button>
						</td>
					</tr>
					<tr v-if="!list.length"><td colspan="5" class="empty-cell">当前暂无社区调研。</td></tr>
				</tbody>
			</table>
		</DetailCard>

		<ModalDialog v-if="surveyModalOpen" :title="surveyModalTitle" subtitle="保存后会同步到调研列表" @close="closeSurveyModal">
			<div class="form-grid">
				<label><span>标题</span><input v-model="form.title" placeholder="如：2026 物业服务满意度调研" /></label>
				<label><span>状态</span><select v-model="form.status"><option value="published">发布</option><option value="draft">草稿</option><option value="closed">关闭</option><option value="archived">归档</option></select></label>
				<label><span>排序</span><input v-model.number="form.sort" type="number" /></label>
				<label><span>问卷星小程序编号</span><input v-model="form.miniAppId" placeholder="留空则不跳转小程序" /></label>
				<label class="full"><span>问卷星链接</span><input v-model="form.externalUrl" placeholder="填写问卷星或外部调研链接" /></label>
				<label class="full"><span>小程序路径</span><input v-model="form.miniPath" placeholder="如：pages/index/index?..." /></label>
				<label><span>开始时间</span><input v-model="form.startAt" placeholder="YYYY-MM-DD HH:mm:ss，留空表示立即生效" /></label>
				<label><span>结束时间</span><input v-model="form.endAt" placeholder="YYYY-MM-DD HH:mm:ss，留空表示长期有效" /></label>
				<label class="full"><span>说明</span><textarea v-model="form.summary" rows="3" placeholder="填写调研目的和说明"></textarea></label>
			</div>
			<template #actions>
				<button type="button" @click="closeSurveyModal">取消</button>
				<button class="primary" type="button" @click="saveSurvey">保存调研</button>
			</template>
		</ModalDialog>
	</section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import ModalDialog from '../components/common/ModalDialog.vue';
import { adminApi } from '../api/admin.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const list = ref([]);
const form = ref(emptyForm());
const showList = ref(true);
const surveyModalOpen = ref(false);
const surveyModalTitle = computed(() => form.value.id ? '编辑调研' : '新建调研');

function emptyForm() {
	return { id: '', title: '', summary: '', externalUrl: '', miniAppId: '', miniPath: '', status: 'published', sort: 100, startAt: '', endAt: '' };
}

function statusText(status) {
	return { published: '发布', draft: '草稿', closed: '关闭', archived: '归档' }[status] || status || '-';
}

async function loadList() {
	const res = await adminApi.surveyList();
	list.value = res.list || [];
}

function edit(item) {
	form.value = {
		id: item.id,
		title: item.title,
		summary: item.summary,
		externalUrl: item.externalUrl,
		miniAppId: item.miniAppId,
		miniPath: item.miniPath,
		status: item.status,
		sort: item.sort || 100,
		startAt: item.startAt || '',
		endAt: item.endAt || ''
	};
}

function openSurveyModal(item = null) {
	if (item) edit(item);
	else reset();
	surveyModalOpen.value = true;
}

function reset() {
	form.value = emptyForm();
}

async function save() {
	try {
		await adminApi.surveySave(form.value);
		window.alert('调研保存成功');
		reset();
		surveyModalOpen.value = false;
		await loadList();
	} catch (err) {
		window.alert(err.message || '调研保存失败');
	}
}

async function remove(item) {
	if (!window.confirm(`确认删除调研「${item.title}」？`)) return;
	await adminApi.surveyDelete(item.id);
	await loadList();
}

function closeSurveyModal() {
	surveyModalOpen.value = false;
	reset();
}

async function saveSurvey() {
	await save();
}

onMounted(loadList);
watch(() => workspace.selectedSchema, loadList);
</script>
