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
	background:
		radial-gradient(circle at top left, rgba(196, 143, 74, 0.18), transparent 28%),
		radial-gradient(circle at top right, rgba(18, 26, 39, 0.18), transparent 24%),
		rgba(9, 14, 24, 0.56);
	backdrop-filter: blur(10px) saturate(0.96);
	display: grid;
	place-items: center;
	padding: 20px;
}

.modal-shell {
	width: min(980px, 100%);
	max-height: min(90vh, 920px);
	overflow: auto;
	background:
		linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(251, 247, 240, 0.98)),
		#fffaf2;
	border: 1px solid rgba(14, 23, 38, 0.1);
	border-radius: 28px;
	box-shadow: 0 32px 80px rgba(18, 26, 39, 0.28);
	padding: 28px;
	display: grid;
	gap: 20px;
}

.modal-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	padding-bottom: 14px;
	border-bottom: 1px solid rgba(14, 23, 38, 0.08);
}

.modal-head h3 {
	font-size: 22px;
	line-height: 1.2;
	letter-spacing: 0.01em;
	color: #132235;
}

.modal-head p {
	margin-top: 6px;
	color: #64748b;
	font-size: 14px;
	line-height: 1.6;
}

.modal-body {
	display: grid;
	gap: 16px;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	padding-top: 16px;
	border-top: 1px solid rgba(14, 23, 38, 0.08);
}

.icon-button {
	border: 1px solid rgba(14, 23, 38, 0.14);
	background: rgba(255, 255, 255, 0.92);
	border-radius: 999px;
	padding: 9px 16px;
	color: #334155;
	transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease;
}

.icon-button:hover {
	transform: translateY(-1px);
	background: #fff;
	border-color: rgba(14, 23, 38, 0.22);
}

:deep(.modal-actions > button) {
	min-width: 96px;
	padding: 11px 18px;
	border-radius: 14px;
	border: 1px solid rgba(14, 23, 38, 0.14);
	background: rgba(255, 255, 255, 0.94);
	color: #132235;
	transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

:deep(.modal-actions > button:hover) {
	transform: translateY(-1px);
	background: #fff;
	box-shadow: 0 10px 18px rgba(18, 26, 39, 0.08);
}

:deep(.modal-actions > button.primary) {
	background: linear-gradient(135deg, #c48f4a, #9f5637);
	border-color: transparent;
	color: #fffaf2;
	box-shadow: 0 14px 24px rgba(196, 143, 74, 0.24);
}

:deep(.modal-actions > button.primary:hover) {
	box-shadow: 0 16px 28px rgba(196, 143, 74, 0.28);
}

@media (max-width: 768px) {
	.modal-backdrop {
		padding: 12px;
	}

	.modal-shell {
		padding: 18px;
		border-radius: 20px;
	}

	.modal-head {
		flex-direction: column;
		align-items: flex-start;
	}

	.modal-actions {
		flex-direction: column-reverse;
	}

	.modal-actions button {
		width: 100%;
	}
}
</style>
