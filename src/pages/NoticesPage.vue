<template>
	<section class="panel">
		<div class="panel-head">
			<h2>通知中心</h2>
			<span>{{ workspace.noticeConfigs.length }} 个配置 / {{ workspace.noticeRecords.length }} 条记录</span>
		</div>

		<div class="permission-grid">
			<div ref="noticeConfigEditor" class="permission-card span-2">
				<div class="panel-head compact">
					<h3>通知配置</h3>
					<span>{{ workspace.editingNoticeConfigId ? '编辑中' : '新增' }}，新小区会自动生成默认模板</span>
				</div>
				<div class="form-grid">
					<label class="field">
						<span>场景</span>
						<select v-model="workspace.noticeConfigForm.scene">
							<option v-for="item in sceneOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
						</select>
					</label>
					<label class="field">
						<span>渠道</span>
						<select v-model="workspace.noticeConfigForm.channel">
							<option value="dingtalk">钉钉机器人</option>
							<option value="sms">短信</option>
							<option value="wechat">小程序订阅消息</option>
							<option value="system">站内通知</option>
						</select>
					</label>
					<label class="field span-2">
						<span>模板名称</span>
						<input v-model="workspace.noticeConfigForm.templateName" type="text" placeholder="模板名称" />
					</label>
					<label class="field span-2">
						<span>默认通知对象</span>
						<select v-model="workspace.noticeConfigForm.defaultStaffId">
							<option value="">未指定则按业务处理人</option>
							<option v-for="staff in activeNoticeStaff" :key="staff.id" :value="staff.id">{{ staff.name }}{{ staff.mobile ? ` / ${staff.mobile}` : '' }}{{ staff.onDuty ? ' · 在岗' : ' · 离岗' }}</option>
						</select>
					</label>
					<label class="field span-2">
						<span>机器人名称</span>
						<input v-model="workspace.noticeConfigForm.robotName" type="text" placeholder="按小区配置替换机器人名称、地址和指定对象" />
					</label>
					<label class="field span-2">
						<span>Webhook</span>
						<input v-model="workspace.noticeConfigForm.webhookUrl" type="text" placeholder="钉钉机器人地址" />
					</label>
					<label class="field span-2">
						<span>Secret</span>
						<input v-model="workspace.noticeConfigForm.secret" type="text" placeholder="加签密钥，编辑时可留空保留原值" />
					</label>
					<label class="field">
						<span>重试次数</span>
						<input v-model.number="workspace.noticeConfigForm.retryLimit" type="number" min="1" step="1" />
					</label>
					<label class="field checkbox-field">
						<input v-model="workspace.noticeConfigForm.alarmEnabled" :true-value="1" :false-value="0" type="checkbox" />
						<span>失败告警</span>
					</label>
					<label class="field checkbox-field">
						<input v-model="workspace.noticeConfigForm.enabled" :true-value="1" :false-value="0" type="checkbox" />
						<span>启用</span>
					</label>
				</div>
				<div class="form-actions">
					<button class="primary" :disabled="!workspace.canAction('notice:publish')" @click="workspace.saveNoticeConfig">{{ workspace.editingNoticeConfigId ? '保存配置' : '新增配置' }}</button>
					<button @click="workspace.resetNoticeConfigForm">重置</button>
				</div>
			</div>

			<div class="permission-card">
				<div class="panel-head compact">
					<h3>手动发送</h3>
					<span>通知发送测试 / 手动发送</span>
				</div>
				<div class="form-grid">
					<label class="field">
						<span>场景</span>
						<select v-model="workspace.noticeSendForm.scene">
							<option v-for="item in sceneOptions" :key="`send-${item.value}`" :value="item.value">{{ item.label }}</option>
						</select>
					</label>
					<label class="field">
						<span>渠道</span>
						<select v-model="workspace.noticeSendForm.channel">
							<option value="system">站内通知</option>
							<option value="dingtalk">钉钉机器人</option>
							<option value="sms">短信</option>
						</select>
					</label>
					<label class="field">
						<span>目标类型</span>
						<input v-model="workspace.noticeSendForm.targetType" type="text" placeholder="bill / repair / manual" />
					</label>
					<label class="field">
						<span>目标ID</span>
						<input v-model="workspace.noticeSendForm.targetId" type="text" placeholder="0" />
					</label>
					<label class="field span-2">
						<span>通知对象</span>
						<select v-model="workspace.noticeSendForm.targetStaffId">
							<option value="">选择物业人员</option>
							<option v-for="staff in activeNoticeStaff" :key="staff.id" :value="staff.id">{{ staff.name }}{{ staff.mobile ? ` / ${staff.mobile}` : '' }}{{ staff.onDuty ? ' · 在岗' : ' · 离岗' }}</option>
						</select>
					</label>
					<label class="field span-2">
						<span>标题</span>
						<input v-model="workspace.noticeSendForm.title" type="text" placeholder="通知标题" />
					</label>
					<label class="field span-2">
						<span>内容</span>
						<textarea v-model="workspace.noticeSendForm.content" rows="4" placeholder="通知内容"></textarea>
					</label>
				</div>
				<div class="form-actions">
					<button class="primary" :disabled="!workspace.canAction('notice:publish')" @click="workspace.sendNotice">发送</button>
				</div>
			</div>
		</div>

		<div class="spaced-block">
			<div class="panel-head compact">
				<h3>通知配置列表</h3>
				<button type="button" @click="showConfigList = !showConfigList">{{ showConfigList ? '收起列表' : '展开列表' }}</button>
			</div>
			<table v-show="showConfigList" class="spaced-table">
				<thead>
					<tr>
						<th>场景</th>
						<th>渠道</th>
						<th>模板</th>
						<th>机器人</th>
						<th>默认对象</th>
						<th>Webhook</th>
						<th>重试</th>
						<th>状态</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in workspace.noticeConfigs" :key="item.id" class="clickable-row" @click="selectedConfig = item">
						<td>{{ sceneLabel(item.scene) }}</td>
						<td>{{ channelLabel(item.channel) }}</td>
						<td>{{ item.templateName }}</td>
						<td>{{ item.robotName || '未配置' }}</td>
						<td>{{ item.defaultStaffName || '未指定' }}</td>
						<td>{{ item.webhookUrl ? '已配置' : '未配置' }}</td>
						<td>{{ item.retryLimit }}</td>
						<td><span class="status" :class="item.enabled ? 'approved' : 'disabled'">{{ item.enabled ? '启用' : '停用' }}</span></td>
						<td class="actions">
							<button :disabled="!workspace.canAction('notice:publish')" @click.stop="handleEditNoticeConfig(item)">编辑</button>
							<button v-if="workspace.canShowDeleteButton" class="danger" :disabled="!workspace.canAction('notice:publish')" @click.stop="deleteNoticeConfig(item)">删除</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="spaced-block">
			<div class="panel-head compact">
				<h3>发送记录列表</h3>
				<button type="button" @click="showRecordList = !showRecordList">{{ showRecordList ? '收起列表' : '展开列表' }}</button>
			</div>
			<table v-show="showRecordList" class="spaced-table">
				<thead>
					<tr>
						<th>时间</th>
						<th>场景</th>
						<th>标题</th>
						<th>通知对象</th>
						<th>渠道</th>
						<th>状态</th>
						<th>重试</th>
						<th>错误</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="item in workspace.noticeRecords" :key="item.id" class="clickable-row" @click="selectedRecord = item">
						<td>{{ item.createdAt || item.sentAt || '-' }}</td>
						<td>{{ sceneLabel(item.eventType) }}</td>
						<td>{{ item.title }}</td>
						<td>{{ item.targetStaffName || '-' }}</td>
						<td>{{ channelLabel(item.channel) }}</td>
						<td><span class="status" :class="item.status === 'sent' ? 'approved' : item.status === 'pending' ? 'pending' : 'rejected'">{{ workspace.noticeStatusText(item.status) }}</span></td>
						<td>{{ item.retryCount }}</td>
						<td>{{ item.errorMessage || '-' }}</td>
						<td class="actions">
							<button :disabled="!workspace.canAction('notice:publish')" @click.stop="workspace.retryNotice(item)">重试</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<DetailCard v-if="selectedConfig" title="配置详情" :subtitle="sceneLabel(selectedConfig.scene)">
			<template #actions>
				<button type="button" @click="selectedConfig = null">收起</button>
			</template>
			<div class="detail-grid">
				<div><strong>场景</strong><p>{{ sceneLabel(selectedConfig.scene) }}</p></div>
				<div><strong>渠道</strong><p>{{ channelLabel(selectedConfig.channel) }}</p></div>
				<div><strong>模板</strong><p>{{ selectedConfig.templateName || '-' }}</p></div>
				<div><strong>机器人</strong><p>{{ selectedConfig.robotName || '-' }}</p></div>
				<div><strong>默认通知对象</strong><p>{{ selectedConfig.defaultStaffName || '-' }}{{ selectedConfig.defaultStaffMobile ? ` / ${selectedConfig.defaultStaffMobile}` : '' }}</p></div>
				<div><strong>Webhook</strong><p>{{ selectedConfig.webhookUrl || '-' }}</p></div>
				<div><strong>状态</strong><p>{{ selectedConfig.enabled ? '启用' : '停用' }}</p></div>
			</div>
		</DetailCard>

		<DetailCard v-if="selectedRecord" title="发送详情" :subtitle="selectedRecord.title">
			<template #actions>
				<button type="button" @click="selectedRecord = null">收起</button>
			</template>
			<div class="detail-grid">
				<div><strong>场景</strong><p>{{ sceneLabel(selectedRecord.eventType) }}</p></div>
				<div><strong>渠道</strong><p>{{ channelLabel(selectedRecord.channel) }}</p></div>
				<div><strong>状态</strong><p>{{ workspace.noticeStatusText(selectedRecord.status) }}</p></div>
				<div><strong>通知对象</strong><p>{{ selectedRecord.targetStaffName || '-' }}{{ selectedRecord.targetStaffMobile ? ` / ${selectedRecord.targetStaffMobile}` : '' }}</p></div>
				<div><strong>重试</strong><p>{{ selectedRecord.retryCount }}</p></div>
				<div><strong>错误</strong><p>{{ selectedRecord.errorMessage || '无错误信息' }}</p></div>
				<div><strong>内容</strong><p>{{ selectedRecord.content || '-' }}</p></div>
			</div>
		</DetailCard>
	</section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const selectedConfig = ref(null);
