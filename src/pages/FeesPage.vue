<template>
	<section class="panel">
		<div class="panel-head">
			<h2>缴费管理</h2>
			<span>{{ filteredFees.length }} 条账单 / 共 {{ workspace.fees.length }} 条</span>
		</div>
		<div class="form-actions">
			<label class="file-action" :class="{ disabled: !workspace.canAction('fee:manage') }">
				选择表格导入
				<input type="file" accept=".csv,.txt,.tsv" :disabled="!workspace.canAction('fee:manage')" @change="handleImportFile" />
			</label>
			<button :disabled="!workspace.canAction('fee:manage')" @click="handleImportText">导入粘贴表格</button>
			<button :disabled="!workspace.canAction('fee:export')" @click="handleExportFees">导出账单</button>
			<button :disabled="!workspace.canAction('fee:collect')" @click="handleReconcileFees">微信支付对账</button>
		</div>
		<div class="form-actions compact">
			<button class="primary" :disabled="!workspace.canAction('fee:manage')" @click="openCreateFeeModal">新增账单</button>
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
		<DetailCard title="批量导入账单" subtitle="支持从表格复制粘贴，或上传 CSV / TSV 文本表格">
			<div class="form-actions compact">
					<button type="button" @click="workspace.fillFeeImportExample">载入样例数据</button>
			</div>
			<textarea v-model="workspace.feeImportText" rows="6" placeholder="手机号	标题	金额	类型	截止日期&#10;13363280414	2026年5月物业费	188.50	物业费	2026-05-31"></textarea>
			<p class="field-hint">样例数据统一使用手机号 13363280414；正式导入前请确认该手机号已完成业主认证。</p>
			<div v-if="workspace.feeImportSummary" class="import-summary">
				<div class="reconcile-summary">
					<span>新增 {{ workspace.feeImportSummary.created || 0 }} 条</span>
					<span>更新 {{ workspace.feeImportSummary.updated || 0 }} 条</span>
					<span>失败 {{ workspace.feeImportSummary.failed || 0 }} 条</span>
				</div>
				<p class="field-hint">如果失败较多，先检查手机号、标题和金额是否完整，再重新导入。</p>
				<ul v-if="importFailureRows.length" class="issue-list">
					<li v-for="item in importFailureRows" :key="item.key">
						{{ item.label }}：{{ item.reason }}
					</li>
				</ul>
			</div>
		</DetailCard>
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
						<button :disabled="!workspace.canAction('fee:manage')" @click.stop="openEditFeeModal(item)">编辑</button>
						<button :disabled="!workspace.canAction('fee:remind')" @click.stop="openRemindFeeModal(item)">催缴</button>
						<button v-if="workspace.canAction('fee:manage')" class="danger" :disabled="!workspace.canAction('fee:manage')" @click.stop="workspace.removeFee(item)">删除</button>
					</td>
				</tr>
			</tbody>
		</table>

		<DetailCard v-if="selectedFee" title="账单详情" :subtitle="selectedFee.billNo || selectedFee.title">
			<template #actions>
				<button type="button" @click="clearSelectedFee">收起</button>
			</template>
			<div class="detail-grid">
				<div><strong>账单号</strong><p>{{ selectedFee.billNo || '-' }}</p></div>
				<div><strong>业主</strong><p>{{ selectedFee.ownerName || '-' }}</p></div>
				<div><strong>手机号</strong><p>{{ selectedFee.ownerMobile || '-' }}</p></div>
				<div><strong>房屋</strong><p>{{ selectedFee.house || '-' }}</p></div>
				<div><strong>类型</strong><p>{{ selectedFee.billType || '-' }}</p></div>
				<div><strong>金额</strong><p>{{ workspace.money(selectedFee.amount) }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.feeStatusText(selectedFee.status) }}</p></div>
				<div><strong>截止日期</strong><p>{{ selectedFee.dueDate || '-' }}</p></div>
				<div><strong>备注</strong><p>{{ selectedFee.note || '暂无备注' }}</p></div>
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
			<p v-if="!selectedFeePayments.length" class="empty-text">当前账单暂无支付流水记录。</p>
			</div>
		</DetailCard>
		<DetailCard title="支付流水视图" :subtitle="`${filteredPayments.length} 条`">
			<div v-if="workspace.feeReconcileResult" class="import-summary">
				<div class="reconcile-summary">
					<span>总账单 {{ workspace.feeReconcileResult.summary?.totalBills || 0 }} 笔</span>
					<span>异常 {{ workspace.feeReconcileResult.summary?.anomalyCount || 0 }} 条</span>
					<span>未标记已支付 {{ reconcileIssueStats.notMarkedPaid || 0 }} 条</span>
					<span>已支付不足额 {{ reconcileIssueStats.paidNotEnough || 0 }} 条</span>
					<span>实收超额 {{ reconcileIssueStats.overpaid || 0 }} 条</span>
				</div>
				<p class="field-hint">{{ reconcileSummaryText }}</p>
			</div>
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
			<p v-else-if="workspace.feeReconcileResult" class="empty-text">当前对账未发现金额异常，账单与支付流水可继续保持一致。</p>
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
			<p v-if="!filteredPayments.length" class="empty-text">{{ paymentEmptyText }}</p>
		<p v-if="operationNotice" class="field-hint">{{ operationNotice }}</p>
		</DetailCard>

		<div v-if="feeModalOpen" class="modal-backdrop" @click.self="closeFeeModal">
			<div class="modal-shell" role="dialog" aria-modal="true" :aria-label="feeModalTitle">
				<div class="modal-head">
					<div>
						<h3>{{ feeModalTitle }}</h3>
						<p>保存后会同步到账单列表，成功或失败都会给出提示。</p>
					</div>
					<button class="icon-button" type="button" @click="closeFeeModal">关闭</button>
				</div>
				<div class="modal-body">
					<div class="form-grid">
						<label class="field">
							<span>账单号</span>
							<input v-model="workspace.feeForm.billNo" type="text" placeholder="不填则自动生成，系统保证唯一" />
						</label>
						<label class="field">
							<span>标题</span>
							<input v-model="workspace.feeForm.title" type="text" placeholder="如：2026年4月物业费" />
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
							<input v-model="workspace.feeForm.billType" type="text" placeholder="如：物业费 / 停车费" />
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
				</div>
				<div class="modal-actions">
					<button type="button" @click="closeFeeModal">取消</button>
					<button class="primary" :disabled="!workspace.canAction('fee:manage') || workspace.feeSaving || workspace.feeLookupLoading" @click="handleSaveFee">
						{{ workspace.editingFeeId ? '保存' : '新增账单' }}
					</button>
				</div>
			</div>
		</div>

		<div v-if="remindModalOpen" class="modal-backdrop" @click.self="closeRemindFeeModal">
			<div class="modal-shell" role="dialog" aria-modal="true" aria-label="账单催缴">
				<div class="modal-head">
					<div>
						<h3>账单催缴</h3>
						<p>先确认催缴方式和手机号，再创建催缴记录。</p>
					</div>
					<button class="icon-button" type="button" @click="closeRemindFeeModal">关闭</button>
				</div>
				<div class="modal-body">
					<div class="detail-grid remind-preview">
						<div><strong>账单</strong><p>{{ remindTarget?.title || remindTarget?.billNo || '-' }}</p></div>
						<div><strong>业主</strong><p>{{ remindTarget?.ownerName || '-' }}</p></div>
						<div><strong>手机号</strong><p>{{ remindTarget?.ownerMobile || '-' }}</p></div>
						<div><strong>房屋</strong><p>{{ remindTarget?.house || '-' }}</p></div>
					</div>
					<div class="form-grid">
						<label class="field full">
							<span>催缴方式</span>
							<select v-model="remindChannel">
								<option value="phone_task">电话催缴</option>
								<option value="sms">短信催缴</option>
							</select>
						</label>
					</div>
				</div>
				<div class="modal-actions">
					<button type="button" @click="closeRemindFeeModal">取消</button>
					<button class="primary" type="button" :disabled="!remindTarget" @click="sendFeeReminder">确认催缴</button>
				</div>
			</div>
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
const selectedFee = ref(null);
const paymentKeyword = ref('');
const paymentStatus = ref('');
const operationNotice = ref('');
const feeModalOpen = ref(false);
const feeModalTitle = computed(() => workspace.editingFeeId ? '编辑账单' : '新增账单');
const remindModalOpen = ref(false);
const remindTarget = ref(null);
const remindChannel = ref('phone_task');

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
const importFailureRows = computed(() => (workspace.feeImportResults || [])
	.filter((item) => item && item.ok === false)
	.slice(0, 5)
	.map((item, index) => ({
		key: `${index}-${item.ownerMobile || item.title || item.reason || 'import'}`,
		label: item.ownerMobile || item.title || `第 ${index + 1} 条`,
		reason: item.reason || '导入失败'
	})));
