<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>常见问题管理</h2>
				<p>维护在线客服关键词和自动回复。</p>
			</div>
			<button class="primary" type="button" @click="loadList">刷新</button>
		</div>

		<DetailCard :title="form.id ? '编辑常见问题' : '新建常见问题'" subtitle="保存后会同步到在线客服自动回复">
			<div class="form-grid">
				<label class="full"><span>问题</span><input v-model="form.question" placeholder="例如：怎么缴物业费" /></label>
				<label class="full"><span>关键词</span><input v-model="form.keywords" placeholder="缴费,物业费,账单" /></label>
				<label><span>排序</span><input v-model.number="form.sort" type="number" /></label>
				<label><span>启用</span><select v-model.number="form.enabled"><option :value="1">启用</option><option :value="0">停用</option></select></label>
				<label class="full"><span>答案</span><textarea v-model="form.answer" rows="4" placeholder="自动回复内容"></textarea></label>
			</div>
			<div class="form-actions">
				<button class="primary" type="button" @click="save">保存常见问题</button>
				<button type="button" @click="reset">重置</button>
			</div>
		</DetailCard>

		<DetailCard title="常见问题列表" subtitle="编辑、删除与查看命中统计">
			<table>
				<thead><tr><th>问题</th><th>关键词</th><th>启用</th><th>命中</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in list" :key="item.id">
						<td>{{ item.question }}</td>
						<td>{{ item.keywords || '-' }}</td>
						<td>{{ item.enabled ? '启用' : '停用' }}</td>
						<td>{{ item.hitCount || 0 }}</td>
						<td class="actions">
							<button @click="edit(item)">编辑</button>
							<button @click="remove(item)">删除</button>
						</td>
					</tr>
					<tr v-if="!list.length"><td colspan="5" class="empty-cell">暂无常见问题。</td></tr>
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
const form = ref(emptyForm());

function emptyForm() {
	return { id: '', question: '', keywords: '', answer: '', enabled: 1, sort: 0 };
}

async function loadList() {
	const res = await adminApi.faqList();
	list.value = res.list || [];
}

function edit(item) {
	form.value = { id: item.id, question: item.question, keywords: item.keywords, answer: item.answer, enabled: item.enabled ? 1 : 0, sort: item.sort || 0 };
}

function reset() {
	form.value = emptyForm();
}

async function save() {
	await adminApi.faqSave(form.value);
	reset();
	await loadList();
}

async function remove(item) {
	if (!window.confirm(`确认删除常见问题「${item.question}」？`)) return;
	await adminApi.faqDelete(item.id);
	await loadList();
}

onMounted(loadList);
watch(() => workspace.selectedSchema, loadList);
</script>
