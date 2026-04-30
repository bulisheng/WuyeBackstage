<template>
	<section class="panel-grid">
		<article v-for="item in workspace.stats" :key="item.label" class="metric">
			<span>{{ item.label }}</span>
			<strong>{{ item.value }}</strong>
		</article>
	</section>
</template>

<script setup>
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
</script>
