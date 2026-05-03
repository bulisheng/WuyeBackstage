<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>盛兴严选商城</h2>
				<p>管理当前小区商品、订单、售后和基础经营指标。</p>
			</div>
			<button class="primary" type="button" @click="reload">刷新</button>
		</div>

		<section class="panel-grid">
			<article class="metric"><span>今日成交额</span><strong>{{ money(dashboard.todayAmount) }}</strong></article>
			<article class="metric"><span>今日订单</span><strong>{{ dashboard.todayOrderCount || 0 }}</strong></article>
			<article class="metric"><span>待发货</span><strong>{{ dashboard.statusCounts?.paid || 0 }}</strong></article>
			<article class="metric"><span>售后中</span><strong>{{ dashboard.statusCounts?.refund_pending || 0 }}</strong></article>
		</section>

		<div class="tabs">
			<button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">商品管理</button>
			<button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">订单管理</button>
			<button :class="{ active: activeTab === 'afterSales' }" @click="activeTab = 'afterSales'">售后处理</button>
		</div>

		<section v-if="activeTab === 'products'" class="stack">
			<div class="form-grid">
				<label><span>商品名称</span><input v-model="productForm.title" placeholder="例如：社区优选大米" /></label>
				<label><span>分类</span><select v-model.number="productForm.categoryId"><option :value="0">未分类</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
				<label><span>价格</span><input v-model.number="productForm.price" type="number" min="0" /></label>
				<label><span>库存</span><input v-model.number="productForm.stock" type="number" min="0" /></label>
				<label><span>状态</span><select v-model="productForm.status"><option value="on_sale">上架</option><option value="draft">草稿</option><option value="off_sale">下架</option></select></label>
				<label><span>排序</span><input v-model.number="productForm.sort" type="number" /></label>
				<label class="full"><span>封面图 URL</span><input v-model="productForm.coverUrl" placeholder="https://..." /></label>
				<label class="full"><span>摘要</span><input v-model="productForm.subtitle" placeholder="商品卖点" /></label>
				<label class="full"><span>详情</span><textarea v-model="productForm.description" rows="4" placeholder="商品详情"></textarea></label>
			</div>
			<div class="form-actions">
				<button class="primary" type="button" @click="saveProduct">保存商品</button>
				<button type="button" @click="resetProduct">重置</button>
				<button type="button" @click="saveDefaultCategory">快速创建默认分类</button>
			</div>

			<div class="table-card">
				<table>
					<thead><tr><th>商品</th><th>价格</th><th>库存</th><th>销量</th><th>状态</th><th>操作</th></tr></thead>
					<tbody>
						<tr v-for="item in products" :key="item.id">
							<td>{{ item.title }}<br /><small>{{ item.categoryName || '未分类' }}</small></td>
							<td>{{ money(item.price) }}</td>
							<td>{{ item.stock }}</td>
							<td>{{ item.sales }}</td>
							<td>{{ productStatusText(item.status) }}</td>
							<td class="actions">
								<button @click="editProduct(item)">编辑</button>
								<button @click="setProductStatus(item, item.status === 'on_sale' ? 'off_sale' : 'on_sale')">{{ item.status === 'on_sale' ? '下架' : '上架' }}</button>
							</td>
						</tr>
						<tr v-if="!products.length"><td colspan="6" class="empty-cell">暂无商品。</td></tr>
					</tbody>
				</table>
			</div>
		</section>

		<section v-else-if="activeTab === 'orders'" class="table-card">
			<table>
				<thead><tr><th>订单</th><th>住户</th><th>金额</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in orders" :key="item.id" :class="{ selected: selectedOrder?.order?.id === item.id }">
						<td>{{ item.orderNo }}</td>
						<td>{{ item.contact || item.ownerMobile }}<br /><small>{{ item.house || item.address }}</small></td>
						<td>{{ money(item.payAmount) }}</td>
						<td>{{ item.statusText }}</td>
						<td>{{ item.createdAt }}</td>
						<td class="actions">
							<button @click="loadOrder(item)">详情</button>
							<button :disabled="!['paid','pending_ship'].includes(item.status)" @click="orderAction(item, 'ship')">发货</button>
							<button :disabled="item.status === 'cancelled'" @click="orderAction(item, 'cancel')">关闭</button>
						</td>
					</tr>
					<tr v-if="!orders.length"><td colspan="6" class="empty-cell">暂无订单。</td></tr>
				</tbody>
			</table>
			<div v-if="selectedOrder" class="detail-card">
				<div class="panel-head compact">
					<h3>订单详情 {{ selectedOrder.order.orderNo }}</h3>
					<button @click="selectedOrder = null">收起</button>
				</div>
				<div v-for="item in selectedOrder.items" :key="item.id" class="todo-row">
					<strong>{{ item.productTitle }} / {{ item.skuName || '默认规格' }}</strong>
					<span>{{ item.quantity }} 件 / {{ money(item.totalAmount) }}</span>
				</div>
				<div v-for="item in selectedOrder.logs" :key="item.id" class="todo-row">
					<strong>{{ item.content || item.action }}</strong>
					<span>{{ item.createdAt }}</span>
				</div>
			</div>
		</section>

		<section v-else class="table-card">
			<table>
				<thead><tr><th>订单</th><th>住户</th><th>原因</th><th>金额</th><th>状态</th><th>操作</th></tr></thead>
				<tbody>
					<tr v-for="item in afterSales" :key="item.id">
						<td>{{ item.orderId }}</td>
						<td>{{ item.ownerMobile }}</td>
						<td>{{ item.reason || '-' }}</td>
						<td>{{ money(item.refundAmount) }}</td>
						<td>{{ item.statusText }}</td>
						<td class="actions">
							<button @click="afterSaleAction(item, 'approved')">同意</button>
							<button @click="afterSaleAction(item, 'rejected')">拒绝</button>
							<button @click="afterSaleAction(item, 'refunded')">标记退款</button>
						</td>
					</tr>
					<tr v-if="!afterSales.length"><td colspan="6" class="empty-cell">暂无售后。</td></tr>
				</tbody>
			</table>
		</section>
	</section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { adminApi } from '../api/admin.js';
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
const activeTab = ref('products');
const dashboard = ref({ statusCounts: {} });
const categories = ref([]);
const products = ref([]);
const orders = ref([]);
const afterSales = ref([]);
const selectedOrder = ref(null);
const productForm = ref(emptyProduct());

