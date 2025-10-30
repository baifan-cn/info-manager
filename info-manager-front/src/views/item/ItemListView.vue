<script setup lang="ts">
import {
  MessagePlugin,
  type FormInstanceFunctions,
  type FormRules,
  type PrimaryTableCol,
  type TableSort,
} from 'tdesign-vue-next'
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import { useItemStore } from '../../stores/item'
import { ITEM_TAG_LABEL_MAP, ITEM_TAG_VALUES } from '../../types/item'
import type { Item, ItemTag } from '../../types/item'
import { resolveErrorMessage } from '../../utils/error'

interface PaginationChangeContext {
  current: number
  pageSize: number
}

const itemStore = useItemStore()
const router = useRouter()

const dateLocale = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
const PLACEHOLDER_TEXT = '—'
const EMPTY_DESCRIPTION = '暂无条目信息'
const FETCH_FAILED_MESSAGE = '获取数据失败，请稍后重试'
const BULK_DELETE_CONFIRM = '确认删除选中的条目？此操作不可恢复'
const SINGLE_DELETE_CONFIRM = '确认删除该条目？此操作不可恢复'
const LIST_TITLE = '信息条目列表'
const SEARCH_PLACEHOLDER = '请输入关键词搜索'
const SEARCH_ACTION_LABEL = '搜索'
const RESET_ACTION_LABEL = '重置'
const CREATE_ACTION_LABEL = '新建条目'
const REFRESH_ACTION_LABEL = '刷新'
const EXPORT_ACTION_LABEL = '导出 CSV'
const BULK_DELETE_ACTION_LABEL = '批量删除'
const VIEW_ACTION_LABEL = '查看'
const EDIT_ACTION_LABEL = '编辑'
const DELETE_ACTION_LABEL = '删除'
const SAVE_ACTION_LABEL = '保存'
const TOOLTIP_SHORTCUT = '快捷键：⌘/Ctrl + N 快速新建'
const LOADING_TEXT = '加载中…'
const STATE_EMPTY_TEXT = '暂无数据'
const EXPORT_SUCCESS_TEXT = '导出成功'
const EXPORT_FAILED_TEXT = '导出失败，请稍后重试'
const REFRESH_SUCCESS_TEXT = '刷新成功'
const DELETE_SUCCESS_TEXT = '删除成功'
const BULK_DELETE_SUCCESS_TEXT = '批量删除成功'
const UPDATE_SUCCESS_TEXT = '更新成功'
const CREATE_SUCCESS_TEXT = '创建成功'
const DIALOG_CREATE_TITLE = '新建条目'
const DIALOG_EDIT_TITLE = '编辑条目'
const DIALOG_TITLE_LABEL = '标题'
const DIALOG_TITLE_PLACEHOLDER = '请输入条目标题'
const DIALOG_DESCRIPTION_LABEL = '描述'
const DIALOG_DESCRIPTION_PLACEHOLDER = '请输入条目简要描述'
const DIALOG_CONTEXT_LABEL = '正文内容'
const DIALOG_CONTEXT_PLACEHOLDER = '请输入正文内容'
const DIALOG_TAG_LABEL = '标签'
const DIALOG_TAG_PLACEHOLDER = '请选择条目标签'
const DIALOG_DESCRIPTION_MAX_MESSAGE = '描述最多 255 个字符'
const FORM_TITLE_REQUIRED_MESSAGE = '请输入条目标题'
const FORM_TITLE_MAX_MESSAGE = '标题最多 255 个字符'
const FORM_TAG_REQUIRED_MESSAGE = '请选择条目标签'
const SHORTCUT_CREATE_KEY = 'n'

const RichTextEditor = defineAsyncComponent(() =>
  import('../../components/common/RichTextEditor.vue'),
)

const DEFAULT_TAG: ItemTag = 'DEFAULT'
const tagOptions = ITEM_TAG_VALUES.map((value) => ({
  label: ITEM_TAG_LABEL_MAP[value],
  value,
})) as Array<{ label: string; value: ItemTag }>

const resolveTagLabel = (tag?: ItemTag | null) => {
  if (!tag) return PLACEHOLDER_TEXT
  return ITEM_TAG_LABEL_MAP[tag] ?? tag
}

const searchForm = reactive({
  keyword: itemStore.searchValue,
})