const reconcileIssueStats = computed(() => {
	const anomalies = workspace.feeReconcileResult?.anomalies || [];
	return anomalies.reduce((acc, item) => {
		const issue = String(item.issue || '');
		if (issue.includes('未标记已支付')) acc.notMarkedPaid += 1;
		else if (issue.includes('金额不足')) acc.paidNotEnough += 1;
		else if (issue.includes('超过账单金额')) acc.overpaid += 1;
		return acc;
	}, { notMarkedPaid: 0, paidNotEnough: 0, overpaid: 0 });
});
const reconcileSummaryText = computed(() => {
	if (!workspace.feeReconcileResult) return '';
	const anomalies = workspace.feeReconcileResult.anomalies || [];
	if (!anomalies.length) return '当前对账没有发现金额异常，可以继续按账单和流水核对。';
	return '先处理“未标记已支付”和“已支付不足额”的账单，再核查超额流水，能最快恢复账实一致。';
});
const paymentEmptyText = computed(() => {
	if (filteredPayments.value.length) return '';
	if (paymentKeyword.value || paymentStatus.value) {
		return '当前筛选条件下没有匹配的支付流水，请放宽关键词或状态后再试。';
	}
	return '当前暂无支付流水记录，可能还未产生收款数据。';
});

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

function openCreateFeeModal() {
	workspace.resetFeeForm();
	feeModalOpen.value = true;
}

