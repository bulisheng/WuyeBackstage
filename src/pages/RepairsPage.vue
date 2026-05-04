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

		<div v-if="workspace.repairDetail" class="detail-card">
			<div class="panel-head compact">
				<h3>工单详情</h3>
				<div class="head-actions">
					<span>{{ workspace.workStatusText(workspace.repairDetail.status) }}</span>
					<button type="button" @click="workspace.closeRepairDetail">收起</button>
				</div>
			</div>
			<div class="detail-grid">
				<div><strong>标题</strong><p>{{ workspace.repairDetail.title || '-' }}</p></div>
				<div><strong>类型</strong><p>{{ workspace.repairDetail.type || '-' }}</p></div>
				<div><strong>房屋</strong><p>{{ workspace.repairDetail.house || '-' }}</p></div>
				<div><strong>联系人</strong><p>{{ workspace.repairDetail.contact || '-' }}</p></div>
				<div><strong>电话</strong><p>{{ workspace.repairDetail.phone || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.workStatusText(workspace.repairDetail.status) }}</p></div>
				<div><strong>服务时限</strong><p>{{ workspace.repairDetail.slaStatus || '-' }}</p></div>
				<div><strong>处理期限</strong><p>{{ workspace.repairDetail.deadline || '-' }}</p></div>
				<div><strong>处理人</strong><p>{{ workspace.repairDetail.assignee || '未分配' }}</p></div>
				<div><strong>提交时间</strong><p>{{ workspace.repairDetail.createdAt || '-' }}</p></div>
				<div class="wide"><strong>描述</strong><p>{{ workspace.repairDetail.desc || '暂无描述' }}</p></div>
			</div>
			<div class="state-panel">
				<div class="panel-head compact">
					<h3>状态流转</h3>
					<span>{{ workspace.repairLogs.length }} 条记录</span>
				</div>
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
						<span>处理说明</span>
						<textarea v-model="workspace.repairActionForm.content" rows="3" placeholder="填写派单、处理、关闭或备注说明"></textarea>
					</label>
					<div class="form-actions wide">
						<button class="primary" :disabled="!canSubmitAction" @click="workspace.saveRepairAction">提交流转</button>
					</div>
				</div>
				<div class="timeline">
					<div v-for="log in workspace.repairLogs" :key="log.id || `${log.action}-${log.createdAt}`" class="timeline-item">
						<strong>{{ log.actionLabel || log.action }}</strong>
						<span>{{ log.fromLabel || log.fromStatus || '-' }} → {{ log.toLabel || log.toStatus || '-' }}</span>
						<p>{{ log.content || '无说明' }}</p>
						<small>{{ log.createdAt || '-' }} / {{ log.operatorType || '-' }}</small>
					</div>
					<p v-if="!workspace.repairLogs.length" class="empty-text">暂无流转记录</p>
				</div>
			</div>
		</div>
		<p v-if="!workspace.repairDetail" class="empty-text">点击列表中的工单查看详情和处理流转。</p>
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
				<button class="primary" :disabled="!workspace.canAction('repair:assign')" @click="workspace.saveRepairStaff">{{ workspace.editingRepairStaffId ? '保存人员' : '新增人员' }}</button>
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
				<button class="danger" :disabled="!workspace.canAction('repair:assign')" @click="workspace.removeRepairStaff(staff)">删除</button>
			</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
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
	return workspace.canAction('repair:update');
});
</script>
