<template>
	<div class="layout">
		<aside class="sidebar">
			<div class="brand">
				<div class="brand-mark">SX</div>
				<div>
					<div class="brand-title">盛兴物业</div>
					<div class="brand-subtitle">管理后台</div>
				</div>
			</div>
			<nav class="nav">
				<button :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">数据看板</button>
				<button :class="{ active: activeTab === 'owners' }" @click="activeTab = 'owners'">业主认证审核</button>
				<button :class="{ active: activeTab === 'announcements' }" @click="activeTab = 'announcements'">公告管理</button>
				<button :class="{ active: activeTab === 'repairs' }" @click="activeTab = 'repairs'">报修管理</button>
				<button :class="{ active: activeTab === 'fees' }" @click="activeTab = 'fees'">缴费管理</button>
				<button :class="{ active: activeTab === 'complaints' }" @click="activeTab = 'complaints'">投诉建议</button>
				<button :class="{ active: activeTab === 'notices' }" @click="activeTab = 'notices'">通知配置</button>
				<button :class="{ active: activeTab === 'communities' }" @click="activeTab = 'communities'">小区配置</button>
			</nav>
		</aside>

		<main class="main">
			<header class="topbar">
			<div class="title-group">
				<h1>{{ pageTitle }}</h1>
					<p>{{ activeCommunity ? communityLabel(activeCommunity) : 'CloudBase MySQL 公告与业务管理' }}</p>
			</div>
				<div class="toolbar">
					<label class="schema-switch">
						<span>当前小区</span>
						<select v-model="selectedSchema" @change="onSchemaChange">
							<option value="">请选择</option>
							<option v-for="item in communities" :key="item.schemaName || item.code" :value="item.schemaName">
								{{ communityLabel(item) }}
							</option>
						</select>
					</label>
					<button class="primary" @click="reload">刷新</button>
				</div>
			</header>

			<section v-if="activeTab === 'dashboard'" class="panel-grid">
				<article v-for="item in stats" :key="item.label" class="metric">
					<span>{{ item.label }}</span>
					<strong>{{ item.value }}</strong>
				</article>
			</section>

			<section v-if="activeTab === 'owners'" class="panel">
				<div class="panel-head">
					<h2>业主认证审核</h2>
					<span>{{ pendingCount }} 条待处理</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>姓名</th>
							<th>手机号</th>
							<th>小区</th>
							<th>房屋</th>
							<th>状态</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="owner in owners" :key="owner.id">
							<td>{{ owner.name }}</td>
							<td>{{ owner.mobile }}</td>
							<td>{{ owner.communityName }}</td>
							<td>{{ owner.house }}</td>
							<td><span class="status" :class="owner.auditStatus">{{ statusText(owner.auditStatus) }}</span></td>
							<td class="actions">
								<button @click="audit(owner, 'approved')">通过</button>
								<button @click="audit(owner, 'rejected')">驳回</button>
							</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="activeTab === 'announcements'" class="panel announcement-panel">
				<div class="panel-head">
					<h2>公告管理</h2>
					<span>{{ announcements.length }} 条公告</span>
				</div>
				<div class="announcement-editor">
					<div class="form-grid">
						<label class="field span-2">
							<span>标题</span>
							<input v-model="announcementForm.title" type="text" placeholder="输入公告标题" />
						</label>
						<label class="field span-2">
							<span>摘要</span>
							<input v-model="announcementForm.summary" type="text" placeholder="输入公告摘要" />
						</label>
						<label class="field span-2">
							<span>封面地址</span>
							<input v-model="announcementForm.coverUrl" type="text" placeholder="可选，后续用于首页 Banner" />
						</label>
						<label class="field">
							<span>状态</span>
							<select v-model="announcementForm.status">
								<option value="published">发布</option>
								<option value="draft">草稿</option>
								<option value="archived">归档</option>
							</select>
						</label>
						<label class="field">
							<span>排序</span>
							<input v-model.number="announcementForm.sort" type="number" min="0" step="1" />
						</label>
						<label class="field checkbox-field">
							<input v-model="announcementForm.isPinned" type="checkbox" />
							<span>置顶</span>
						</label>
						<label class="field span-2">
							<span>正文</span>
							<textarea v-model="announcementForm.content" rows="6" placeholder="输入公告正文"></textarea>
						</label>
					</div>
					<div class="form-actions">
						<button class="primary" @click="saveAnnouncement">{{ editingAnnouncementId ? '保存修改' : '发布公告' }}</button>
						<button @click="resetAnnouncementForm">重置</button>
					</div>
				</div>
				<table>
					<thead>
						<tr>
							<th>标题</th>
							<th>摘要</th>
							<th>状态</th>
							<th>置顶</th>
							<th>排序</th>
							<th>发布时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in announcements" :key="item.id">
							<td>
								<div class="announcement-title-cell">
									<strong>{{ item.title }}</strong>
									<span>{{ item.coverUrl ? '已配置封面' : '未配置封面' }}</span>
								</div>
							</td>
							<td>{{ item.summary || item.content || '暂无摘要' }}</td>
							<td><span class="status" :class="item.status">{{ announcementStatusText(item.status) }}</span></td>
							<td>{{ item.isPinned ? '是' : '否' }}</td>
							<td>{{ item.sort }}</td>
							<td>{{ item.dateLabel || '-' }}</td>
							<td class="actions">
								<button @click="editAnnouncement(item)">编辑</button>
								<button class="danger" @click="removeAnnouncement(item)">删除</button>
							</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="activeTab === 'communities'" class="panel">
				<div class="panel-head">
					<h2>小区配置</h2>
					<span>后续接新增、编辑、停用</span>
				</div>
				<div class="community-list">
					<div v-for="item in communities" :key="item.id" class="community-row">
						<div>
							<strong>{{ item.name }}</strong>
							<span>{{ item.code }}</span>
						</div>
						<span class="status approved">{{ item.active ? '启用' : '停用' }}</span>
					</div>
				</div>
			</section>

			<section v-if="activeTab === 'repairs'" class="panel">
				<div class="panel-head">
					<h2>报修管理</h2>
					<span>{{ repairs.length }} 条工单</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>标题</th>
							<th>类型</th>
							<th>联系人</th>
							<th>电话</th>
							<th>状态</th>
							<th>处理人</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in repairs" :key="item.id">
							<td>{{ item.title }}</td>
							<td>{{ item.type }}</td>
							<td>{{ item.contact }}</td>
							<td>{{ item.phone }}</td>
							<td><span class="status" :class="item.status">{{ workStatusText(item.status) }}</span></td>
							<td>{{ item.assignee || '未分配' }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="activeTab === 'fees'" class="panel">
				<div class="panel-head">
					<h2>缴费管理</h2>
					<span>{{ fees.length }} 条账单</span>
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
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in fees" :key="item.id">
							<td>{{ item.billNo }}</td>
							<td>{{ item.ownerName }}</td>
							<td>{{ item.house }}</td>
							<td>{{ item.billType }}</td>
							<td>{{ money(item.amount) }}</td>
							<td><span class="status" :class="item.status">{{ feeStatusText(item.status) }}</span></td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="activeTab === 'complaints'" class="panel">
				<div class="panel-head">
					<h2>投诉建议</h2>
					<span>{{ complaints.length }} 条记录</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>标题</th>
							<th>联系人</th>
							<th>电话</th>
							<th>状态</th>
							<th>处理人</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in complaints" :key="item.id">
							<td>{{ item.title }}</td>
							<td>{{ item.contact }}</td>
							<td>{{ item.phone }}</td>
							<td><span class="status" :class="item.status">{{ workStatusText(item.status) }}</span></td>
							<td>{{ item.assignee || '未分配' }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="activeTab === 'notices'" class="panel">
				<div class="panel-head">
					<h2>通知配置</h2>
					<span>{{ noticeConfigs.length }} 个场景</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>场景</th>
							<th>渠道</th>
							<th>模板</th>
							<th>机器人</th>
							<th>状态</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="item in noticeConfigs" :key="item.id">
							<td>{{ item.scene }}</td>
							<td>{{ item.channel }}</td>
							<td>{{ item.templateName }}</td>
							<td>{{ item.robotName || '未配置' }}</td>
							<td><span class="status" :class="item.enabled ? 'approved' : 'disabled'">{{ item.enabled ? '启用' : '停用' }}</span></td>
						</tr>
					</tbody>
				</table>
			</section>
		</main>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { adminApi } from './api/admin.js';

const activeTab = ref('dashboard');
const stats = ref([]);
const owners = ref([]);
const communities = ref([]);
const announcements = ref([]);
const repairs = ref([]);
const fees = ref([]);
const complaints = ref([]);
const noticeConfigs = ref([]);
const editingAnnouncementId = ref('');
const announcementForm = ref(emptyAnnouncement());
const selectedSchema = ref(adminApi.getSchemaName());

const pageTitle = computed(() => {
	if (activeTab.value === 'owners') return '业主认证审核';
	if (activeTab.value === 'announcements') return '公告管理';
	if (activeTab.value === 'repairs') return '报修管理';
	if (activeTab.value === 'fees') return '缴费管理';
	if (activeTab.value === 'complaints') return '投诉建议';
	if (activeTab.value === 'notices') return '通知配置';
	if (activeTab.value === 'communities') return '小区配置';
	return '数据看板';
});

const pendingCount = computed(() => owners.value.filter((item) => item.auditStatus === 'pending').length);

const activeCommunity = computed(() => communities.value.find((item) => item.schemaName === selectedSchema.value) || null);

function statusText(status) {
	return {
		pending: '待审核',
		approved: '已通过',
		rejected: '已驳回',
		disabled: '已禁用'
	}[status] || status;
}

function workStatusText(status) {
	return {
		pending: '待处理',
		assigned: '已派单',
		processing: '处理中',
		completed: '已完成',
		closed: '已关闭'
	}[status] || status;
}

function feeStatusText(status) {
	return {
		unpaid: '待缴',
		paid: '已缴',
		overdue: '逾期',
		void: '已作废'
	}[status] || status;
}

function money(value) {
	return `￥${Number(value || 0).toFixed(2)}`;
}

function emptyAnnouncement() {
	return {
		title: '',
		summary: '',
		content: '',
		coverUrl: '',
		status: 'published',
		isPinned: true,
		sort: 0
	};
}

function communityLabel(item) {
	return `${item.name}${item.schemaName ? ` · ${item.schemaName}` : ''}`;
}

function announcementStatusText(status) {
	return {
		draft: '草稿',
		published: '发布',
		archived: '归档'
	}[status] || status;
}

async function loadCommunities() {
	const communityData = await adminApi.communityList();
	communities.value = communityData.list || [];
	const hasSelected = communities.value.some((item) => item.schemaName === selectedSchema.value);
	if (!hasSelected) {
		selectedSchema.value = communities.value.find((item) => item.active)?.schemaName
			|| communities.value[0]?.schemaName
			|| '';
	}
	adminApi.setSchemaName(selectedSchema.value);
}

function resetAnnouncementForm() {
	editingAnnouncementId.value = '';
	announcementForm.value = emptyAnnouncement();
}

function editAnnouncement(item) {
	editingAnnouncementId.value = String(item.id || '');
	announcementForm.value = {
		title: item.title || '',
		summary: item.summary || '',
		content: item.content || '',
		coverUrl: item.coverUrl || '',
		status: item.status || 'published',
		isPinned: Boolean(item.isPinned),
		sort: Number(item.sort || 0)
	};
	activeTab.value = 'announcements';
}

async function saveAnnouncement() {
	try {
		const payload = {
			id: editingAnnouncementId.value || undefined,
			title: announcementForm.value.title,
			summary: announcementForm.value.summary,
			content: announcementForm.value.content,
			coverUrl: announcementForm.value.coverUrl,
			status: announcementForm.value.status,
			isPinned: announcementForm.value.isPinned,
			sort: announcementForm.value.sort
		};
		const result = await adminApi.saveAnnouncement(payload);
		announcements.value = result.list || announcements.value;
		resetAnnouncementForm();
	} catch (err) {
		window.alert(err.message || '保存失败');
	}
}

async function removeAnnouncement(item) {
	const confirmed = window.confirm(`确认删除公告「${item.title}」？`);
	if (!confirmed) return;
	try {
		await adminApi.deleteAnnouncement(item.id);
		await reload();
	} catch (err) {
		window.alert(err.message || '删除失败');
	}
}

async function reload() {
	await loadCommunities();
	if (!selectedSchema.value) {
		stats.value = [];
		owners.value = [];
		announcements.value = [];
		repairs.value = [];
		fees.value = [];
		complaints.value = [];
		noticeConfigs.value = [];
		return;
	}
	adminApi.setSchemaName(selectedSchema.value);
	const [dashboard, ownerData, announcementData, repairData, feeData, complaintData, noticeData] = await Promise.all([
		adminApi.dashboard(),
		adminApi.ownerList(),
		adminApi.announcementList(),
		adminApi.repairList(),
		adminApi.feeList(),
		adminApi.complaintList(),
		adminApi.noticeConfigList()
	]);
	stats.value = dashboard.stats || [];
	owners.value = ownerData.list || [];
	announcements.value = announcementData.list || [];
	repairs.value = repairData.list || [];
	fees.value = feeData.list || [];
	complaints.value = complaintData.list || [];
	noticeConfigs.value = noticeData.list || [];
}

async function onSchemaChange() {
	adminApi.setSchemaName(selectedSchema.value);
	await reload();
}

async function audit(owner, auditStatus) {
	await adminApi.auditOwner(owner.id, auditStatus);
	owner.auditStatus = auditStatus;
}

onMounted(reload);
</script>
