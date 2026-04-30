<template>
	<section class="panel login-panel">
		<div class="panel-head">
			<h2>后台登录</h2>
			<span>输入管理员账号后进入系统</span>
		</div>
		<div class="form-grid login-grid">
			<label class="field span-2">
				<span>账号</span>
				<input v-model="workspace.loginForm.username" type="text" placeholder="请输入管理员账号" />
			</label>
			<label class="field span-2">
				<span>密码</span>
				<input v-model="workspace.loginForm.password" type="password" placeholder="请输入密码" />
			</label>
		</div>
		<div class="form-actions">
			<button class="primary" @click="workspace.loginAdmin">登录</button>
			<button @click="workspace.resetLoginForm">重置</button>
		</div>
		<p class="helper-text">请手动输入管理员账号和密码，不在页面展示默认口令。</p>
	</section>
</template>

<script setup>
import { useAdminWorkspaceStore } from '../stores/adminWorkspace.js';

const workspace = useAdminWorkspaceStore();
</script>
