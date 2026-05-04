<template>
	<section class="page-section">
		<div class="panel-head">
			<div>
				<h2>盛兴严选商城</h2>
				<p>管理当前小区商品、订单、售后和基础经营指标。</p>
			</div>
			<button class="primary" type="button" @click="reload">重新加载</button>
		</div>

		<section class="panel-grid">
			<article v-for="item in mallVisuals" :key="item.key" class="metric visual-metric">
				<span>{{ item.label }}</span>
				<strong>{{ item.value }}</strong>
				<div class="visual-bar compact"><i :style="{ width: item.percent + '%' }"></i></div>
				<small>{{ item.desc }}</small>
			</article>
		</section>

		<div class="tabs">
			<button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">商品管理</button>
			<button :class="{ active: activeTab === 'orders' }" @click="activeTab = 'orders'">订单管理</button>
			<button :class="{ active: activeTab === 'afterSales' }" @click="activeTab = 'afterSales'">售后处理</button>
		</div>

		<section v-if="activeTab === 'products'" class="stack">
			<DetailCard title="商品分类" :subtitle="`${categories.length} 个分类`">
				<div class="form-grid">
					<label><span>分类名称</span><input v-model="categoryForm.name" placeholder="如：社区严选" /></label>
					<label><span>排序</span><input v-model.number="categoryForm.sort" type="number" min="0" /></label>
					<label><span>状态</span><select v-model.number="categoryForm.enabled"><option :value="1">启用</option><option :value="0">停用</option></select></label>
				</div>
				<div class="form-actions">
					<button class="primary" type="button" @click="saveCategory">{{ editingCategoryId ? '保存分类' : '新增分类' }}</button>
					<button type="button" @click="resetCategory">{{ editingCategoryId ? '取消编辑' : '重置' }}</button>
				</div>
				<table>
					<thead><tr><th>分类</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
					<tbody>
						<tr v-for="item in categories" :key="item.id">
							<td>{{ item.name }}</td>
							<td>{{ item.sort || 0 }}</td>
							<td>{{ item.enabled ? '启用' : '停用' }}</td>
							<td class="actions">
								<button @click="editCategory(item)">编辑</button>
								<button class="danger" @click="deleteCategory(item)">删除</button>
							</td>
						</tr>
						<tr v-if="!categories.length"><td colspan="4" class="empty-cell">当前暂无分类。</td></tr>
					</tbody>
				</table>
			</DetailCard>
			<DetailCard title="商品编辑" subtitle="保存后会同步到商品列表">
				<div class="form-grid">
					<label><span>商品名称</span><input v-model="productForm.title" placeholder="如：社区优选大米" /></label>
					<label><span>分类</span><select v-model.number="productForm.categoryId"><option :value="0">未分类</option><option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option></select></label>
					<label><span>价格</span><input v-model.number="productForm.price" type="number" min="0" /></label>
					<label><span>库存</span><input v-model.number="productForm.stock" type="number" min="0" /></label>
					<label><span>状态</span><select v-model="productForm.status"><option value="on_sale">上架</option><option value="draft">草稿</option><option value="off_sale">下架</option></select></label>
					<label><span>排序</span><input v-model.number="productForm.sort" type="number" /></label>
					<label class="full"><span>封面图片链接</span><input v-model="productForm.coverUrl" placeholder="填写图片地址" /></label>
					<label class="full"><span>摘要</span><input v-model="productForm.subtitle" placeholder="商品卖点" /></label>
					<label class="full"><span>详情</span><textarea v-model="productForm.description" rows="4" placeholder="商品详情"></textarea></label>
				</div>
				<div class="form-actions">
					<button class="primary" type="button" @click="saveProduct">保存商品</button>
					<button type="button" @click="resetProduct">重置</button>
				<button type="button" @click="saveDefaultCategory">创建默认分类</button>
				</div>
			</DetailCard>
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
								<button class="danger" @click="deleteProduct(item)">删除</button>
							</td>
						</tr>
						<tr v-if="!products.length"><td colspan="6" class="empty-cell">当前暂无商品。</td></tr>
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
						<tr v-if="!orders.length"><td colspan="6" class="empty-cell">当前暂无订单。</td></tr>
				</tbody>
			</table>
			<DetailCard v-if="selectedOrder" title="订单详情" :subtitle="selectedOrder.order?.orderNo || ''">
				<template #actions>
					<button @click="selectedOrder = null">收起</button>
				</template>
				<div class="detail-grid">
					<div><strong>订单号</strong><p>{{ selectedOrder.order?.orderNo || '-' }}</p></div>
					<div><strong>住户</strong><p>{{ selectedOrder.order?.contact || selectedOrder.order?.ownerMobile || '-' }}</p></div>
					<div><strong>房屋</strong><p>{{ selectedOrder.order?.house || selectedOrder.order?.address || '-' }}</p></div>
					<div><strong>金额</strong><p>{{ money(selectedOrder.order?.payAmount) }}</p></div>
					<div><strong>状态</strong><p>{{ selectedOrder.order?.statusText || selectedOrder.order?.status || '-' }}</p></div>
					<div><strong>创建时间</strong><p>{{ selectedOrder.order?.createdAt || '-' }}</p></div>
					<div><strong>更新时间</strong><p>{{ selectedOrder.order?.updatedAt || '-' }}</p></div>
					<div class="wide"><strong>备注</strong><p>{{ selectedOrder.order?.note || '暂无备注' }}</p></div>
				</div>
				<div class="timeline">
					<div v-for="item in selectedOrder.items" :key="item.id" class="timeline-item">
						<strong>{{ item.productTitle }} / {{ item.skuName || '默认规格' }}</strong>
						<span>{{ item.quantity }} 件 / {{ money(item.totalAmount) }}</span>
					</div>
					<div v-for="item in selectedOrder.logs" :key="item.id" class="timeline-item">
						<strong>{{ item.content || item.action }}</strong>
						<span>{{ item.createdAt }}</span>
					</div>
				</div>
			</DetailCard>
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
						<tr v-if="!afterSales.length"><td colspan="6" class="empty-cell">当前暂无售后。</td></tr>
				</tbody>
			</table>
		</section>
	</section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import DetailCard from '../components/common/DetailCard.vue';
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
const categoryForm = ref(emptyCategory());
const editingCategoryId = ref('');
const productForm = ref(emptyProduct());

