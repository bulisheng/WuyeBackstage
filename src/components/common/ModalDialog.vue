<template>
	<teleport to="body">
		<div class="modal-backdrop" @click.self="close">
			<div class="modal-shell" role="dialog" aria-modal="true" :aria-label="title">
				<div class="modal-head">
					<div>
						<h3>{{ title }}</h3>
						<p v-if="subtitle">{{ subtitle }}</p>
					</div>
					<button class="icon-button" type="button" @click="close">关闭</button>
				</div>
				<div class="modal-body">
					<slot />
				</div>
				<div v-if="$slots.actions" class="modal-actions">
					<slot name="actions" />
				</div>
			</div>
		</div>
	</teleport>
</template>

<script setup>
const props = defineProps({
	title: {
		type: String,
		default: ''
	},
	subtitle: {
		type: String,
		default: ''
	}
});

const emit = defineEmits(['close']);

function close() {
	emit('close');
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
	width: min(920px, 100%);
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
