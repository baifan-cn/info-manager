<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAdminUsersStore } from '../../stores/adminUsers'
import { useUserStore } from '../../stores/user'
import type { AdminUser } from '../../types/user'

interface PaginationChangeContext {
  current: number
  pageSize: number
}

const adminUsersStore = useAdminUsersStore()
const userStore = useUserStore()

const searchModel = reactive({
  keyword: '',
})

const detailVisible = ref(false)
const detailUserId = ref<string | null>(null)

const users = computed(() => adminUsersStore.users)
const loading = computed(() => adminUsersStore.loading)
const total = computed(() => adminUsersStore.total)
const page = computed(() => adminUsersStore.pagination.page)
const pageSize = computed(() => adminUsersStore.pagination.pageSize)
const detail = computed(() => adminUsersStore.detail)
const detailLoading = computed(() => adminUsersStore.detailLoading)
const updatingMap = computed(() => adminUsersStore.updatingIds)
const deletingMap = computed(() => adminUsersStore.deletingIds)
const currentUserId = computed(() => userStore.profile?.id ?? '')

const columns = ref([
  {
    colKey: 'full_name',
    title: '姓名',
    align: 'left',
  },
  {
    colKey: 'email',
    title: '邮箱',
    ellipsis: true,
  },
  {
    colKey: 'is_active',
    title: '账号状态',
  },
  {
    colKey: 'is_superuser',
    title: '管理员',
  },
  {
    colKey: 'created_at',
    title: '创建时间',
  },
  {
    colKey: 'actions',
    title: '操作',
    fixed: 'right',
    width: 220,
  },
])

function extractErrorMessage(error: unknown) {
  if (!error) return '操作失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '操作失败，请稍后重试'
}

function isCurrentUser(user: AdminUser) {
  return user.id === currentUserId.value
}

const handleSearch = async () => {
  await adminUsersStore.fetchUsers({ page: 1, search: searchModel.keyword.trim() })
}

const handleResetFilters = async () => {
  searchModel.keyword = ''
  await adminUsersStore.fetchUsers({ page: 1, search: '' })
}

const handleRefresh = async () => {
  await adminUsersStore.fetchUsers()
}

const handlePaginationChange = async ({ current, pageSize }: PaginationChangeContext) => {
  await adminUsersStore.fetchUsers({ page: current, pageSize })
}