function emptyProduct() {
	return { id: '', title: '', subtitle: '', categoryId: 0, coverUrl: '', price: 0, stock: 0, status: 'on_sale', description: '', sort: 100 };
}

function emptyCategory() {
	return { name: '', sort: 100, enabled: 1 };
}

function money(value) {
	return `¥${Number(value || 0).toFixed(2)}`;
}

const mallVisuals = computed(() => [
	{
		key: 'amount',
		label: '今日成交额',
		value: money(dashboard.value.todayAmount),
		percent: Math.min(100, Number(dashboard.value.todayAmount || 0) / 1000 * 100),
		desc: '按今日支付订单统计'
	},
	{
		key: 'orders',
		label: '今日订单',
		value: dashboard.value.todayOrderCount || 0,
		percent: Math.min(100, Number(dashboard.value.todayOrderCount || 0) * 12),
		desc: '今日新增订单数量'
	},
	{
		key: 'ship',
		label: '待发货',
		value: dashboard.value.statusCounts?.paid || 0,
		percent: Math.min(100, Number(dashboard.value.statusCounts?.paid || 0) * 20),
		desc: '需要运营优先处理'
	},
	{
		key: 'afterSale',
		label: '售后中',
		value: dashboard.value.statusCounts?.refund_pending || 0,
		percent: Math.min(100, Number(dashboard.value.statusCounts?.refund_pending || 0) * 20),
		desc: '退款和售后跟进'
	}
]);

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

function resetCategory() {
	editingCategoryId.value = '';
	categoryForm.value = emptyCategory();
}

function editCategory(item) {
	editingCategoryId.value = String(item.id || '');
	categoryForm.value = {
		name: item.name || '',
		sort: item.sort || 100,
		enabled: item.enabled ? 1 : 0
	};
}

async function saveCategory() {
	const payload = {
		id: editingCategoryId.value || undefined,
		name: categoryForm.value.name,
		sort: categoryForm.value.sort,
		enabled: categoryForm.value.enabled
	};
	if (!String(payload.name || '').trim()) {
		window.alert('请输入分类名称');
		return;
	}
	await adminApi.mallCategorySave(payload);
	resetCategory();
	await reload();
}

async function deleteCategory(item) {
	if (!window.confirm(`确认删除分类「${item.name}」？`)) return;
	await adminApi.mallCategoryDelete(item.id);
	if (editingCategoryId.value === String(item.id)) {
		resetCategory();
	}
	await reload();
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

async function deleteProduct(item) {
	if (!window.confirm(`确认删除商品「${item.title}」？`)) return;
	await adminApi.mallProductDelete(item.id);
	if (String(productForm.value.id || '') === String(item.id)) {
		resetProduct();
	}
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
	resetCategory();
	resetProduct();
	await reload();
});
</script>
