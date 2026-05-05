<template>
	<section class="panel">
		<div class="panel-head">
			<h2>小区管理</h2>
			<span>{{ workspace.communities.length }} 个小区</span>
		</div>
		<div class="form-actions">
			<button class="primary" :disabled="!workspace.canAction('community:edit')" @click="openCommunityModal()">新增小区</button>
		</div>
		<div class="community-list">
			<div v-for="item in workspace.communities" :key="item.id" class="community-row clickable-row" @click="selectedCommunity = item">
				<div class="community-meta">
					<strong>{{ item.name }}</strong>
					<span>{{ item.code }}</span>
					<small>{{ item.address || '暂无地址信息' }}</small>
				</div>
				<div class="community-actions">
					<span class="status" :class="item.active ? 'approved' : 'disabled'">{{ item.active ? '启用' : '停用' }}</span>
					<button :disabled="!workspace.canAction('community:edit')" @click.stop="openCommunityModal(item)">编辑</button>
					<button :disabled="!workspace.canAction('community:edit')" @click.stop="workspace.toggleCommunityActive(item)">{{ item.active ? '停用' : '启用' }}</button>
					<button v-if="workspace.canShowDeleteButton" class="danger" :disabled="!workspace.canAction('community:delete')" @click.stop="workspace.removeCommunity(item)">删除</button>
				</div>
			</div>
		</div>

		<DetailCard v-if="selectedCommunity" title="小区详情" :subtitle="selectedCommunity.schemaName || ''">
			<template #actions>
				<button type="button" @click="selectedCommunity = null">收起</button>
			</template>
			<div class="detail-grid">
				<div><strong>编码</strong><p>{{ selectedCommunity.code || '-' }}</p></div>
				<div><strong>名称</strong><p>{{ selectedCommunity.name || '-' }}</p></div>
				<div><strong>Schema</strong><p>{{ selectedCommunity.schemaName || '-' }}</p></div>
				<div><strong>地址</strong><p>{{ selectedCommunity.address || '-' }}</p></div>
				<div><strong>电话</strong><p>{{ selectedCommunity.phone || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ selectedCommunity.active ? '启用' : '停用' }}</p></div>
			</div>
		</DetailCard>

		<ModalDialog v-if="communityModalOpen" :title="communityModalTitle" subtitle="保存后会同步到小区列表" @close="closeCommunityModal">
			<div class="form-grid">
				<label class="field">
					<span>小区编码</span>
					<input v-model="workspace.communityForm.code" type="text" placeholder="如：rzb-001" />
				</label>
				<label class="field">
					<span>小区名称</span>
					<input v-model="workspace.communityForm.name" type="text" placeholder="如：荣尊堡" />
				</label>
				<label class="field">
					<span>Schema</span>
					<input v-model="workspace.communityForm.schemaName" type="text" placeholder="可留空自动生成" />
				</label>
				<label class="field">
					<span>排序</span>
					<input v-model.number="workspace.communityForm.sort" type="number" min="0" step="1" />
				</label>
				<label class="field span-2">
					<span>地址</span>
					<input v-model="workspace.communityForm.address" type="text" placeholder="请输入小区地址" />
				</label>
				<label class="field span-2">
					<span>联系电话</span>
					<input v-model="workspace.communityForm.phone" type="text" placeholder="请输入联系电话" />
				</label>
				<label class="field checkbox-field">
					<input v-model="workspace.communityForm.active" :true-value="1" :false-value="0" type="checkbox" />
					<span>启用</span>
				</label>
			</div>
			<template #actions>
				<button type="button" @click="closeCommunityModal">取消</button>
				<button class="primary" :disabled="!workspace.canAction('community:edit')" @click="saveCommunity">
					{{ workspace.editingCommunityId ? '保存' : '新增小区' }}
				</button>
			</template>
		</ModalDialog>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import ModalDialog from '../components/common/ModalDialog.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const selectedCommunity = ref(null);
const communityModalOpen = ref(false);
const communityModalTitle = computed(() => workspace.editingCommunityId ? '编辑小区' : '新增小区');

function openCommunityModal(item = null) {
	if (item) workspace.editCommunity(item);
	else workspace.resetCommunityForm();
	communityModalOpen.value = true;
}

function closeCommunityModal() {
	communityModalOpen.value = false;
	workspace.resetCommunityForm();
}

async function saveCommunity() {
	const result = await workspace.saveCommunity();
	if (result) {
		communityModalOpen.value = false;
	}
}
</script>
