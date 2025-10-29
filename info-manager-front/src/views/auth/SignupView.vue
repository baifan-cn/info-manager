<script setup lang="ts">
import { reactive, ref } from 'vue'
import { MessagePlugin, type FormRules, type SubmitContext } from 'tdesign-vue-next'
import { RouterLink, useRouter } from 'vue-router'
import { signup } from '../../api'

const router = useRouter()

interface SignupFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
}

const formData = reactive<SignupFormData>({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errorMessage = ref('')

const rules: FormRules<SignupFormData> = {
  email: [
    { required: true, message: '请输入邮箱地址' },
    {
      validator: (val: string) => /.+@.+\..+/.test(val),
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
  confirmPassword: [
    { required: true, message: '请再次输入密码' },
    {
      validator: () => formData.password === formData.confirmPassword,
      message: '两次输入的密码不一致',
      trigger: 'blur',
    },
  ],
}

const clearError = () => {
  errorMessage.value = ''
}

function extractErrorMessage(error: unknown) {
  if (!error) return '注册失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '注册失败，请稍后重试'
}

const handleSubmit = async (context: SubmitContext<SignupFormData>) => {
  if (context.validateResult !== true) return

  errorMessage.value = ''
  loading.value = true
  try {
    await signup({
      email: formData.email,
      username: formData.username,
      password: formData.password,
    })
    MessagePlugin.success('注册成功，请登录')
    router.replace({ name: 'login' })
  } catch (error) {
    const message = extractErrorMessage(error)
    errorMessage.value = message
    MessagePlugin.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-view">
    <t-card class="auth-view__card" title="创建账户" bordered>
      <p class="auth-view__subtitle">注册后即可访问信息管理系统。</p>
      <t-alert v-if="errorMessage" theme="error" :message="errorMessage" closable @close="clearError" />
      <t-form
        :data="formData"
        :rules="rules"
        label-width="0"
        @submit="handleSubmit"
      >
        <t-form-item name="email">
          <t-input v-model="formData.email" placeholder="请输入邮箱" size="large" autocomplete="email" />
        </t-form-item>
        <t-form-item name="username">
          <t-input v-model="formData.username" placeholder="请输入用户名" size="large" autocomplete="username" />
        </t-form-item>
        <t-form-item name="password">
          <t-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            autocomplete="new-password"
          />
        </t-form-item>
        <t-form-item name="confirmPassword">
          <t-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            autocomplete="new-password"
          />
        </t-form-item>
        <t-form-item>
          <t-button block theme="primary" type="submit" size="large" :loading="loading">
            注册
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="auth-view__actions">
      <RouterLink to="/login">已有账号？立即登录</RouterLink>
      <RouterLink to="/forgot-password">忘记密码</RouterLink>
    </div>
  </div>
</template>