const selectedRowKeys = ref<string[]>([])
const tableSort = ref<TableSort | undefined>(undefined)
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const searchInputRef = ref<{ focus?: () => void } | null>(null)
const exporting = ref(false)

interface ItemFormModel {
  title: string
  description: string
  context: string
  tag: ItemTag
}

const formModel = reactive<ItemFormModel>({
  title: '',
  description: '',
  context: '',
  tag: DEFAULT_TAG,
})

const formRules = computed<FormRules<ItemFormModel>>(() => ({
  title: [
    { required: true, message: FORM_TITLE_REQUIRED_MESSAGE, trigger: 'blur' },
    { max: 255, message: FORM_TITLE_MAX_MESSAGE, trigger: 'blur' },
  ],
  tag: [{ required: true, message: FORM_TAG_REQUIRED_MESSAGE, trigger: 'change' }],
  description: [{ max: 255, message: DIALOG_DESCRIPTION_MAX_MESSAGE, trigger: 'blur' }],
}))

const formRef = ref<FormInstanceFunctions<ItemFormModel> | null>(null)

const items = computed(() => itemStore.items)
const loading = computed(() => itemStore.loading)
const total = computed(() => itemStore.total)
const page = computed(() => itemStore.page)
const pageSize = computed(() => itemStore.pageSize)
const deletingMap = computed(() => itemStore.deletingMap)
const bulkDeleting = computed(() => itemStore.bulkDeleting)
const hasSelection = computed(() => selectedRowKeys.value.length > 0)
const hasItems = computed(() => items.value.length > 0)
const creating = computed(() => itemStore.isCreating)
const updatingMap = computed(() => itemStore.updatingIds)
const detailLoading = computed(() => itemStore.isDetailLoading)
const isEditMode = computed(() => Boolean(editingId.value))
const dialogTitle = computed(() => (isEditMode.value ? DIALOG_EDIT_TITLE : DIALOG_CREATE_TITLE))
const dialogSubmitting = computed(() =>
  isEditMode.value
    ? Boolean(editingId.value && updatingMap.value[editingId.value])
    : creating.value,
)
const dialogContentLoading = computed(() => isEditMode.value && detailLoading.value)
const placeholderText = computed(() => PLACEHOLDER_TEXT)
const emptyDescription = computed(() => EMPTY_DESCRIPTION)
const tableLoading = computed(() => (loading.value ? { loading: true, text: LOADING_TEXT } : false))

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const columns = computed<PrimaryTableCol<Item>[]>(() => [
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
    colKey: 'tag',
    title: '标签',
    minWidth: 140,
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

const getErrorMessage = (error: unknown, fallback = FETCH_FAILED_MESSAGE) =>
  resolveErrorMessage(error) || fallback

const exportFileName = computed(() => {
  const date = new Intl.DateTimeFormat(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/[\/\\]/g, '-')
  return `${LIST_TITLE}-${date}.csv`
})

const buildCsvRow = (values: Array<string | null | undefined>) =>
  values
    .map((value) => {
      const safe = value ?? ''
      return `"${String(safe).replace(/"/g, '""')}"`
    })
    .join(',')

let searchTimer: ReturnType<typeof setTimeout> | null = null
const SEARCH_DEBOUNCE = 400

const syncSortState = () => {
  const field = itemStore.sortField
  const order = itemStore.sortOrder
  if (field && order) {
    tableSort.value = { sortBy: field, descending: order === 'desc' }
    return
  }
  tableSort.value = undefined
}

const focusSearchInput = () => {
  searchInputRef.value?.focus?.()
}

const handleSearch = async () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  try {
    await itemStore.fetchItems({ page: 1, search: searchForm.keyword.trim() })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleReset = async () => {
  searchForm.keyword = ''
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  try {
    await itemStore.fetchItems({ page: 1, search: '' })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleRefresh = async () => {
  try {
    await itemStore.fetchItems()
    MessagePlugin.success(REFRESH_SUCCESS_TEXT)
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleExport = async () => {
  if (!hasItems.value) {
    MessagePlugin.info(STATE_EMPTY_TEXT)
    return
  }
  exporting.value = true
  try {
    const header = buildCsvRow([
      '标题',
      '描述',
      '标签',
      '所有者',
      '创建时间',
      '更新时间',
    ])
    const rows = items.value.map((item) =>
      buildCsvRow([
        item.title,
        item.description,
        resolveTagLabel(item.tag),
        item.owner_id,
        formatDate(item.created_at),
        formatDate(item.updated_at),
      ]),
    )
    const content = [header, ...rows].join('\n')
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.download = exportFileName.value
    link.click()
    URL.revokeObjectURL(url)
    MessagePlugin.success(EXPORT_SUCCESS_TEXT)
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error, EXPORT_FAILED_TEXT))
  } finally {
    exporting.value = false
  }
}

const handlePaginationChange = async ({ current, pageSize }: PaginationChangeContext) => {
  try {
    await itemStore.fetchItems({ page: current, pageSize })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
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
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleSelectionChange = (keys: Array<string | number>) => {
  selectedRowKeys.value = keys.map((key) => String(key))
}

const handleDelete = async (item: Item) => {
  try {
    await itemStore.deleteItemById(item.id)
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== item.id)
    MessagePlugin.success(DELETE_SUCCESS_TEXT)
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleBulkDelete = async () => {
  if (!hasSelection.value) return
  try {
    await itemStore.bulkDeleteByIds(selectedRowKeys.value)
    selectedRowKeys.value = []
    MessagePlugin.success(BULK_DELETE_SUCCESS_TEXT)
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const resetForm = () => {
  formModel.title = ''
  formModel.description = ''
  formModel.context = ''
  formModel.tag = DEFAULT_TAG
}

const populateForm = (item: Partial<Item> | null | undefined) => {
  formModel.title = item?.title ?? ''
  formModel.description = item?.description ?? ''
  formModel.context = item?.context ?? ''
  formModel.tag = (item?.tag as ItemTag | undefined) ?? DEFAULT_TAG
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
    MessagePlugin.error(getErrorMessage(error))
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
    tag: formModel.tag,
  }

  try {
    if (isEditMode.value && editingId.value) {
      await itemStore.updateItemById(editingId.value, payload)
      MessagePlugin.success(UPDATE_SUCCESS_TEXT)
    } else {
      await itemStore.createItem(payload)
      MessagePlugin.success(CREATE_SUCCESS_TEXT)
      selectedRowKeys.value = []
    }
    dialogVisible.value = false
  } catch (error) {
    MessagePlugin.error(getErrorMessage(error))
  }
}

const handleShortcut = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey)) return
  const key = event.key.toLowerCase()
  if (key === 'k') {
    event.preventDefault()
    focusSearchInput()
  }
  if (key === SHORTCUT_CREATE_KEY) {
    event.preventDefault()
    openCreateDialog()
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
  () => searchForm.keyword,
  (value, oldValue) => {
    if (value === oldValue) return
    if (searchTimer) {
      clearTimeout(searchTimer)
    }
    searchTimer = setTimeout(() => {
      itemStore
        .fetchItems({ page: 1, search: value.trim() })
        .catch((error) => {
          MessagePlugin.error(getErrorMessage(error))
        })
    }, SEARCH_DEBOUNCE)
  },
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
    MessagePlugin.error(getErrorMessage(error))
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleShortcut)
  }
})

onBeforeUnmount(() => {
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleShortcut)
  }
})
</script>

<template>
  <div class="item-list-view">
    <t-card :title="LIST_TITLE" bordered>
      <div class="item-list__toolbar">
        <div class="item-list__search">
          <t-input ref="searchInputRef" v-model="searchForm.keyword" :placeholder="SEARCH_PLACEHOLDER" clearable
            @enter="handleSearch" />
          <t-button theme="primary" @click="handleSearch">
            {{ SEARCH_ACTION_LABEL }}
          </t-button>
          <t-button variant="outline" @click="handleReset">
            {{ RESET_ACTION_LABEL }}
          </t-button>
        </div>
        <t-space size="small">
          <t-tooltip :content="TOOLTIP_SHORTCUT">
            <t-button theme="primary" @click="openCreateDialog">
              {{ CREATE_ACTION_LABEL }}
            </t-button>
          </t-tooltip>
          <t-button variant="outline" @click="handleRefresh">
            {{ REFRESH_ACTION_LABEL }}
          </t-button>
          <t-button variant="outline" :loading="exporting" :disabled="!hasItems" @click="handleExport">
            {{ EXPORT_ACTION_LABEL }}
          </t-button>
          <t-popconfirm :content="BULK_DELETE_CONFIRM" theme="danger" :disabled="!hasSelection || bulkDeleting"
            @confirm="handleBulkDelete">
            <t-button theme="danger" :disabled="!hasSelection" :loading="bulkDeleting">
              {{ BULK_DELETE_ACTION_LABEL }}
            </t-button>
          </t-popconfirm>
        </t-space>
      </div>

      <t-table row-key="id" :data="items" :loading="tableLoading" :columns="columns" hover table-layout="auto"
        :selected-row-keys="selectedRowKeys" :sort="tableSort" @sort-change="handleSortChange"
        @select-change="handleSelectionChange">
        <template #title="{ row }">
          <router-link class="item-list__title-link" :to="{ name: 'item-detail', params: { id: row.id } }">
            {{ row.title }}
          </router-link>
        </template>
        <template #description="{ row }">
          <span>{{ row.description || placeholderText }}</span>
        </template>
        <template #tag="{ row }">
          <t-tag variant="light" theme="default">
            {{ resolveTagLabel(row.tag) }}
          </t-tag>
        </template>
        <template #owner_id="{ row }">
          <span>{{ row.owner_id || placeholderText }}</span>
        </template>
        <template #created_at="{ row }">
          {{ formatDate(row.created_at) || placeholderText }}
        </template>
        <template #updated_at="{ row }">
          {{ formatDate(row.updated_at) || placeholderText }}
        </template>
        <template #actions="{ row }">
          <t-space size="small">
            <t-button size="small" variant="text" @click="handleViewDetail(row)">
              {{ VIEW_ACTION_LABEL }}
            </t-button>
            <t-button size="small" variant="text" @click="openEditDialog(row)">
              {{ EDIT_ACTION_LABEL }}
            </t-button>
            <t-popconfirm :content="SINGLE_DELETE_CONFIRM" theme="danger" @confirm="handleDelete(row)">
              <t-button size="small" variant="text" theme="danger" :loading="Boolean(deletingMap[row.id])">
                {{ DELETE_ACTION_LABEL }}
              </t-button>
            </t-popconfirm>
          </t-space>
        </template>
        <template #empty>
          <t-empty :description="emptyDescription" />
        </template>
      </t-table>

      <div class="item-list__pagination" v-if="total > 0">
        <t-pagination :total="total" :current="page" :page-size="pageSize" show-page-size show-jumper
          @change="handlePaginationChange" />
      </div>
    </t-card>

    <t-dialog v-model:visible="dialogVisible" :header="dialogTitle" width="720px" destroy-on-close
      :confirm-btn="{ content: SAVE_ACTION_LABEL, loading: dialogSubmitting }"
      :cancel-btn="{ disabled: dialogSubmitting }" @confirm="handleDialogConfirm" @close="handleDialogClose">
      <t-loading :loading="dialogContentLoading" size="small">
        <t-form ref="formRef" :data="formModel" :rules="formRules" label-width="88" layout="vertical"
          :disabled="dialogSubmitting">
          <t-form-item name="title" :label="DIALOG_TITLE_LABEL">
            <t-input v-model="formModel.title" :placeholder="DIALOG_TITLE_PLACEHOLDER" clearable />
          </t-form-item>
          <t-form-item name="tag" :label="DIALOG_TAG_LABEL">
            <t-select
              v-model="formModel.tag"
              :options="tagOptions"
              :placeholder="DIALOG_TAG_PLACEHOLDER"
              :clearable="false"
            />
          </t-form-item>
          <t-form-item name="description" :label="DIALOG_DESCRIPTION_LABEL">
            <t-textarea v-model="formModel.description" :placeholder="DIALOG_DESCRIPTION_PLACEHOLDER" maxlength="255"
              show-limit-number auto-size />
          </t-form-item>
          <t-form-item name="context" :label="DIALOG_CONTEXT_LABEL">
            <Suspense>
              <RichTextEditor v-model="formModel.context" :placeholder="DIALOG_CONTEXT_PLACEHOLDER" />
              <template #fallback>
                <t-skeleton :row-col="[{ width: '100%' }]" animation="gradient" />
              </template>
            </Suspense>
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
