<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>社区调研</h2>
				<p>配置问卷星链接或小程序跳转参数，住户端展示“社区调研”。</p>
			</div>
			<button class="primary" type="button" @click="loadList">刷新</button>
		</div>

		<div class="form-grid">
			<label><span>标题</span><input v-model="form.title" placeholder="例如 2026 物业服务满意度调研" /></label>
			<label><span>状态</span><select v-model="form.status"><option value="published">发布</option><option value="draft">草稿</option><option value="closed">关闭</option><option value="archived">归档</option></select></label>
			<label><span>排序</span><input v-model.number="form.sort" type="number" /></label>
			<label><span>问卷星 AppID</span><input v-model="form.miniAppId" placeholder="可选，配置后优先跳小程序" /></label>
			<label class="full"><span>问卷星链接</span><input v-model="form.externalUrl" placeholder="https:// 或问卷星调研链接" /></label>
			<label class="full"><span>小程序路径</span><input v-model="form.miniPath" placeholder="可选，例如 pages/index/index?..." /></label>
			<label><span>开始时间</span><input v-model="form.startAt" placeholder="YYYY-MM-DD HH:mm:ss，可空" /></label>
			<label><span>结束时间</span><input v-model="form.endAt" placeholder="YYYY-MM-DD HH:mm:ss，可空" /></label>
			<label class="full"><span>说明</span><textarea v-model="form.summary" rows="3" placeholder="说明调研目的，体现用心服务"></textarea></label>
		</div>
		<div class="form-actions">
			<button class="primary" type="button" @click="save">保存调研</button>
			<button type="button" @click="reset">重置</button>
		</div>

		<div class="table-card">
			<table>
				<thead><tr><th>调研</th><th>状态</th><th>链接</th><th>有效期</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in list" :key="item.id">
						<td>
							<strong>{{ item.title }}</strong>
							<p>{{ item.summary || '暂无说明' }}</p>
						</td>
						<td>{{ item.status }}</td>
						<td>{{ item.miniAppId ? `小程序：${item.miniAppId}` : (item.externalUrl || '-') }}</td>
						<td>{{ item.startAt || '不限' }} 至 {{ item.endAt || '不限' }}</td>
						<td class="actions">
							<button @click="edit(item)">编辑</button>
							<button @click="remove(item)">归档</button>
						</td>
					</tr>
					<tr v-if="!list.length"><td colspan="5" class="empty-cell">暂无社区调研。</td></tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { adminApi } from '../api/admin.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const list = ref([]);
const form = ref(emptyForm());

function emptyForm() {
	return { id: '', title: '', summary: '', externalUrl: '', miniAppId: '', miniPath: '', status: 'published', sort: 100, startAt: '', endAt: '' };
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

function reset() {
	form.value = emptyForm();
}

async function save() {
	await adminApi.surveySave(form.value);
	reset();
	await loadList();
}

async function remove(item) {
	if (!window.confirm(`确认归档调研「${item.title}」？`)) return;
	await adminApi.surveyDelete(item.id);
	await loadList();
}

onMounted(loadList);
watch(() => workspace.selectedSchema, loadList);
</script>
