<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { MessagePlugin, type FormRules, type SubmitContext } from 'tdesign-vue-next'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

interface LoginFormData {
  username: string
  password: string
}

const formData = reactive<LoginFormData>({
  username: '',
  password: '',
})

const errorMessage = ref('')

const rules: FormRules<LoginFormData> = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

const loading = computed(() => authStore.loading)

function extractErrorMessage(error: unknown) {
  if (!error) return '登录失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '登录失败，请稍后重试'
}

const handleSubmit = async (context: SubmitContext<LoginFormData>) => {
  if (context.validateResult !== true) return

  errorMessage.value = ''
  try {
    await authStore.login({ ...formData })
    MessagePlugin.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect)
  } catch (error) {
    const message = extractErrorMessage(error)
    errorMessage.value = message
    MessagePlugin.error(message)
  }
}

const clearError = () => {
  errorMessage.value = ''
}
</script>

<template>
  <div class="auth-view">
    <t-card class="auth-view__card" title="登录信息管理系统" bordered>
      <p class="auth-view__subtitle">使用您的账户登录以继续访问控制台。</p>
      <t-alert v-if="errorMessage" theme="error" :message="errorMessage" closable @close="clearError" />
      <t-form
        :data="formData"
        :rules="rules"
        label-width="0"
        @submit="handleSubmit"
      >
        <t-form-item name="username">
          <t-input
            v-model="formData.username"
            placeholder="请输入用户名"
            size="large"
            autocomplete="username"
          />
        </t-form-item>
        <t-form-item name="password">
          <t-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            autocomplete="current-password"
          />
        </t-form-item>
        <t-form-item>
          <t-button
            block
            theme="primary"
            type="submit"
            size="large"
            :loading="loading"
          >
            登录
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="auth-view__actions">
      <RouterLink to="/signup">注册新账户</RouterLink>
      <RouterLink to="/forgot-password">忘记密码？</RouterLink>
    </div>
  </div>
</template>