function openEditFeeModal(item) {
	workspace.editFee(item);
	feeModalOpen.value = true;
}

function closeFeeModal() {
	feeModalOpen.value = false;
	workspace.resetFeeForm();
}

function openRemindFeeModal(item) {
	remindTarget.value = item || null;
	remindChannel.value = 'phone_task';
	remindModalOpen.value = true;
}

function closeRemindFeeModal() {
	remindModalOpen.value = false;
	remindTarget.value = null;
	remindChannel.value = 'phone_task';
}

async function handleSaveFee() {
	const result = await workspace.saveFee();
	if (!result) return;
	feeModalOpen.value = false;
}

async function handleImportText() {
	operationNotice.value = '';
	const result = await workspace.importFeesFromText();
	if (!result) return;
	const summary = result.summary || {};
	operationNotice.value = `导入完成：新增 ${summary.created || 0} 条，更新 ${summary.updated || 0} 条，失败 ${summary.failed || 0} 条。`;
}

async function handleImportFile(event) {
	operationNotice.value = '';
	const result = await workspace.importFeesFromFile(event);
	if (!result) return;
	const summary = result.summary || {};
	operationNotice.value = `文件导入完成：新增 ${summary.created || 0} 条，更新 ${summary.updated || 0} 条，失败 ${summary.failed || 0} 条。`;
}

async function handleExportFees() {
	operationNotice.value = '';
	const result = await workspace.exportFees();
	if (!result) return;
	operationNotice.value = `已导出账单文件：${result.filename || 'fees.csv'}。`;
}

async function handleReconcileFees() {
	operationNotice.value = '';
	const result = await workspace.reconcileFees();
	if (!result) return;
	const summary = result.summary || {};
	operationNotice.value = `对账完成：共 ${summary.totalBills || 0} 笔账单，发现 ${summary.anomalyCount || 0} 条异常。`;
}

async function sendFeeReminder() {
	if (!remindTarget.value) return;
	const result = await workspace.remindFee(remindTarget.value, remindChannel.value);
	if (result) {
		closeRemindFeeModal();
	}
}
</script>

<style scoped>
.modal-backdrop {
	position: fixed;
	inset: 0;
	z-index: 60;
	background: rgba(9, 14, 24, 0.52);
	backdrop-filter: blur(8px);
	display: grid;
	place-items: center;
	padding: 20px;
}

.modal-shell {
	width: min(880px, 100%);
	max-height: min(90vh, 900px);
	overflow: auto;
	background: rgba(255, 251, 244, 0.98);
	border: 1px solid rgba(14, 23, 38, 0.12);
	border-radius: 24px;
	box-shadow: 0 28px 72px rgba(18, 26, 39, 0.24);
	padding: 22px;
	display: grid;
	gap: 18px;
}

.modal-head {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
}

.modal-head h3 {
	font-size: 20px;
	line-height: 1.2;
}

.modal-head p {
	margin-top: 6px;
	color: #64748b;
	font-size: 13px;
	line-height: 1.5;
}

.modal-body {
	display: grid;
	gap: 12px;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

.icon-button {
	border: 1px solid rgba(14, 23, 38, 0.14);
	background: #fff;
	border-radius: 999px;
	padding: 8px 14px;
}

@media (max-width: 768px) {
	.modal-backdrop {
		padding: 12px;
	}

	.modal-shell {
		padding: 16px;
		border-radius: 18px;
	}

	.modal-head {
		flex-direction: column;
	}

	.modal-actions {
		flex-direction: column-reverse;
	}

	.modal-actions button {
		width: 100%;
	}
}
</style>
