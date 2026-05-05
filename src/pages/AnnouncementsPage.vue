<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>公告管理</h2>
				<p>发布当前小区公告，住户端按当前小区查看。</p>
			</div>
			<div class="form-actions compact">
				<button type="button" @click="loadList">重新加载</button>
				<button class="primary" type="button" @click="openAnnouncementModal()">新增公告</button>
			</div>
		</div>

		<DetailCard title="公告列表" subtitle="编辑、删除和查看现有公告">
			<table>
				<thead><tr><th>标题</th><th>状态</th><th>置顶</th><th>时间</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in list" :key="item.id">
						<td>{{ item.title }}</td>
						<td>{{ statusText(item.status) }}</td>
						<td>{{ item.isPinned ? '是' : '否' }}</td>
						<td>{{ item.publishAt || item.createdAt || '-' }}</td>
						<td class="actions">
							<button @click="openAnnouncementModal(item)">编辑</button>
							<button v-if="workspace.canShowDeleteButton" @click="remove(item)">删除</button>
						</td>
					</tr>
					<tr v-if="!list.length"><td colspan="5" class="empty-cell">当前暂无公告。</td></tr>
				</tbody>
			</table>
		</DetailCard>

		<ModalDialog v-if="announcementModalOpen" :title="announcementModalTitle" subtitle="保存后会同步到住户端公告列表" @close="closeAnnouncementModal">
			<div class="form-grid">
				<label class="full"><span>标题</span><input v-model="form.title" placeholder="公告标题" /></label>
				<label><span>状态</span><select v-model="form.status"><option value="published">发布</option><option value="draft">草稿</option><option value="archived">归档</option></select></label>
				<label><span>排序</span><input v-model.number="form.sort" type="number" /></label>
				<label><span>置顶</span><select v-model.number="form.isPinned"><option :value="1">置顶</option><option :value="0">不置顶</option></select></label>
				<label class="full"><span>摘要</span><input v-model="form.summary" placeholder="摘要" /></label>
				<label class="full"><span>内容</span><textarea v-model="form.content" rows="5" placeholder="公告正文"></textarea></label>
			</div>
			<template #actions>
				<button type="button" @click="closeAnnouncementModal">取消</button>
				<button class="primary" type="button" @click="saveAnnouncement">保存公告</button>
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
const announcementModalOpen = ref(false);
const announcementModalTitle = computed(() => form.value.id ? '编辑公告' : '新建公告');

function emptyForm() {
	return { id: '', title: '', summary: '', content: '', status: 'published', isPinned: 1, sort: 0 };
}

function statusText(status) {
	return { published: '发布', draft: '草稿', archived: '归档' }[status] || status || '-';
}

async function loadList() {
	const res = await adminApi.announcementList();
	list.value = res.list || [];
}

function edit(item) {
	form.value = { id: item.id, title: item.title, summary: item.summary, content: item.content, status: item.status, isPinned: item.isPinned ? 1 : 0, sort: item.sort || 0 };
}

function openAnnouncementModal(item = null) {
	if (item) edit(item);
	else reset();
	announcementModalOpen.value = true;
}

function reset() {
	form.value = emptyForm();
}

async function save() {
	try {
		await adminApi.saveAnnouncement(form.value);
		window.alert('公告保存成功');
		reset();
		announcementModalOpen.value = false;
		await loadList();
	} catch (err) {
		window.alert(err.message || '公告保存失败');
	}
}

async function saveAnnouncement() {
	await save();
}

async function remove(item) {
	if (!window.confirm(`确认删除公告「${item.title}」？`)) return;
	await adminApi.deleteAnnouncement(item.id);
	await loadList();
}

function closeAnnouncementModal() {
	announcementModalOpen.value = false;
	reset();
}

onMounted(loadList);
watch(() => workspace.selectedSchema, loadList);
</script>
