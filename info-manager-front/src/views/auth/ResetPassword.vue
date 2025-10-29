<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { MessagePlugin, type FormRules, type SubmitContext } from 'tdesign-vue-next'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { resetPassword } from '../../api'

const router = useRouter()
const route = useRoute()

interface ResetPasswordFormData {
  token: string
  password: string
  confirmPassword: string
}

const formData = reactive<ResetPasswordFormData>({
  token: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

watch(
  () => route.query.token,
  (token) => {
    if (typeof token === 'string') {
      formData.token = token
    }
  },
  { immediate: true },
)

const rules: FormRules<ResetPasswordFormData> = {
  token: [{ required: true, message: '请输入重置令牌' }],
  password: [{ required: true, message: '请输入新密码' }],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
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

const clearSuccess = () => {
  successMessage.value = ''
}

function extractErrorMessage(error: unknown) {
  if (!error) return '重置失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '重置失败，请稍后重试'
}

const handleSubmit = async (context: SubmitContext<ResetPasswordFormData>) => {
  if (context.validateResult !== true) return

  errorMessage.value = ''
  successMessage.value = ''
  loading.value = true
  try {
    await resetPassword({
      token: formData.token,
      new_password: formData.password,
    })
    successMessage.value = '密码已成功重置，请使用新密码登录。'
    MessagePlugin.success('密码重置成功')
    setTimeout(() => {
      router.replace({ name: 'login' })
    }, 1500)
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
    <t-card class="auth-view__card" title="重置密码" bordered>
      <p class="auth-view__subtitle">请输入重置令牌和新密码，完成后即可重新登录。</p>
      <t-alert v-if="errorMessage" theme="error" :message="errorMessage" closable @close="clearError" />
      <t-alert v-if="successMessage" theme="success" :message="successMessage" closable @close="clearSuccess" />
      <t-form
        :data="formData"
        :rules="rules"
        label-width="0"
        @submit="handleSubmit"
      >
        <t-form-item name="token">
          <t-input v-model="formData.token" placeholder="请输入重置令牌" size="large" />
        </t-form-item>
        <t-form-item name="password">
          <t-input
            v-model="formData.password"
            type="password"
            placeholder="请输入新密码"
            size="large"
            autocomplete="new-password"
          />
        </t-form-item>
        <t-form-item name="confirmPassword">
          <t-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            size="large"
            autocomplete="new-password"
          />
        </t-form-item>
        <t-form-item>
          <t-button block theme="primary" type="submit" size="large" :loading="loading">
            重置密码
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="auth-view__actions">
      <RouterLink to="/login">返回登录</RouterLink>
      <RouterLink to="/forgot-password">未收到邮件？重新发送</RouterLink>
    </div>
  </div>
</template>