const openDetailDrawer = async (user: AdminUser) => {
  detailVisible.value = true
  detailUserId.value = user.id
  try {
    await adminUsersStore.fetchUserDetail(user.id)
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const closeDetailDrawer = () => {
  detailVisible.value = false
  detailUserId.value = null
  adminUsersStore.clearDetail()
}

const handleToggleActive = async (user: AdminUser) => {
  if (isCurrentUser(user)) return
  const targetStatus = !user.is_active
  try {
    await adminUsersStore.updateUser(user.id, { is_active: targetStatus })
    MessagePlugin.success(targetStatus ? '账号已启用' : '账号已禁用')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleToggleAdmin = async (user: AdminUser) => {
  if (isCurrentUser(user)) return
  const targetStatus = !user.is_superuser
  try {
    await adminUsersStore.updateUser(user.id, { is_superuser: targetStatus })
    MessagePlugin.success(targetStatus ? '已授予管理员权限' : '已移除管理员权限')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleDeleteUser = async (user: AdminUser) => {
  if (isCurrentUser(user)) return
  try {
    await adminUsersStore.deleteUser(user.id)
    MessagePlugin.success('用户已删除')
    if (users.value.length === 0 && page.value > 1) {
      await adminUsersStore.fetchUsers({ page: page.value - 1 })
    }
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

onMounted(() => {
  adminUsersStore.fetchUsers().catch((error) => {
    MessagePlugin.error(extractErrorMessage(error))
  })
})
</script>

<template>
  <div class="users-management-view">
    <t-card title="用户管理" bordered>
      <div class="users-management__toolbar">
        <div class="users-management__search">
          <t-input
            v-model="searchModel.keyword"
            placeholder="请输入姓名或邮箱搜索"
            clearable
            @enter="handleSearch"
          />
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button variant="outline" @click="handleResetFilters">重置</t-button>
        </div>
        <t-button theme="primary" variant="base" @click="handleRefresh">刷新</t-button>
      </div>

      <t-table
        row-key="id"
        :data="users"
        :loading="loading"
        :columns="columns"
        hover
        table-layout="auto"
      >
        <template #full_name="{ row }">
          <span>{{ row.full_name || row.username || '未设置姓名' }}</span>
        </template>
        <template #is_active="{ row }">
          <t-tag v-if="row.is_active" theme="success" variant="light">已启用</t-tag>
          <t-tag v-else theme="danger" variant="light">已禁用</t-tag>
        </template>
        <template #is_superuser="{ row }">
          <t-tag v-if="row.is_superuser" theme="primary" variant="light">是</t-tag>
          <t-tag v-else theme="default" variant="light">否</t-tag>
        </template>
        <template #created_at="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleString() : '—' }}
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button size="small" variant="text" @click="openDetailDrawer(row)">查看</t-button>
            <t-button
              size="small"
              variant="text"
              :loading="Boolean(updatingMap[row.id])"
              @click="handleToggleActive(row)"
              :disabled="isCurrentUser(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </t-button>
            <t-button
              size="small"
              variant="text"
              :loading="Boolean(updatingMap[row.id])"
              @click="handleToggleAdmin(row)"
              :disabled="isCurrentUser(row)"
            >
              {{ row.is_superuser ? '取消管理员' : '设为管理员' }}
            </t-button>
            <t-popconfirm
              content="确认删除该用户？此操作不可恢复"
              theme="danger"
              @confirm="handleDeleteUser(row)"
              :disabled="isCurrentUser(row)"
            >
              <t-button
                size="small"
                variant="text"
                theme="danger"
                :disabled="isCurrentUser(row)"
                :loading="Boolean(deletingMap[row.id])"
              >
                删除
              </t-button>
            </t-popconfirm>
          </t-space>
        </template>
      </t-table>

      <div class="users-management__pagination" v-if="total > 0">
        <t-pagination
          :total="total"
          :current="page"
          :page-size="pageSize"
          show-page-size
          show-jumper
          @change="handlePaginationChange"
        />
      </div>
    </t-card>

    <t-drawer
      v-model:visible="detailVisible"
      :footer="false"
      placement="right"
      size="480px"
      destroy-on-close
      @close="closeDetailDrawer"
    >
      <template #header>
        用户详情
      </template>
      <t-loading :loading="detailLoading" size="small">
        <div v-if="detail" class="users-management__detail">
          <t-descriptions layout="vertical" :column="2">
            <t-descriptions-item label="姓名">
              {{ detail.full_name || detail.username || '未设置' }}
            </t-descriptions-item>
            <t-descriptions-item label="邮箱">
              {{ detail.email }}
            </t-descriptions-item>
            <t-descriptions-item label="用户名">
              {{ detail.username || '未设置' }}
            </t-descriptions-item>
            <t-descriptions-item label="管理员">
              {{ detail.is_superuser ? '是' : '否' }}
            </t-descriptions-item>
            <t-descriptions-item label="账号状态">
              {{ detail.is_active ? '已启用' : '已禁用' }}
            </t-descriptions-item>
            <t-descriptions-item label="用户 ID">
              {{ detail.id }}
            </t-descriptions-item>
            <t-descriptions-item label="创建时间">
              {{ detail.created_at ? new Date(detail.created_at).toLocaleString() : '—' }}
            </t-descriptions-item>
            <t-descriptions-item label="最近登录">
              {{ detail.last_login ? new Date(detail.last_login).toLocaleString() : '—' }}
            </t-descriptions-item>
          </t-descriptions>
        </div>
        <div v-else class="users-management__detail-empty">
          暂无用户信息
        </div>
      </t-loading>
    </t-drawer>
  </div>
</template>

<style scoped>
.users-management-view {
  padding: 24px;
  background: var(--td-bg-color-page);
  min-height: 100vh;
}

.users-management__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.users-management__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.users-management__search :deep(.t-input) {
  width: 320px;
}

.users-management__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.users-management__detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.users-management__detail-empty {
  padding: 24px 0;
  text-align: center;
  color: var(--td-text-color-secondary);
}

@media (max-width: 640px) {
  .users-management-view {
    padding: 16px;
  }

  .users-management__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .users-management__search {
    flex-direction: column;
    align-items: stretch;
  }

  .users-management__search :deep(.t-input) {
    width: 100%;
  }
}
</style>