const selectedRecord = ref(null);
const noticeConfigEditor = ref(null);
const showConfigList = ref(true);
const showRecordList = ref(true);
const activeNoticeStaff = computed(() => workspace.propertyStaff.filter((item) =>
	item.active && (!item.moduleKeys || String(item.moduleKeys).includes('notices') || String(item.moduleKeys).includes('notice'))
));

const sceneOptions = [
	{ value: 'bill_created', label: '新账单生成' },
	{ value: 'bill_paid', label: '支付成功' },
	{ value: 'bill_remind', label: '账单催缴' },
	{ value: 'repair_created', label: '新报修提交' },
	{ value: 'repair_status', label: '工单状态变化' },
	{ value: 'repair_remind', label: '工单催单' },
	{ value: 'complaint_created', label: '新投诉/建议' },
	{ value: 'service_created', label: '物业服务申请' },
	{ value: 'customer_ticket_created', label: '转人工客服' },
	{ value: 'mall_order_created', label: '商城新订单' },
	{ value: 'mall_order_paid', label: '商城支付成功' },
	{ value: 'mall_refund_processed', label: '商城异常订单' },
	{ value: 'activity_joined', label: '活动报名成功' },
	{ value: 'notification_alarm', label: '失败告警' },
	{ value: 'manual', label: '手动通知' }
];

function sceneLabel(value) {
	const matched = sceneOptions.find((item) => item.value === value);
	return matched ? matched.label : value || '-';
}

function channelLabel(value) {
	return {
		dingtalk: '钉钉机器人',
		sms: '短信',
		wechat: '小程序订阅消息',
		system: '站内通知'
	}[value] || value || '-';
}

async function handleEditNoticeConfig(item) {
	selectedConfig.value = item;
	workspace.editNoticeConfig(item);
	await nextTick();
	if (noticeConfigEditor.value && typeof noticeConfigEditor.value.scrollIntoView === 'function') {
		noticeConfigEditor.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
	window.alert('已载入通知配置到编辑区');
}

async function deleteNoticeConfig(item) {
	await workspace.removeNoticeConfig(item);
	if (selectedConfig.value && String(selectedConfig.value.id) === String(item.id)) {
		selectedConfig.value = null;
	}
}
</script>
