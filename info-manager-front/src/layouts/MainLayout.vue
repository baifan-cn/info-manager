<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DialogPlugin, MessagePlugin, type TdDropdownProps } from 'tdesign-vue-next'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'

interface NavItem {
  label: string
  path: string
  disabled?: boolean
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userStore = useUserStore()

const isSuperuser = computed(() => Boolean(userStore.profile?.is_superuser))

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [
    { label: '控制台', path: '/dashboard' },
    { label: '信息条目', path: '/items' },
  ]

  if (isSuperuser.value) {
    items.push({ label: '用户管理', path: '/admin/users' })
  }

  items.push({ label: '个人中心', path: '/profile' })

  return items
})

const isMobile = ref(false)
const isSidebarCollapsed = ref(false)
const mobileMenuVisible = ref(false)
const isLoggingOut = ref(false)

const displayName = computed(() => userStore.displayName)
const displayInitial = computed(() =>
  displayName.value ? displayName.value.charAt(0).toUpperCase() : 'U',
)

const activeMenu = computed(() => {
  const match = navItems.value.find((item) => route.path.startsWith(item.path) && !item.disabled)
  return match ? match.path : '/dashboard'
})

const dropdownOptions = computed<TdDropdownProps['options']>(() => {
  const options: NonNullable<TdDropdownProps['options']> = []

  if (isSuperuser.value) {
    options.push({ content: '用户管理', value: 'admin-users' })
  }

  options.push({ content: '个人中心', value: 'profile' })
  options.push({ content: '退出登录', value: 'logout' })

  return options
})

const updateResponsiveState = () => {
  if (typeof window === 'undefined') return
  const matcher = window.matchMedia('(max-width: 960px)')
  isMobile.value = matcher.matches
  if (!matcher.matches) {
    mobileMenuVisible.value = false
    isSidebarCollapsed.value = false
  }
}

const toggleSidebar = () => {
  if (isMobile.value) {
    mobileMenuVisible.value = !mobileMenuVisible.value
    return
  }
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleMenuChange = (value: string) => {
  const target = navItems.value.find((item) => item.path === value)
  if (target?.disabled) return
  if (value !== route.path) {
    router.push(value)
  }
}

type DropdownOption = NonNullable<TdDropdownProps['options']>[number]

const handleDropdownClick = async (payload: string | number | DropdownOption) => {
  const value =
    typeof payload === 'object' && payload && 'value' in payload
      ? (payload as DropdownOption).value
      : payload
  if (value === 'admin-users') {
    if (route.path !== '/admin/users') {
      router.push('/admin/users')
    }
    return
  }
  if (value === 'profile') {
    if (route.path !== '/profile') {
      router.push('/profile')
    }
    return
  }
  if (value === 'logout') {
    const dialog = DialogPlugin.confirm({
      header: '退出登录',
      body: '确定要退出登录吗？',
      confirmBtn: isLoggingOut.value ? { content: '退出中...', loading: true } : '确定',
      cancelBtn: '取消',
      onConfirm: async () => {
        try {
          isLoggingOut.value = true
          // 更新确认按钮状态
          dialog.update({ confirmBtn: { content: '退出中...', loading: true } })

          console.log('开始执行退出登录...')
          await authStore.logout(true)
          console.log('退出登录成功，跳转到登录页面')

          MessagePlugin.success('已退出登录')
          dialog.destroy()
          router.replace({ name: 'login' })
        } catch (error) {
          console.error('退出登录失败:', error)
          MessagePlugin.error('退出登录失败，请重试')
          dialog.update({ confirmBtn: '确定' })
        } finally {
          isLoggingOut.value = false
        }
      },
      onClose: () => {
        if (!isLoggingOut.value) {
          dialog.destroy()
        }
      },
    })
  }
}

onMounted(() => {
  updateResponsiveState()
  userStore.fetchProfile().catch(() => {})
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateResponsiveState)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateResponsiveState)
  }
})

watch(
  () => route.fullPath,
  () => {
    if (isMobile.value) {
      mobileMenuVisible.value = false
    }
  },
)
</script>

