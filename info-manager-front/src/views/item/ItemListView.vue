<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import {
  MessagePlugin,
  type FormInstanceFunctions,
  type FormRules,
  type PrimaryTableCol,
  type TableSort,
} from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { useItemStore } from '../../stores/item'
import type { Item } from '../../types/item'
import RichTextEditor from '../../components/common/RichTextEditor.vue'

interface PaginationChangeContext {
  current: number
  pageSize: number
}

const itemStore = useItemStore()
const router = useRouter()

const searchForm = reactive({
  keyword: itemStore.searchValue,
})

const selectedRowKeys = ref<string[]>([])
const tableSort = ref<TableSort | undefined>(undefined)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

interface ItemFormModel {
  title: string
  description: string
  context: string
}

const formModel = reactive<ItemFormModel>({
  title: '',
  description: '',
  context: '',
})

const formRules: FormRules<ItemFormModel> = {
  title: [
    { required: true, message: '请输入条目标题', trigger: 'blur' },
    { max: 255, message: '标题最多 255 个字符', trigger: 'blur' },
  ],
  description: [{ max: 255, message: '描述最多 255 个字符', trigger: 'blur' }],
}

const formRef = ref<FormInstanceFunctions<ItemFormModel> | null>(null)

const items = computed(() => itemStore.items)
const loading = computed(() => itemStore.loading)
const total = computed(() => itemStore.total)
const page = computed(() => itemStore.page)
const pageSize = computed(() => itemStore.pageSize)
const deletingMap = computed(() => itemStore.deletingMap)
const bulkDeleting = computed(() => itemStore.bulkDeleting)
const hasSelection = computed(() => selectedRowKeys.value.length > 0)
const creating = computed(() => itemStore.isCreating)
const updatingMap = computed(() => itemStore.updatingIds)
const detailLoading = computed(() => itemStore.isDetailLoading)
const isEditMode = computed(() => Boolean(editingId.value))
const dialogTitle = computed(() => (isEditMode.value ? '编辑条目信息' : '新建条目信息'))
const dialogSubmitting = computed(() =>
  isEditMode.value
    ? Boolean(editingId.value && updatingMap.value[editingId.value])
    : creating.value,
)
const dialogContentLoading = computed(() => isEditMode.value && detailLoading.value)

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

const resetForm = () => {
  formModel.title = ''
  formModel.description = ''
  formModel.context = ''
}

const populateForm = (item: Partial<Item> | null | undefined) => {
  formModel.title = item?.title ?? ''
  formModel.description = item?.description ?? ''
  formModel.context = item?.context ?? ''
}

const openCreateDialog = async () => {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
}

const openEditDialog = async (item: Item) => {
  editingId.value = item.id
  populateForm(item)
  dialogVisible.value = true
  await nextTick()
  formRef.value?.clearValidate()
  try {
    const detail = await itemStore.fetchItemDetail(item.id)
    populateForm(detail)
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleViewDetail = (item: Item) => {
  router.push({ name: 'item-detail', params: { id: item.id } })
}

const handleDialogClose = () => {
  dialogVisible.value = false
}

const handleDialogConfirm = async () => {
  if (dialogSubmitting.value) return
  const form = formRef.value
  if (!form) return
  const result = await form.validate()
  if (result !== true) return

  const trimmedDescription = formModel.description.trim()
  const htmlContent = formModel.context || ''
  const plainContent = htmlContent
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const payload = {
    title: formModel.title.trim(),
    description: trimmedDescription ? trimmedDescription : undefined,
    context: plainContent ? htmlContent : null,
  }

  try {
    if (isEditMode.value && editingId.value) {
      await itemStore.updateItemById(editingId.value, payload)
      MessagePlugin.success('条目信息已更新')
    } else {
      await itemStore.createItem(payload)
      MessagePlugin.success('条目信息已创建')
      selectedRowKeys.value = []
    }
    dialogVisible.value = false
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

watch(dialogVisible, (visible) => {
  if (!visible) {
    resetForm()
    editingId.value = null
    itemStore.clearDetail()
    formRef.value?.clearValidate()
  }
})

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
          <t-button theme="primary" @click="openCreateDialog">新建条目</t-button>
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
        <template #title="{ row }">
          <router-link
            class="item-list__title-link"
            :to="{ name: 'item-detail', params: { id: row.id } }"
          >
            {{ row.title }}
          </router-link>
        </template>
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
          <t-space size="small">
            <t-button size="small" variant="text" @click="handleViewDetail(row)">
              查看
            </t-button>
            <t-button size="small" variant="text" @click="openEditDialog(row)">
              编辑
            </t-button>
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
          </t-space>
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

    <t-dialog
      v-model:visible="dialogVisible"
      :header="dialogTitle"
      width="720px"
      destroy-on-close
      :confirm-btn="{ content: '保存', loading: dialogSubmitting }"
      :cancel-btn="{ disabled: dialogSubmitting }"
      @confirm="handleDialogConfirm"
      @close="handleDialogClose"
    >
      <t-loading :loading="dialogContentLoading" size="small">
        <t-form
          ref="formRef"
          :data="formModel"
          :rules="formRules"
          label-width="88"
          layout="vertical"
          :disabled="dialogSubmitting"
        >
          <t-form-item name="title" label="标题">
            <t-input v-model="formModel.title" placeholder="请输入条目标题" clearable />
          </t-form-item>
          <t-form-item name="description" label="描述">
            <t-textarea
              v-model="formModel.description"
              placeholder="请输入条目简要描述"
              maxlength="255"
              show-limit-number
              auto-size
            />
          </t-form-item>
          <t-form-item name="context" label="正文内容">
            <RichTextEditor v-model="formModel.context" placeholder="请输入正文内容" />
          </t-form-item>
        </t-form>
      </t-loading>
    </t-dialog>
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

.item-list__title-link {
  color: var(--td-text-color-primary);
  text-decoration: none;
}

.item-list__title-link:hover {
  color: var(--td-brand-color-8);
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
