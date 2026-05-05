<template>
	<section class="login-panel">
		<div class="login-shell">
			<div class="login-aside">
				<div class="panel-head">
					<div>
						<h2>后台登录</h2>
						<p class="panel-subtitle">使用后台登记的管理员手机号和验证码登录</p>
					</div>
				</div>
				<div class="login-copy">
					<h2>把物业流程收束到一个控制台里。</h2>
					<p>住户、报修、费用、公告和通知统一在同一工作台处理，按小区切换上下文，减少来回跳转和信息丢失。</p>
				</div>
				<div class="login-badges">
					<span class="login-badge">多小区切换</span>
					<span class="login-badge">验证码登录</span>
					<span class="login-badge">权限分层</span>
				</div>
				<div class="login-steps">
					<div class="login-step">
						<strong>1. 校验手机号</strong>
						<span>仅登记并启用的管理员可进入后台。</span>
					</div>
					<div class="login-step">
						<strong>2. 获取验证码</strong>
						<span>联调时会显示调试验证码，便于快速验证流程。</span>
					</div>
					<div class="login-step">
						<strong>3. 进入工作区</strong>
						<span>登录后自动恢复上次选择的小区上下文。</span>
					</div>
				</div>
			</div>
			<div class="login-form-panel">
				<div class="panel-head">
					<h3>请输入登录信息</h3>
					<span>验证码将用于当前后台会话</span>
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
				<div class="form-actions split-actions">
					<button type="button" @click="handleSendAdminLoginCode">获取验证码</button>
					<button class="primary" type="button" @click="workspace.loginAdmin">登录</button>
					<button type="button" @click="workspace.resetLoginForm">重置</button>
				</div>
				<p v-if="workspace.loginForm.debugCode" class="helper-text">验证码已发送后会在弹窗中显示调试验证码，便于联调登录。</p>
				<p class="helper-text">只有后台已登记且启用的管理员手机号可以登录。默认超级管理员手机号不会在页面中展示。</p>
			</div>
		</div>
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