function emptyProduct() {
	return { id: '', title: '', subtitle: '', categoryId: 0, coverUrl: '', price: 0, stock: 0, status: 'on_sale', description: '', sort: 100 };
}

function money(value) {
	return `¥${Number(value || 0).toFixed(2)}`;
}

function productStatusText(status) {
	return { draft: '草稿', on_sale: '上架', off_sale: '下架' }[status] || status;
}

async function reload() {
	const [dashboardRes, categoryRes, productRes, orderRes, afterSaleRes] = await Promise.all([
		adminApi.mallDashboard().catch(() => ({ statusCounts: {} })),
		adminApi.mallCategoryList(),
		adminApi.mallProductList(),
		adminApi.mallOrderList(),
		adminApi.mallAfterSaleList()
	]);
	dashboard.value = dashboardRes || { statusCounts: {} };
	categories.value = categoryRes.list || [];
	products.value = productRes.list || [];
	orders.value = orderRes.list || [];
	afterSales.value = afterSaleRes.list || [];
}

function resetProduct() {
	productForm.value = emptyProduct();
}

function editProduct(item) {
	productForm.value = {
		id: item.id,
		title: item.title,
		subtitle: item.subtitle,
		categoryId: item.categoryId || 0,
		coverUrl: item.coverUrl,
		price: item.price,
		stock: item.stock,
		status: item.status,
		description: item.description,
		sort: item.sort || 100
	};
}

async function saveProduct() {
	await adminApi.mallProductSave(productForm.value);
	resetProduct();
	await reload();
}

async function saveDefaultCategory() {
	await adminApi.mallCategorySave({ name: '社区严选', sort: 1, enabled: 1 });
	await reload();
}

async function setProductStatus(item, status) {
	await adminApi.mallProductStatus({ id: item.id, status });
	await reload();
}

async function loadOrder(item) {
	selectedOrder.value = await adminApi.mallOrderDetail(item.id);
}

async function orderAction(item, action) {
	await adminApi.mallOrderAction({ id: item.id, action });
	await reload();
	if (selectedOrder.value?.order?.id === item.id) {
		selectedOrder.value = await adminApi.mallOrderDetail(item.id);
	}
}

async function afterSaleAction(item, status) {
	await adminApi.mallAfterSaleAction({ id: item.id, status, reply: status === 'rejected' ? '售后申请已拒绝' : '售后状态已更新' });
	await reload();
}

onMounted(reload);
watch(() => workspace.selectedSchema, async () => {
	selectedOrder.value = null;
	resetProduct();
	await reload();
});
</script>
