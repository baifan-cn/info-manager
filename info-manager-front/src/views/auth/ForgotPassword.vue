<script setup lang="ts">
import { reactive, ref } from 'vue'
import { MessagePlugin, type FormRules, type SubmitContext } from 'tdesign-vue-next'
import { RouterLink } from 'vue-router'
import { requestPasswordRecovery } from '../../api'

interface ForgotPasswordFormData {
  email: string
}

const formData = reactive<ForgotPasswordFormData>({
  email: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const rules: FormRules<ForgotPasswordFormData> = {
  email: [
    { required: true, message: '请输入邮箱地址' },
    {
      validator: (val: string) => /.+@.+\..+/.test(val),
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
}

const clearMessages = () => {
  errorMessage.value = ''
  successMessage.value = ''
}

const clearError = () => {
  errorMessage.value = ''
}

const clearSuccess = () => {
  successMessage.value = ''
}

function extractErrorMessage(error: unknown) {
  if (!error) return '发送失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '发送失败，请稍后重试'
}

const handleSubmit = async (context: SubmitContext<ForgotPasswordFormData>) => {
  if (context.validateResult !== true) return

  clearMessages()
  loading.value = true
  try {
    await requestPasswordRecovery(formData.email)
    successMessage.value = '重置密码邮件已发送，请检查邮箱。'
    MessagePlugin.success('邮件发送成功')
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
    <t-card class="auth-view__card" title="忘记密码" bordered>
      <p class="auth-view__subtitle">请输入您的注册邮箱，我们将向您发送重置密码的链接。</p>
      <t-alert v-if="errorMessage" theme="error" :message="errorMessage" closable @close="clearError" />
      <t-alert v-if="successMessage" theme="success" :message="successMessage" closable @close="clearSuccess" />
      <t-form
        :data="formData"
        :rules="rules"
        label-width="0"
        @submit="handleSubmit"
      >
        <t-form-item name="email">
          <t-input v-model="formData.email" placeholder="请输入注册邮箱" size="large" autocomplete="email" />
        </t-form-item>
        <t-form-item>
          <t-button block theme="primary" type="submit" size="large" :loading="loading">
            发送重置邮件
          </t-button>
        </t-form-item>
      </t-form>
    </t-card>

    <div class="auth-view__actions">
      <RouterLink to="/login">返回登录</RouterLink>
      <RouterLink to="/signup">还没有账号？注册</RouterLink>
    </div>
  </div>
</template>
