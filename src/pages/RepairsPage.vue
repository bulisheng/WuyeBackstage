<template>
	<section class="panel">
		<div class="panel-head">
			<h2>报修管理</h2>
			<span>{{ filteredRepairs.length }} 条工单 / 共 {{ workspace.repairs.length }} 条</span>
		</div>
		<div class="form-actions">
			<button :disabled="!workspace.canAction('repair:update')" @click="workspace.scanRepairSla">扫描服务时限超时</button>
			<button :disabled="!workspace.canAction('repair:view')" @click="workspace.exportRepairs">导出工单</button>
		</div>
		<p v-if="workspace.repairSlaSummary" class="field-hint">最近服务时限扫描标记 {{ workspace.repairSlaSummary.updated || 0 }} 条超时工单。</p>
		<div class="filter-row">
			<label class="field">
				<span>关键词</span>
				<input v-model="keyword" type="text" placeholder="标题 / 联系人 / 电话" />
			</label>
			<label class="field">
				<span>状态</span>
				<select v-model="status">
					<option value="">全部</option>
					<option value="pending">待处理</option>
					<option value="assigned">已派单</option>
					<option value="processing">处理中</option>
					<option value="completed">已完成</option>
					<option value="closed">已关闭</option>
				</select>
			</label>
		</div>
		<table>
			<thead>
				<tr>
					<th>标题</th>
					<th>类型</th>
					<th>联系人</th>
					<th>电话</th>
					<th>状态</th>
					<th>服务时限</th>
					<th>处理人</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in filteredRepairs" :key="item.id" class="clickable-row" @click="workspace.openRepairDetail(item)">
					<td>{{ item.title }}</td>
					<td>{{ item.type }}</td>
					<td>{{ item.contact }}</td>
					<td>{{ item.phone }}</td>
					<td><span class="status" :class="item.status">{{ workspace.workStatusText(item.status) }}</span></td>
					<td>{{ item.slaStatus || (item.deadline ? `期限 ${item.deadline}` : '-') }}</td>
					<td>{{ item.assignee || '未分配' }}</td>
				</tr>
			</tbody>
		</table>

		<DetailCard
			v-if="workspace.repairDetail"
			title="基础信息编辑"
			:subtitle="workspace.repairDetail.title || '工单详情'"
		>
			<template #actions>
				<span>{{ workspace.workStatusText(workspace.repairDetail.status) }}</span>
				<button type="button" @click="workspace.closeRepairDetail">收起</button>
			</template>
			<div class="detail-grid">
				<div><strong>标题</strong><input v-model="workspace.repairActionForm.title" type="text" placeholder="工单标题" /></div>
				<div><strong>类型</strong><input v-model="workspace.repairActionForm.type" type="text" placeholder="维修类型 / 来源" /></div>
				<div><strong>房屋</strong><input v-model="workspace.repairActionForm.house" type="text" placeholder="房屋信息" /></div>
				<div><strong>联系人</strong><input v-model="workspace.repairActionForm.contact" type="text" placeholder="联系人姓名" /></div>
				<div><strong>电话</strong><input v-model="workspace.repairActionForm.phone" type="text" placeholder="联系电话" /></div>
				<div><strong>当前状态</strong><p>{{ workspace.workStatusText(workspace.repairDetail.status) }}</p></div>
				<div><strong>服务时限</strong><p>{{ workspace.repairDetail.slaStatus || '-' }}</p></div>
				<div><strong>处理期限</strong><p>{{ workspace.repairDetail.deadline || '-' }}</p></div>
				<div><strong>处理人</strong><p>{{ workspace.repairDetail.assignee || '未分配' }}</p></div>
				<div><strong>评价分数</strong><p>{{ workspace.repairDetail.ratingScore != null ? `${workspace.repairDetail.ratingScore} 分` : '-' }}</p></div>
				<div><strong>评价备注</strong><p>{{ workspace.repairDetail.ratingRemark || '-' }}</p></div>
				<div><strong>提交时间</strong><p>{{ workspace.repairDetail.createdAt || '-' }}</p></div>
				<div><strong>更新时间</strong><p>{{ workspace.repairDetail.updatedAt || '-' }}</p></div>
				<div class="wide"><strong>描述</strong><textarea v-model="workspace.repairActionForm.desc" rows="4" placeholder="同步修改报修描述"></textarea></div>
			</div>
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('repair:update')" @click="workspace.saveRepairAction('edit')">保存基础信息</button>
				<button :disabled="!workspace.canAction('repair:update')" @click="restoreRepairDraft">恢复原值</button>
			</div>
		</DetailCard>
		<DetailCard
			v-if="workspace.repairDetail"
			title="状态流转"
			:subtitle="`${workspace.repairLogs.length} 条记录${workspace.repairActions.canEdit ? ' · 可编辑' : ''}`"
		>
			<div class="action-editor">
				<label class="field">
					<span>动作</span>
					<select v-model="workspace.repairActionForm.action">
						<option value="assign">派单</option>
						<option value="processing">开始处理</option>
						<option value="complete">完成维修</option>
						<option value="close">关闭工单</option>
						<option value="reopen">重开工单</option>
						<option value="remark">仅备注</option>
					</select>
				</label>
				<label class="field">
					<span>处理人</span>
					<select v-model="workspace.repairActionForm.staffId">
						<option value="">选择物业人员</option>
						<option v-for="staff in activeRepairStaff" :key="staff.id" :value="staff.id">{{ staff.name }}{{ staff.mobile ? ` / ${staff.mobile}` : '' }}{{ staff.onDuty ? ' · 在岗' : ' · 离岗' }}</option>
					</select>
				</label>
				<label class="field wide">
					<span>处理人文本</span>
					<input v-model="workspace.repairActionForm.assignee" type="text" placeholder="可保留手工输入的处理人名称" />
				</label>
				<label class="field wide">
					<span>处理说明</span>
					<textarea v-model="workspace.repairActionForm.content" rows="3" placeholder="填写派单、处理、关闭或备注说明"></textarea>
				</label>
				<div class="form-actions wide">
					<button class="primary" :disabled="!canSubmitAction" @click="workspace.saveRepairAction()">提交流转</button>
				</div>
			</div>
			<div class="timeline">
				<div v-for="log in workspace.repairLogs" :key="log.id || `${log.action}-${log.createdAt}`" class="timeline-item">
					<strong>{{ log.actionLabel || log.action }}</strong>
					<span>{{ log.fromLabel || log.fromStatus || '-' }} → {{ log.toLabel || log.toStatus || '-' }}</span>
					<p>{{ log.content || '无说明' }}</p>
					<small>{{ log.createdAt || '-' }} / {{ log.operatorType || '-' }}</small>
				</div>
			<p v-if="!workspace.repairLogs.length" class="empty-text">当前暂无流转记录。</p>
			</div>
		</DetailCard>
		<p v-if="!workspace.repairDetail" class="empty-text">请在列表中选择工单，查看详情和流转信息。</p>
		<div class="detail-card">
			<div class="panel-head compact">
				<h3>维修人员档案</h3>
				<span>{{ workspace.repairStaff.length }} 人</span>
			</div>
			<div class="form-grid">
				<label class="field">
					<span>姓名</span>
					<input v-model="workspace.repairStaffForm.name" type="text" placeholder="维修师傅姓名" />
				</label>
				<label class="field">
					<span>电话</span>
					<input v-model="workspace.repairStaffForm.mobile" type="text" placeholder="联系电话" />
				</label>
				<label class="field">
					<span>技能标签</span>
					<input v-model="workspace.repairStaffForm.skillTags" type="text" placeholder="水电 / 门禁 / 综合维修" />
				</label>
				<label class="field checkbox-field">
					<input v-model="workspace.repairStaffForm.active" :true-value="1" :false-value="0" type="checkbox" />
					<span>启用</span>
				</label>
			</div>
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('repair:assign')" @click="workspace.saveRepairStaff">{{ workspace.editingRepairStaffId ? '保存档案' : '新增档案' }}</button>
				<button @click="workspace.resetRepairStaffForm">重置</button>
			</div>
			<table>
				<thead>
					<tr>
						<th>姓名</th>
						<th>电话</th>
						<th>技能</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="staff in workspace.repairStaff" :key="staff.id">
						<td>{{ staff.name }}</td>
						<td>{{ staff.mobile || '-' }}</td>
						<td>{{ staff.skillTags || '-' }}</td>
						<td>{{ staff.active ? '启用' : '停用' }}</td>
			<td class="actions">
				<button :disabled="!workspace.canAction('repair:assign')" @click="workspace.editRepairStaff(staff)">编辑</button>
						<button v-if="workspace.canShowDeleteButton" class="danger" :disabled="!workspace.canAction('repair:assign')" @click="workspace.removeRepairStaff(staff)">删除</button>
			</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const keyword = ref('');
