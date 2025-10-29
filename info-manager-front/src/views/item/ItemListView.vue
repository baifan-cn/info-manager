<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { MessagePlugin, type PrimaryTableCol, type TableSort } from 'tdesign-vue-next'
import { useItemStore } from '../../stores/item'
import type { Item } from '../../types/item'

interface PaginationChangeContext {
  current: number
  pageSize: number
}

const itemStore = useItemStore()

const searchForm = reactive({
  keyword: itemStore.searchValue,
})

const selectedRowKeys = ref<string[]>([])
const tableSort = ref<TableSort | undefined>(undefined)

const items = computed(() => itemStore.items)
const loading = computed(() => itemStore.loading)
const total = computed(() => itemStore.total)
const page = computed(() => itemStore.page)
const pageSize = computed(() => itemStore.pageSize)
const deletingMap = computed(() => itemStore.deletingMap)
const bulkDeleting = computed(() => itemStore.bulkDeleting)
const hasSelection = computed(() => selectedRowKeys.value.length > 0)

const columns = ref<PrimaryTableCol<Item>[]>([
  {
    colKey: 'row-select',
    type: 'multiple',
    width: 48,
    fixed: 'left',
  },
  {
    colKey: 'title',
    title: '标题',
    align: 'left',
    minWidth: 180,
    fixed: 'left',
  },
  {
    colKey: 'description',
    title: '描述',
    ellipsis: true,
    minWidth: 220,
  },
  {
    colKey: 'owner_id',
    title: '所有者',
    minWidth: 160,
  },
  {
    colKey: 'created_at',
    title: '创建时间',
    minWidth: 180,
    sorter: true,
    sortType: 'all',
  },
  {
    colKey: 'updated_at',
    title: '更新时间',
    minWidth: 180,
    sorter: true,
    sortType: 'all',
  },
  {
    colKey: 'actions',
    title: '操作',
    width: 160,
    fixed: 'right',
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

const syncSortState = () => {
  const field = itemStore.sortField
  const order = itemStore.sortOrder
  if (field && order) {
    tableSort.value = { sortBy: field, descending: order === 'desc' }
    return
  }
  tableSort.value = undefined
}

const handleSearch = async () => {
  try {
    await itemStore.fetchItems({ page: 1, search: searchForm.keyword.trim() })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleReset = async () => {
  searchForm.keyword = ''
  try {
    await itemStore.fetchItems({ page: 1, search: '' })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleRefresh = async () => {
  try {
    await itemStore.fetchItems()
    MessagePlugin.success('列表已刷新')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handlePaginationChange = async ({ current, pageSize }: PaginationChangeContext) => {
  try {
    await itemStore.fetchItems({ page: current, pageSize })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleSortChange = async (sort: TableSort) => {
  let sortField: string | null = null
  let sortOrder: 'asc' | 'desc' | null = null

  if (Array.isArray(sort)) {
    const first = sort[0]
    if (first?.sortBy) {
      sortField = first.sortBy
      sortOrder = first.descending ? 'desc' : 'asc'
      tableSort.value = { sortBy: first.sortBy, descending: first.descending }
    } else {
      tableSort.value = undefined
    }
  } else if (sort && typeof sort === 'object') {
    if (sort.sortBy) {
      sortField = sort.sortBy
      sortOrder = sort.descending ? 'desc' : 'asc'
      tableSort.value = { sortBy: sort.sortBy, descending: sort.descending }
    } else {
      tableSort.value = undefined
    }
  } else {
    tableSort.value = undefined
  }

  try {
    await itemStore.fetchItems({ page: 1, sortField, sortOrder })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleSelectionChange = (keys: Array<string | number>) => {
  selectedRowKeys.value = keys.map((key) => String(key))
}

const handleDelete = async (item: Item) => {
  try {
    await itemStore.deleteItemById(item.id)
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== item.id)
    MessagePlugin.success('条目已删除')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleBulkDelete = async () => {
  if (!hasSelection.value) return
  try {
    await itemStore.bulkDeleteByIds(selectedRowKeys.value)
    selectedRowKeys.value = []
    MessagePlugin.success('已删除选中条目')
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

watch(
  () => itemStore.searchValue,
  (value) => {
    if (value !== searchForm.keyword) {
      searchForm.keyword = value
    }
  },
  { immediate: true },
)

watch(
  () => [itemStore.sortField, itemStore.sortOrder],
  () => {
    syncSortState()
  },
  { immediate: true },
)

onMounted(() => {
  itemStore.fetchItems().catch((error) => {
    MessagePlugin.error(extractErrorMessage(error))
  })
})
</script>

<template>
  <div class="item-list-view">
    <t-card title="信息条目列表" bordered>
      <div class="item-list__toolbar">
        <div class="item-list__search">
          <t-input
            v-model="searchForm.keyword"
            placeholder="请输入标题或描述搜索"
            clearable
            @enter="handleSearch"
          />
          <t-button theme="primary" @click="handleSearch">搜索</t-button>
          <t-button variant="outline" @click="handleReset">重置</t-button>
        </div>
        <t-space size="small">
          <t-button variant="outline" @click="handleRefresh">刷新</t-button>
          <t-popconfirm
            content="确认删除所选条目？此操作不可恢复"
            theme="danger"
            :disabled="!hasSelection || bulkDeleting"
            @confirm="handleBulkDelete"
          >
            <t-button theme="danger" :disabled="!hasSelection" :loading="bulkDeleting">
              批量删除
            </t-button>
          </t-popconfirm>
        </t-space>
      </div>

      <t-table
        row-key="id"
        :data="items"
        :loading="loading"
        :columns="columns"
        hover
        table-layout="auto"
        :selected-row-keys="selectedRowKeys"
        :sort="tableSort"
        @sort-change="handleSortChange"
        @select-change="handleSelectionChange"
      >
        <template #description="{ row }">
          <span>{{ row.description || '—' }}</span>
        </template>
        <template #owner_id="{ row }">
          <span>{{ row.owner_id || '—' }}</span>
        </template>
        <template #created_at="{ row }">
          {{ row.created_at ? new Date(row.created_at).toLocaleString() : '—' }}
        </template>
        <template #updated_at="{ row }">
          {{ row.updated_at ? new Date(row.updated_at).toLocaleString() : '—' }}
        </template>
        <template #actions="{ row }">
          <t-popconfirm
            content="确认删除该条目？此操作不可恢复"
            theme="danger"
            @confirm="handleDelete(row)"
          >
            <t-button
              size="small"
              variant="text"
              theme="danger"
              :loading="Boolean(deletingMap[row.id])"
            >
              删除
            </t-button>
          </t-popconfirm>
        </template>
      </t-table>

      <div class="item-list__pagination" v-if="total > 0">
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
  </div>
</template>

<style scoped>
.item-list-view {
  padding: 24px;
  background: var(--td-bg-color-page);
  min-height: 100vh;
}

.item-list__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.item-list__search {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.item-list__search :deep(.t-input) {
  width: 320px;
}

.item-list__pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 640px) {
  .item-list-view {
    padding: 16px;
  }

  .item-list__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .item-list__search {
    flex-direction: column;
    align-items: stretch;
  }

  .item-list__search :deep(.t-input) {
    width: 100%;
  }
}
</style>
