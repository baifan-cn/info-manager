<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import {
  DialogPlugin,
  MessagePlugin,
  type FormRules,
  type SubmitContext,
} from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUserStore } from '../../stores/user'
import type { UpdateProfilePayload } from '../../types/user'

interface ProfileFormModel {
  fullName: string
  email: string
}

interface PasswordFormModel {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

const profileForm = reactive<ProfileFormModel>({
  fullName: '',
  email: '',
})

const passwordForm = reactive<PasswordFormModel>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileRules: FormRules<ProfileFormModel> = {
  fullName: [{ required: true, message: '请输入姓名' }],
  email: [
    { required: true, message: '请输入邮箱地址' },
    {
      validator: (val: string) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
}

const passwordRules: FormRules<PasswordFormModel> = {
  currentPassword: [{ required: true, message: '请输入当前密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '新密码长度至少为6位' },
  ],
  confirmPassword: [{ required: true, message: '请再次输入新密码' }],
}

const profile = computed(() => userStore.profile)
const displayName = computed(() => userStore.displayName)
const displayInitial = computed(() =>
  displayName.value ? displayName.value.charAt(0).toUpperCase() : 'U',
)
const loadingProfile = computed(() => userStore.loading)
const savingProfile = computed(() => userStore.saving)
const passwordLoading = computed(() => userStore.passwordLoading)
const deleteLoading = computed(() => userStore.deleteLoading)

function extractErrorMessage(error: unknown) {
  if (!error) return '操作失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '操作失败，请稍后重试'
}

const syncProfileForm = () => {
  if (!profile.value) return
  profileForm.fullName = profile.value.full_name ?? ''
  profileForm.email = profile.value.email ?? ''
}

watch(profile, syncProfileForm, { immediate: true })

onMounted(() => {
  if (!profile.value) {
    userStore.fetchProfile().catch((error) => {
      MessagePlugin.error(extractErrorMessage(error))
    })
  }
})

const handleProfileSubmit = async (context: SubmitContext<ProfileFormModel>) => {
  if (context.validateResult !== true) return

  const payload: UpdateProfilePayload = {
    full_name: profileForm.fullName,
    email: profileForm.email,
  }

  try {
    await userStore.updateProfile(payload)
    MessagePlugin.success('个人信息更新成功')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handlePasswordSubmit = async (context: SubmitContext<PasswordFormModel>) => {
  if (context.validateResult !== true) return

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    MessagePlugin.error('两次输入的新密码不一致')
    return
  }

  try {
    await userStore.changePassword({
      current_password: passwordForm.currentPassword,
      new_password: passwordForm.newPassword,
    })
    MessagePlugin.success('密码修改成功')
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleDeleteAccount = () => {
  const dialog = DialogPlugin.confirm({
    header: '确认注销账号',
    body: '注销后将无法恢复账号及其数据，请确认是否继续。',
    theme: 'danger',
    confirmBtn: { content: '注销账号', theme: 'danger' },
    cancelBtn: '取消',
    onConfirm: async () => {
      if (deleteLoading.value) return
      dialog.update({ confirmBtn: { content: '注销账号', theme: 'danger', loading: true } })
      try {
        await userStore.deleteAccount()
        authStore.logout()
        MessagePlugin.success('账号已注销')
        dialog.hide()
        router.replace({ name: 'login' })
      } catch (error) {
        MessagePlugin.error(extractErrorMessage(error))
      } finally {
        dialog.update({ confirmBtn: { content: '注销账号', theme: 'danger' } })
      }
    },
  })
}
</script>

<template>
  <div class="profile-view">
    <div class="profile-view__grid">
      <t-card class="profile-view__card profile-view__card--overview" title="账户信息" bordered>
        <div class="profile-overview">
          <t-avatar size="large">{{ displayInitial }}</t-avatar>
          <div class="profile-overview__meta">
            <div class="profile-overview__name">{{ displayName }}</div>
            <div class="profile-overview__email">{{ profile?.email || '未设置邮箱' }}</div>
          </div>
        </div>
        <t-divider class="profile-overview__divider" />
        <t-descriptions layout="horizontal" :column="1" size="medium">
          <t-descriptions-item label="用户名">
            {{ profile?.username || '未设置' }}
          </t-descriptions-item>
          <t-descriptions-item label="账户状态">
            <t-tag v-if="profile?.is_active" theme="success" variant="light">已启用</t-tag>
            <t-tag v-else theme="danger" variant="light">已停用</t-tag>
          </t-descriptions-item>
          <t-descriptions-item label="管理员权限">
            <t-tag v-if="profile?.is_superuser" theme="primary" variant="light">是</t-tag>
            <t-tag v-else theme="default" variant="light">否</t-tag>
          </t-descriptions-item>
        </t-descriptions>
      </t-card>

      <t-card class="profile-view__card" title="基本资料" bordered>
        <t-loading :loading="loadingProfile" size="small">
          <t-form
            layout="vertical"
            :data="profileForm"
            :rules="profileRules"
            @submit="handleProfileSubmit"
          >
            <t-form-item label="姓名" name="fullName">
              <t-input
                v-model="profileForm.fullName"
                placeholder="请输入姓名"
                :disabled="savingProfile || loadingProfile"
              />
            </t-form-item>
            <t-form-item label="邮箱" name="email">
              <t-input
                v-model="profileForm.email"
                placeholder="请输入邮箱"
                :disabled="savingProfile || loadingProfile"
              />
            </t-form-item>
            <t-form-item>
              <t-button
                type="submit"
                theme="primary"
                :loading="savingProfile"
              >
                保存更改
              </t-button>
            </t-form-item>
          </t-form>
        </t-loading>
      </t-card>

      <t-card class="profile-view__card" title="安全设置" bordered>
        <t-form
          layout="vertical"
          :data="passwordForm"
          :rules="passwordRules"
          @submit="handlePasswordSubmit"
        >
          <t-form-item label="当前密码" name="currentPassword">
            <t-input
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入当前密码"
              autocomplete="current-password"
              :disabled="passwordLoading"
            />
          </t-form-item>
          <t-form-item label="新密码" name="newPassword">
            <t-input
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码"
              autocomplete="new-password"
              :disabled="passwordLoading"
            />
          </t-form-item>
          <t-form-item label="确认新密码" name="confirmPassword">
            <t-input
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              autocomplete="new-password"
              :disabled="passwordLoading"
            />
          </t-form-item>
          <t-form-item>
            <t-button
              type="submit"
              theme="primary"
              variant="base"
              :loading="passwordLoading"
            >
              修改密码
            </t-button>
          </t-form-item>
        </t-form>
      </t-card>

      <t-card class="profile-view__card profile-view__card--danger" title="危险操作" bordered>
        <div class="profile-danger">
          <p>注销账号将删除所有关联数据，且无法恢复，请谨慎操作。</p>
          <t-button
            theme="danger"
            variant="outline"
            :loading="deleteLoading"
            @click="handleDeleteAccount"
          >
            注销账号
          </t-button>
        </div>
      </t-card>
    </div>
  </div>
</template>

<style scoped>
.profile-view {
  padding: 24px;
  background: var(--td-bg-color-page);
  min-height: 100vh;
}

.profile-view__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.profile-view__card--overview {
  grid-column: 1 / -1;
}

.profile-overview {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-overview__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-overview__name {
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.profile-overview__email {
  color: var(--td-text-color-secondary);
}

.profile-overview__divider {
  margin: 16px 0;
}

.profile-danger {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--td-text-color-secondary);
}

.profile-danger :deep(.t-button) {
  align-self: flex-start;
}

@media (max-width: 640px) {
  .profile-view {
    padding: 16px;
  }
}
</style>
