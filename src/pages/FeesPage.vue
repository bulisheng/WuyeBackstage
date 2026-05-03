<template>
	<section class="panel">
		<div class="panel-head">
			<h2>缴费管理</h2>
			<span>{{ filteredFees.length }} 条账单 / 共 {{ workspace.fees.length }} 条</span>
		</div>
		<div class="form-actions">
			<label class="file-action" :class="{ disabled: !workspace.canAction('fee:manage') }">
				选择表格导入
				<input type="file" accept=".csv,.txt,.tsv" :disabled="!workspace.canAction('fee:manage')" @change="workspace.importFeesFromFile" />
			</label>
			<button :disabled="!workspace.canAction('fee:manage')" @click="workspace.importFeesFromText">导入粘贴表格</button>
			<button :disabled="!workspace.canAction('fee:export')" @click="workspace.exportFees">导出账单</button>
			<button :disabled="!workspace.canAction('fee:collect')" @click="workspace.reconcileFees">微信支付对账</button>
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
		<div class="detail-card">
			<div class="panel-head compact">
				<h3>批量导入账单</h3>
				<span>支持从表格复制粘贴，或上传 CSV / TSV 文本表格</span>
			</div>
			<div class="form-actions compact">
				<button type="button" @click="workspace.fillFeeImportExample">填入示例测试数据</button>
			</div>
			<textarea v-model="workspace.feeImportText" rows="6" placeholder="手机号	标题	金额	类型	截止日期&#10;13363280414	2026年5月物业费	188.50	物业费	2026-05-31"></textarea>
			<p class="field-hint">示例数据手机号统一使用 13363280414；正式导入前请确认该手机号已完成业主认证。</p>
			<p v-if="workspace.feeImportSummary" class="field-hint">
				导入结果：成功 {{ workspace.feeImportSummary.created || 0 }} 条，失败 {{ workspace.feeImportSummary.failed || 0 }} 条
			</p>
		</div>
		<div class="announcement-editor">
			<div class="form-grid">
				<label class="field">
					<span>账单号</span>
					<input v-model="workspace.feeForm.billNo" type="text" placeholder="不填则自动生成，系统保证唯一" />
				</label>
				<label class="field">
					<span>标题</span>
					<input v-model="workspace.feeForm.title" type="text" placeholder="例如 2026年4月物业费" />
				</label>
				<label class="field">
					<span>业主手机号</span>
					<input v-model="workspace.feeForm.ownerMobile" type="text" placeholder="输入手机号后自动查询业主" @blur="workspace.resolveFeeOwnerByMobile()" />
				</label>
				<label class="field readonly-field">
					<span>业主姓名</span>
					<input :value="workspace.feeForm.ownerName || '输入手机号后自动带出'" type="text" readonly />
				</label>
				<label class="field readonly-field">
					<span>房屋</span>
					<input :value="workspace.feeForm.house || '输入手机号后自动带出'" type="text" readonly />
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
			<p class="field-hint">{{ workspace.feeOwnerLookupText }}</p>
			<div class="form-actions">
				<button class="primary" :disabled="!workspace.canAction('fee:manage') || workspace.feeSaving || workspace.feeLookupLoading" @click="workspace.saveFee">{{ workspace.editingFeeId ? '保存账单' : '新增账单' }}</button>
				<button @click="workspace.resetFeeForm">重置</button>
			</div>
		</div>
		<table>
			<thead>
				<tr>
					<th>账单号</th>
					<th>业主</th>
					<th>手机号</th>
					<th>房屋</th>
					<th>类型</th>
					<th>金额</th>
					<th>状态</th>
					<th>操作</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="item in filteredFees" :key="item.id" class="clickable-row" @click="selectFee(item)">
					<td>{{ item.billNo }}</td>
					<td>{{ item.ownerName }}</td>
					<td>{{ item.ownerMobile || '-' }}</td>
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
				<div class="head-actions">
					<span>{{ selectedFee.billNo || selectedFee.title }}</span>
					<button type="button" @click="clearSelectedFee">收起</button>
				</div>
			</div>
			<div class="detail-grid">
				<div><strong>账单号</strong><p>{{ selectedFee.billNo || '-' }}</p></div>
				<div><strong>业主</strong><p>{{ selectedFee.ownerName || '-' }}</p></div>
				<div><strong>手机号</strong><p>{{ selectedFee.ownerMobile || '-' }}</p></div>
				<div><strong>房屋</strong><p>{{ selectedFee.house || '-' }}</p></div>
				<div><strong>类型</strong><p>{{ selectedFee.billType || '-' }}</p></div>
				<div><strong>金额</strong><p>{{ workspace.money(selectedFee.amount) }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.feeStatusText(selectedFee.status) }}</p></div>
				<div><strong>截止日期</strong><p>{{ selectedFee.dueDate || '-' }}</p></div>
				<div><strong>备注</strong><p>{{ selectedFee.note || '暂无' }}</p></div>
			</div>
			<div class="payment-section">
				<div class="panel-head compact">
					<h3>单笔账单支付流水</h3>
					<span>{{ selectedFeePayments.length }} 条</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>流水号</th>
							<th>金额</th>
							<th>渠道</th>
							<th>状态</th>
							<th>交易号</th>
							<th>支付时间</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="payment in selectedFeePayments" :key="payment.id">
							<td>{{ payment.paymentNo || '-' }}</td>
							<td>{{ workspace.money(payment.amount) }}</td>
							<td>{{ payment.channel || '-' }}</td>
							<td><span class="status" :class="payment.status">{{ paymentStatusText(payment.status) }}</span></td>
							<td>{{ payment.transactionId || '-' }}</td>
							<td>{{ payment.paidAt || payment.createdAt || '-' }}</td>
						</tr>
					</tbody>
				</table>
				<p v-if="!selectedFeePayments.length" class="empty-text">当前账单暂无支付流水。</p>
			</div>
		</div>
		<div class="detail-card">
			<div class="panel-head compact">
				<h3>支付流水视图</h3>
				<span>{{ filteredPayments.length }} 条</span>
			</div>
			<p v-if="workspace.feeReconcileResult" class="field-hint">
				最近对账：共 {{ workspace.feeReconcileResult.summary?.totalBills || 0 }} 笔账单，异常 {{ workspace.feeReconcileResult.summary?.anomalyCount || 0 }} 条
			</p>
			<table v-if="workspace.feeReconcileResult && workspace.feeReconcileResult.anomalies && workspace.feeReconcileResult.anomalies.length" class="spaced-table">
				<thead>
					<tr>
						<th>账单</th>
						<th>业主</th>
						<th>应收</th>
						<th>实收</th>
						<th>异常</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in workspace.feeReconcileResult.anomalies" :key="item.id">
						<td>{{ item.billNo || item.title }}</td>
						<td>{{ item.ownerName || '-' }}</td>
						<td>{{ workspace.money(item.amount) }}</td>
						<td>{{ workspace.money(item.paidAmount) }}</td>
						<td>{{ item.issue }}</td>
					</tr>
				</tbody>
			</table>
			<div class="filter-row">
				<label class="field">
					<span>流水关键词</span>
					<input v-model="paymentKeyword" type="text" placeholder="流水号 / 交易号 / 账单号 / 业主" />
				</label>
				<label class="field">
					<span>流水状态</span>
					<select v-model="paymentStatus">
						<option value="">全部</option>
						<option value="pending">待支付</option>
						<option value="success">成功</option>
						<option value="failed">失败</option>
						<option value="refunded">已退款</option>
					</select>
				</label>
			</div>
			<table>
				<thead>
					<tr>
						<th>流水号</th>
						<th>账单</th>
						<th>业主/房屋</th>
						<th>金额</th>
						<th>渠道</th>
						<th>状态</th>
						<th>交易号</th>
						<th>时间</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="payment in filteredPayments" :key="payment.id">
						<td>{{ payment.paymentNo || '-' }}</td>
						<td>{{ payment.billNo || payment.title || '-' }}</td>
						<td>{{ payment.ownerName || '-' }} / {{ payment.house || '-' }}</td>
						<td>{{ workspace.money(payment.amount) }}</td>
						<td>{{ payment.channel || '-' }}</td>
						<td><span class="status" :class="payment.status">{{ paymentStatusText(payment.status) }}</span></td>
						<td>{{ payment.transactionId || '-' }}</td>
						<td>{{ payment.paidAt || payment.createdAt || '-' }}</td>
					</tr>
				</tbody>
			</table>
			<p v-if="!filteredPayments.length" class="empty-text">暂无匹配支付流水。</p>
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
const paymentKeyword = ref('');
const paymentStatus = ref('');