const status = ref('');
const activeRepairStaff = computed(() => workspace.propertyStaff.filter((item) =>
	item.active && (!item.moduleKeys || String(item.moduleKeys).includes('repairs') || String(item.moduleKeys).includes('repair'))
));

const filteredRepairs = computed(() => workspace.repairs.filter((item) => {
	const text = `${item.title || ''} ${item.contact || ''} ${item.phone || ''}`.toLowerCase();
	return (!keyword.value || text.includes(keyword.value.trim().toLowerCase())) && (!status.value || item.status === status.value);
}));

const canSubmitAction = computed(() => {
	const action = workspace.repairActionForm.action;
	if (action === 'assign') return workspace.canAction('repair:assign');
	if (action === 'close') return workspace.canAction('repair:close');
	if (action === 'edit') return workspace.canAction('repair:update');
	return workspace.canAction('repair:update');
});

function restoreRepairDraft() {
	if (!workspace.repairDetail) return;
	workspace.repairActionForm.title = workspace.repairDetail.title || '';
	workspace.repairActionForm.type = workspace.repairDetail.type || '';
	workspace.repairActionForm.house = workspace.repairDetail.house || '';
	workspace.repairActionForm.contact = workspace.repairDetail.contact || '';
	workspace.repairActionForm.phone = workspace.repairDetail.phone || '';
	workspace.repairActionForm.desc = workspace.repairDetail.desc || '';
}
</script>
