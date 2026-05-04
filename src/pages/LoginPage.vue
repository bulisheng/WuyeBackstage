<template>
	<section class="panel login-panel">
		<div class="panel-head">
			<h2>后台登录</h2>
			<span>使用后台登记的管理员手机号和验证码登录</span>
		</div>
		<div class="form-grid login-grid">
			<label class="field span-2">
				<span>手机号</span>
				<input v-model="workspace.loginForm.mobile" type="tel" maxlength="11" placeholder="请输入管理员手机号" />
			</label>
			<label class="field span-2">
				<span>验证码</span>
				<input v-model="workspace.loginForm.code" type="text" maxlength="6" placeholder="请输入验证码" />
			</label>
		</div>
		<div class="form-actions">
			<button @click="handleSendAdminLoginCode">获取验证码</button>
			<button class="primary" @click="workspace.loginAdmin">登录</button>
			<button @click="workspace.resetLoginForm">重置</button>
		</div>
		<p v-if="workspace.loginForm.debugCode" class="helper-text">验证码已发送后会在弹窗中显示调试验证码，便于联调登录。</p>
		<p class="helper-text">只有后台已登记且启用的管理员手机号可以登录。默认超级管理员手机号不会在页面中展示。</p>
	</section>
</template>

<script setup>
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();

async function handleSendAdminLoginCode() {
	try {
		const res = await workspace.sendAdminLoginCode();
		const code = String((res && res.debugCode) || workspace.loginForm.debugCode || '').trim();
		window.alert(code ? `验证码已发送\n调试验证码：${code}` : '验证码已发送');
	} catch (err) {
		// store 已经提示过错误，这里保持显式流程即可
	}
}
</script>