const filteredFees = computed(() => workspace.fees.filter((item) => {
	const text = `${item.billNo || ''} ${item.ownerName || ''} ${item.ownerMobile || ''} ${item.house || ''} ${item.title || ''}`.toLowerCase();
	return (!keyword.value || text.includes(keyword.value.trim().toLowerCase())) && (!status.value || item.status === status.value);
}));

const selectedFeePayments = computed(() => {
	return workspace.selectedFeePayments;
});

const filteredPayments = computed(() => workspace.paymentRecords.filter((item) => {
	const text = `${item.paymentNo || ''} ${item.transactionId || ''} ${item.billNo || ''} ${item.title || ''} ${item.ownerName || ''} ${item.ownerMobile || ''} ${item.house || ''}`.toLowerCase();
	const keywordMatched = !paymentKeyword.value || text.includes(paymentKeyword.value.trim().toLowerCase());
	const statusMatched = !paymentStatus.value || item.status === paymentStatus.value;
	return keywordMatched && statusMatched;
}));

function paymentStatusText(value) {
	return {
		pending: '待支付',
		success: '成功',
		paid: '已支付',
		failed: '失败',
		refunded: '已退款'
	}[value] || value || '-';
}

async function selectFee(item) {
	if (selectedFee.value && item && Number(selectedFee.value.id) === Number(item.id)) {
		clearSelectedFee();
		return;
	}
	selectedFee.value = item;
	await workspace.selectFee(item);
}

async function clearSelectedFee() {
	selectedFee.value = null;
	await workspace.selectFee(null);
}
</script>
