<template>
	<div v-if="show" class="detail-card" :class="cardClass">
		<div class="panel-head compact">
			<h3>{{ title }}</h3>
			<div class="head-actions">
				<span v-if="subtitle">{{ subtitle }}</span>
				<slot name="actions" />
			</div>
		</div>
		<slot />
	</div>
</template>

<script setup>
defineProps({
	title: {
		type: String,
		default: ''
	},
	subtitle: {
		type: String,
		default: ''
	},
	show: {
		type: Boolean,
		default: true
	},
	cardClass: {
		type: String,
		default: ''
	}
});
</script>
