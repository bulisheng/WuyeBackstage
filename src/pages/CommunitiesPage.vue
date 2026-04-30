<template>
	<section class="panel">
		<div class="panel-head">
			<h2>小区管理</h2>
			<span>{{ workspace.communities.length }} 个小区</span>
		</div>
		<div class="community-editor">
			<div class="form-grid">
				<label class="field">
					<span>小区编码</span>
					<input v-model="workspace.communityForm.code" type="text" placeholder="例如 rzb-001" />
				</label>
				<label class="field">
					<span>小区名称</span>
					<input v-model="workspace.communityForm.name" type="text" placeholder="例如 荣尊堡" />
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
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('community:edit')" @click="workspace.saveCommunity">{{ workspace.editingCommunityId ? '保存修改' : '新增小区' }}</button>
				<button @click="workspace.resetCommunityForm">重置</button>
			</div>
		</div>
		<div class="community-list">
			<div v-for="item in workspace.communities" :key="item.id" class="community-row clickable-row" @click="selectedCommunity = item">
				<div class="community-meta">
					<strong>{{ item.name }}</strong>
					<span>{{ item.code }}</span>
					<small>{{ item.address || '暂无地址' }}</small>
				</div>
				<div class="community-actions">
					<span class="status" :class="item.active ? 'approved' : 'disabled'">{{ item.active ? '启用' : '停用' }}</span>
					<button :disabled="!workspace.canAction('community:edit')" @click.stop="workspace.editCommunity(item)">编辑</button>
					<button :disabled="!workspace.canAction('community:edit')" @click.stop="workspace.toggleCommunityActive(item)">{{ item.active ? '停用' : '启用' }}</button>
					<button class="danger" :disabled="!workspace.canAction('community:delete')" @click.stop="workspace.removeCommunity(item)">删除</button>
				</div>
			</div>
		</div>

		<div v-if="selectedCommunity" class="detail-card">
			<div class="panel-head compact">
				<h3>小区详情</h3>
				<span>{{ selectedCommunity.schemaName }}</span>
			</div>
			<div class="detail-grid">
				<div><strong>编码</strong><p>{{ selectedCommunity.code || '-' }}</p></div>
				<div><strong>名称</strong><p>{{ selectedCommunity.name || '-' }}</p></div>
				<div><strong>Schema</strong><p>{{ selectedCommunity.schemaName || '-' }}</p></div>
				<div><strong>地址</strong><p>{{ selectedCommunity.address || '-' }}</p></div>
				<div><strong>电话</strong><p>{{ selectedCommunity.phone || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ selectedCommunity.active ? '启用' : '停用' }}</p></div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref } from 'vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const selectedCommunity = ref(null);
</script>
