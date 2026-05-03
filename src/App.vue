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
			<nav v-if="workspace.isLoggedIn" class="nav">
				<button
					v-for="item in workspace.visibleRoutes"
					:key="item.key"
					:class="{ active: workspace.activeRoute === item.key }"
					@click="workspace.navigate(item.key)"
				>
					{{ item.label }}
				</button>
			</nav>
		</aside>

		<main v-if="workspace.isLoggedIn" class="main">
			<header class="topbar">
				<div class="title-group">
					<h1>{{ workspace.pageTitle }}</h1>
					<p>{{ workspace.activeCommunity ? workspace.communityLabel(workspace.activeCommunity) : 'CloudBase MySQL 公告与业务管理' }}</p>
				</div>
				<div class="toolbar">
					<div v-if="workspace.currentAdminInfo" class="admin-badge">
						<span>当前管理员</span>
						<strong>{{ workspace.currentAdminInfo.username }} · {{ workspace.currentAdminInfo.roleLabel }}</strong>
					</div>
					<label class="schema-switch">
						<span>当前小区</span>
						<select v-model="workspace.selectedSchema" @change="workspace.onSchemaChange">
							<option value="">请选择</option>
							<option v-for="item in workspace.activeCommunities" :key="item.schemaName || item.code" :value="item.schemaName">
								{{ workspace.communityLabel(item) }}
							</option>
						</select>
					</label>
					<button @click="workspace.logoutAdmin">退出</button>
					<button class="primary" @click="workspace.reload">刷新</button>
				</div>
			</header>

			<component :is="currentPageComponent" />
		</main>

		<main v-else class="main login-main">
			<LoginPage />
		</main>
	</div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import DashboardPage from './pages/DashboardPage.vue';
import CommunitiesPage from './pages/CommunitiesPage.vue';
import ActivitiesPage from './pages/ActivitiesPage.vue';
import AnnouncementsPage from './pages/AnnouncementsPage.vue';
import FaqPage from './pages/FaqPage.vue';
import FeesPage from './pages/FeesPage.vue';
import LoginPage from './pages/LoginPage.vue';
import NoticesPage from './pages/NoticesPage.vue';
import OperationsPage from './pages/OperationsPage.vue';
import PermissionsPage from './pages/PermissionsPage.vue';
import RepairsPage from './pages/RepairsPage.vue';
import ResidentsPage from './pages/ResidentsPage.vue';
import StaffPage from './pages/StaffPage.vue';
import { useAdminWorkspaceStore } from './stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();

const pageMap = {
	dashboard: DashboardPage,
	owners: ResidentsPage,
	communities: CommunitiesPage,
	permissions: PermissionsPage,
	staff: StaffPage,
	repairs: RepairsPage,
	fees: FeesPage,
	complaints: OperationsPage,
	property_service: OperationsPage,
	customer_service: OperationsPage,
	announcements: AnnouncementsPage,
	activities: ActivitiesPage,
	faq: FaqPage,
	notices: NoticesPage,
	login: LoginPage
};

const currentPageComponent = computed(() => pageMap[workspace.activeRoute] || DashboardPage);

onMounted(async () => {
	workspace.start();
	if (workspace.isLoggedIn) {
		await workspace.reload();
	}
});
</script>
