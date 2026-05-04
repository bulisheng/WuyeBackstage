<template>
	<section class="panel">
		<div class="panel-head">
			<h2>物业人员</h2>
			<span>{{ workspace.propertyStaff.length }} 人</span>
		</div>

		<DetailCard :title="workspace.editingPropertyStaffId ? '编辑人员' : '新增人员'" subtitle="负责模块、手机号和在岗状态会被各业务下拉复用">
			<div class="form-grid">
				<label class="field">
					<span>姓名</span>
					<input v-model="workspace.propertyStaffForm.name" type="text" placeholder="如：张师傅" />
				</label>
				<label class="field">
					<span>手机号</span>
					<input v-model="workspace.propertyStaffForm.mobile" type="text" placeholder="用于通知或电话联系" />
				</label>
				<label class="field">
					<span>岗位</span>
					<input v-model="workspace.propertyStaffForm.role" type="text" placeholder="客服 / 维修 / 管家 / 主管" />
				</label>
				<div class="role-preview span-2">
					<div class="preview-head">
						<h4>负责模块</h4>
						<span>点选该物业人员负责的业务范围</span>
					</div>
					<div class="chip-row selectable">
						<button
							v-for="item in workspace.propertyStaffModuleOptions"
							:key="item.key"
							type="button"
							class="chip chip-button"
							:class="{ selected: workspace.hasPropertyStaffModule(item.key) }"
							@click="workspace.togglePropertyStaffModule(item.key)"
						>
							{{ item.label }}
						</button>
					</div>
				</div>
				<label class="field checkbox-field">
					<input v-model="workspace.propertyStaffForm.onDuty" :true-value="1" :false-value="0" type="checkbox" />
					<span>在岗</span>
				</label>
				<label class="field checkbox-field">
					<input v-model="workspace.propertyStaffForm.active" :true-value="1" :false-value="0" type="checkbox" />
					<span>启用</span>
				</label>
				<label class="field span-2">
					<span>备注</span>
					<textarea v-model="workspace.propertyStaffForm.remark" rows="3" placeholder="负责范围、班次、钉钉群等说明"></textarea>
				</label>
			</div>
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('staff:manage')" @click="workspace.savePropertyStaff">{{ workspace.editingPropertyStaffId ? '保存人员' : '新增人员' }}</button>
				<button @click="workspace.resetPropertyStaffForm">重置</button>
			</div>
		</DetailCard>

		<table>
			<thead>
				<tr>
					<th>姓名</th>
					<th>手机号</th>
					<th>岗位</th>
					<th>负责模块</th>
					<th>在岗</th>
					<th>状态</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="staff in workspace.propertyStaff" :key="staff.id">
					<td>{{ staff.name }}</td>
					<td>{{ staff.mobile || '-' }}</td>
					<td>{{ staff.role || '-' }}</td>
					<td>{{ workspace.moduleKeysLabel(staff.moduleKeys) }}</td>
					<td>{{ staff.onDuty ? '在岗' : '离岗' }}</td>
					<td>{{ staff.active ? '启用' : '停用' }}</td>
					<td class="actions">
						<button :disabled="!workspace.canAction('staff:manage')" @click="workspace.editPropertyStaff(staff)">编辑</button>
						<button :disabled="!workspace.canAction('staff:manage')" @click="toggleDuty(staff)">{{ staff.onDuty ? '设为离岗' : '设为在岗' }}</button>
						<button :disabled="!workspace.canAction('staff:manage')" @click="toggleActive(staff)">{{ staff.active ? '停用' : '启用' }}</button>
						<button v-if="workspace.canShowDeleteButton" class="danger" :disabled="!workspace.canAction('staff:manage')" @click="workspace.removePropertyStaff(staff)">删除</button>
					</td>
				</tr>
			</tbody>
		</table>
	</section>
</template>

<script setup>
import DetailCard from '../components/common/DetailCard.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();

async function quickToggleStaffField(staff, field) {
	workspace.editPropertyStaff(staff);
	workspace.propertyStaffForm[field] = staff[field] ? 0 : 1;
	await workspace.savePropertyStaff();
}

function toggleDuty(staff) {
	return quickToggleStaffField(staff, 'onDuty');
}

function toggleActive(staff) {
	return quickToggleStaffField(staff, 'active');
}
</script>
