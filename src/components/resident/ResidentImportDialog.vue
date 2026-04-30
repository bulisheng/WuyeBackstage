<template>
	<div v-if="open" class="resident-import">
		<div class="panel-head compact">
			<div>
				<h3>表格导入</h3>
				<p>支持从表格复制粘贴，手机号作为更新主键，姓名仅作为展示资料。</p>
			</div>
			<button @click="$emit('close')">关闭</button>
		</div>

		<div class="filter-row import-controls">
			<label class="field">
				<span>住户类型</span>
				<select v-model="residentType">
					<option value="owner">业主</option>
					<option value="tenant">租户</option>
				</select>
			</label>
			<label class="field wide">
				<span>粘贴表格</span>
				<textarea v-model="rawText" rows="6" placeholder="手机号	姓名	房号&#10;13800000000	张三	1-2-301"></textarea>
			</label>
		</div>

		<div class="import-summary">
			<span>新增：{{ summary.create }}</span>
			<span>更新：{{ summary.upsert }}</span>
			<span>待人工确认：{{ summary.manual_review }}</span>
			<span>失败：{{ summary.failed }}</span>
		</div>

		<table v-if="previewRows.length">
			<thead>
				<tr>
					<th>手机号</th>
					<th>姓名</th>
					<th>房号</th>
					<th>状态</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, index) in previewRows" :key="`${row.mobile}-${index}`">
					<td>{{ row.mobile || '-' }}</td>
					<td>{{ row.name || '-' }}</td>
					<td>{{ row.house || '-' }}</td>
					<td>{{ row.errors.length ? row.errors.join('、') : '可导入' }}</td>
				</tr>
			</tbody>
		</table>

		<div class="community-actions import-actions">
			<button class="primary" :disabled="!importableRows.length || submitting" @click="submitImport">
				{{ submitting ? '导入中...' : '确认导入' }}
			</button>
			<button @click="reset">清空</button>
		</div>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { normalizeResidentImportRows } from '../../utils/residentDirectory.js';

const props = defineProps({
	open: {
		type: Boolean,
		default: false
	},
	submitting: {
		type: Boolean,
		default: false
	}
});

const emit = defineEmits(['close', 'import']);

const residentType = ref('owner');
const rawText = ref('');

const parsedRows = computed(() => parseTableText(rawText.value));
const previewRows = computed(() => normalizeResidentImportRows(parsedRows.value, residentType.value));
const importableRows = computed(() => previewRows.value.filter((row) => row.mode !== 'manual_review'));
const summary = computed(() => previewRows.value.reduce((acc, row) => {
	acc[row.mode] = (acc[row.mode] || 0) + 1;
	return acc;
}, { create: 0, upsert: 0, manual_review: 0, failed: 0 }));

function parseTableText(value) {
	const lines = String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	if (!lines.length) return [];
	const splitLine = (line) => line.includes('\t') ? line.split('\t') : line.split(',');
	const first = splitLine(lines[0]).map((item) => item.trim());
	const hasHeader = first.some((item) => ['手机号', '姓名', '房号', 'mobile', 'name', 'house'].includes(item));
	const headers = hasHeader ? first : ['mobile', 'name', 'house'];
	const rows = hasHeader ? lines.slice(1) : lines;
	return rows.map((line) => {
		const cells = splitLine(line).map((item) => item.trim());
		return headers.reduce((record, header, index) => {
			record[header] = cells[index] || '';
			return record;
		}, {});
	});
}

function submitImport() {
	emit('import', {
		residentType: residentType.value,
		rows: importableRows.value
	});
}

function reset() {
	rawText.value = '';
}
</script>

<style scoped>
.resident-import {
	margin: 16px 0;
	padding: 16px;
	border: 1px solid #e8eeea;
	border-radius: 12px;
	background: #f9fbfa;
}

.resident-import p {
	margin-top: 4px;
	color: #6b7280;
}

.import-controls {
	grid-template-columns: minmax(140px, 0.4fr) minmax(260px, 1.6fr);
}

textarea {
	width: 100%;
	border: 1px solid #d9e1dc;
	border-radius: 8px;
	padding: 10px;
	font: inherit;
	resize: vertical;
}

.import-summary {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin-bottom: 12px;
	color: #475569;
}

.import-summary span {
	padding: 6px 10px;
	border-radius: 999px;
	background: #fff;
	border: 1px solid #e8eeea;
}

.import-actions {
	margin-top: 12px;
	justify-content: flex-start;
}

.import-actions button:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}
</style>