<template>
  <t-layout class="main-layout" :class="{ 'main-layout--mobile': isMobile }">
    <t-header class="main-layout__header">
      <div class="main-layout__header-left">
        <t-button
          variant="text"
          shape="square"
          class="main-layout__trigger"
          @click="toggleSidebar"
        >
          <span class="main-layout__trigger-icon">☰</span>
        </t-button>
        <div class="main-layout__brand">
          <span class="main-layout__brand-logo">IM</span>
          <span class="main-layout__brand-text">信息管理系统</span>
        </div>
      </div>
      <div class="main-layout__header-right">
        <t-dropdown
          :options="dropdownOptions"
          trigger="click"
          placement="bottom"
          @click="handleDropdownClick"
        >
          <div class="main-layout__user">
            <t-avatar size="medium">{{ displayInitial }}</t-avatar>
            <span class="main-layout__user-name">{{ displayName }}</span>
            <span class="main-layout__user-caret">⌄</span>
          </div>
        </t-dropdown>
      </div>
    </t-header>
    <t-layout>
      <t-aside
        v-if="!isMobile"
        class="main-layout__aside"
        :class="{ 'main-layout__aside--collapsed': isSidebarCollapsed }"
      >
        <t-menu
          :value="activeMenu"
          :collapsed="isSidebarCollapsed"
          theme="light"
          @change="handleMenuChange"
        >
          <t-menu-item
            v-for="item in navItems"
            :key="item.path"
            :value="item.path"
            :disabled="item.disabled"
          >
            {{ item.label }}
          </t-menu-item>
        </t-menu>
        <div class="main-layout__aside-footer">
          <t-button theme="default" variant="text" @click="isSidebarCollapsed = !isSidebarCollapsed">
            {{ isSidebarCollapsed ? '展开菜单' : '收起菜单' }}
          </t-button>
        </div>
      </t-aside>
      <t-drawer
        v-else
        v-model:visible="mobileMenuVisible"
        placement="left"
        :footer="false"
        size="240px"
        destroy-on-close
        class="main-layout__drawer"
      >
        <template #header>导航菜单</template>
        <t-menu :value="activeMenu" theme="light" @change="handleMenuChange">
          <t-menu-item
            v-for="item in navItems"
            :key="item.path"
            :value="item.path"
            :disabled="item.disabled"
          >
            {{ item.label }}
          </t-menu-item>
        </t-menu>
      </t-drawer>
      <t-content class="main-layout__content">
        <div class="main-layout__content-inner">
          <slot />
        </div>
      </t-content>
    </t-layout>
  </t-layout>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  background: var(--td-bg-color-page);
}

.main-layout__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  border-bottom: 1px solid var(--td-border-level-1-color);
  background: var(--td-bg-color-container);
}

.main-layout__header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-layout__trigger {
  display: none;
  color: var(--td-text-color-primary);
}

.main-layout__trigger-icon {
  font-size: 18px;
  line-height: 1;
}

.main-layout__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.main-layout__brand-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--td-brand-color-light);
  color: var(--td-brand-color);
  font-size: 16px;
  font-weight: 600;
}

.main-layout__brand-text {
  font-size: 18px;
}

.main-layout__header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-layout__user {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--td-text-color-primary);
}

.main-layout__user-name {
  font-weight: 500;
}

.main-layout__user-caret {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.main-layout__aside {
  display: flex;
  flex-direction: column;
  width: 240px;
  padding: 16px 0;
  border-right: 1px solid var(--td-border-level-1-color);
  background: var(--td-bg-color-container);
  transition: width 0.3s ease;
}

.main-layout__aside--collapsed {
  width: 88px;
}

.main-layout__aside :deep(.t-menu) {
  flex: 1;
  border: none;
}

.main-layout__aside-footer {
  padding: 0 16px 8px;
}

.main-layout__drawer :deep(.t-drawer__header) {
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.main-layout__content {
  background: var(--td-bg-color-page);
  min-height: calc(100vh - 64px);
  padding: 24px;
}

.main-layout__content-inner {
  max-width: 1080px;
  margin: 0 auto;
}

.main-layout--mobile .main-layout__trigger {
  display: inline-flex;
}

.main-layout--mobile .main-layout__aside {
  display: none;
}

@media (max-width: 960px) {
  .main-layout__header {
    padding: 0 16px;
  }

  .main-layout__content {
    padding: 16px;
  }

  .main-layout__content-inner {
    max-width: 100%;
  }
}
</style>
