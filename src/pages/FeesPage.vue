<template>
	<section class="panel">
		<div class="panel-head">
			<h2>缴费管理</h2>
			<span>{{ filteredFees.length }} 条账单 / 共 {{ workspace.fees.length }} 条</span>
		</div>
		<div class="filter-row">
			<label class="field">
				<span>关键词</span>
				<input v-model="keyword" type="text" placeholder="账单号 / 业主 / 房屋" />
			</label>
			<label class="field">
				<span>状态</span>
				<select v-model="status">
					<option value="">全部</option>
					<option value="pending">待支付</option>
					<option value="paid">已支付</option>
					<option value="overdue">逾期</option>
					<option value="cancelled">已取消</option>
					<option value="refunded">已退款</option>
				</select>
			</label>
		</div>
		<div class="announcement-editor">
			<div class="form-grid">
				<label class="field">
					<span>账单号</span>
					<input v-model="workspace.feeForm.billNo" type="text" placeholder="不填则自动生成" />
				</label>
				<label class="field">
					<span>标题</span>
					<input v-model="workspace.feeForm.title" type="text" placeholder="例如 2026年4月物业费" />
				</label>
				<label class="field">
					<span>业主</span>
					<input v-model="workspace.feeForm.ownerName" type="text" placeholder="请输入业主姓名" />
				</label>
				<label class="field">
					<span>房屋</span>
					<input v-model="workspace.feeForm.house" type="text" placeholder="例如 1-2-301" />
				</label>
				<label class="field">
					<span>类型</span>
					<input v-model="workspace.feeForm.billType" type="text" placeholder="例如 物业费 / 停车费" />
				</label>
				<label class="field">
					<span>金额</span>
					<input v-model.number="workspace.feeForm.amount" type="number" min="0" step="0.01" />
				</label>
				<label class="field">
					<span>状态</span>
					<select v-model="workspace.feeForm.status">
						<option value="pending">待支付</option>
						<option value="paid">已支付</option>
						<option value="overdue">已逾期</option>
						<option value="cancelled">已取消</option>
						<option value="refunded">已退款</option>
					</select>
				</label>
				<label class="field">
					<span>截止日期</span>
					<input v-model="workspace.feeForm.dueDate" type="date" />
				</label>
			</div>
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('fee:manage')" @click="workspace.saveFee">{{ workspace.editingFeeId ? '保存账单' : '新增账单' }}</button>
				<button @click="workspace.resetFeeForm">重置</button>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th>账单号</th>
					<th>业主</th>
					<th>房屋</th>
					<th>类型</th>
					<th>金额</th>
					<th>状态</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in filteredFees" :key="item.id" class="clickable-row" @click="selectedFee = item">
					<td>{{ item.billNo }}</td>
					<td>{{ item.ownerName }}</td>
					<td>{{ item.house }}</td>
					<td>{{ item.billType }}</td>
					<td>{{ workspace.money(item.amount) }}</td>
					<td><span class="status" :class="item.status">{{ workspace.feeStatusText(item.status) }}</span></td>
					<td class="actions">
						<button :disabled="!workspace.canAction('fee:manage')" @click.stop="workspace.editFee(item)">编辑</button>
						<button :disabled="!workspace.canAction('fee:remind')" @click.stop="workspace.remindFee(item)">催缴</button>
						<button class="danger" :disabled="!workspace.canAction('fee:manage')" @click.stop="workspace.removeFee(item)">删除</button>
					</td>
				</tr>
			</tbody>
		</table>

		<div v-if="selectedFee" class="detail-card">
			<div class="panel-head compact">
				<h3>账单详情</h3>
				<span>{{ selectedFee.billNo || selectedFee.title }}</span>
			</div>
			<div class="detail-grid">
				<div><strong>账单号</strong><p>{{ selectedFee.billNo || '-' }}</p></div>
				<div><strong>业主</strong><p>{{ selectedFee.ownerName || '-' }}</p></div>
				<div><strong>房屋</strong><p>{{ selectedFee.house || '-' }}</p></div>
				<div><strong>类型</strong><p>{{ selectedFee.billType || '-' }}</p></div>
				<div><strong>金额</strong><p>{{ workspace.money(selectedFee.amount) }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.feeStatusText(selectedFee.status) }}</p></div>
				<div><strong>截止日期</strong><p>{{ selectedFee.dueDate || '-' }}</p></div>
				<div><strong>备注</strong><p>{{ selectedFee.note || '暂无' }}</p></div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const keyword = ref('');
const status = ref('');
const selectedFee = ref(null);

const filteredFees = computed(() => workspace.fees.filter((item) => {
	const text = `${item.billNo || ''} ${item.ownerName || ''} ${item.house || ''} ${item.title || ''}`.toLowerCase();
	return (!keyword.value || text.includes(keyword.value.trim().toLowerCase())) && (!status.value || item.status === status.value);
}));
</script>
