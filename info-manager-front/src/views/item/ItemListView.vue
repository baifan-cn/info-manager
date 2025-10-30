<script setup lang="ts">
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
import {
  MessagePlugin,
  type FormInstanceFunctions,
  type FormRules,
  type PrimaryTableCol,
  type TableSort,
} from 'tdesign-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useItemStore } from '../../stores/item'
import type { Item } from '../../types/item'
import { resolveErrorMessage } from '../../utils/error'

interface PaginationChangeContext {
  current: number
  pageSize: number
}

const { t, locale } = useI18n()
const itemStore = useItemStore()
const router = useRouter()

const RichTextEditor = defineAsyncComponent(() =>
  import('../../components/common/RichTextEditor.vue'),
)

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
}

const formModel = reactive<ItemFormModel>({
  title: '',
  description: '',
  context: '',
})

const formRules = computed<FormRules<ItemFormModel>>(() => ({
  title: [
    { required: true, message: t('items.validation.titleRequired'), trigger: 'blur' },
    { max: 255, message: t('items.validation.titleMax'), trigger: 'blur' },
  ],
  description: [{ max: 255, message: t('items.validation.descriptionMax'), trigger: 'blur' }],
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
const dialogTitle = computed(() =>
  isEditMode.value ? t('items.dialog.editTitle') : t('items.dialog.createTitle'),
)
const dialogSubmitting = computed(() =>
  isEditMode.value
    ? Boolean(editingId.value && updatingMap.value[editingId.value])
    : creating.value,
)
const dialogContentLoading = computed(() => isEditMode.value && detailLoading.value)
const placeholderText = computed(() => t('common.placeholder'))
const emptyDescription = computed(() => t('items.empty'))
const tableLoading = computed(() =>
  loading.value ? { loading: true, text: t('common.loading') } : false,
)

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value, {
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
    title: t('items.columns.title'),
    align: 'left',
    minWidth: 180,
    fixed: 'left',
  },
  {
    colKey: 'description',
    title: t('items.columns.description'),
    ellipsis: true,
    minWidth: 220,
  },
  {
    colKey: 'owner_id',
    title: t('items.columns.owner'),
    minWidth: 160,
  },
  {
    colKey: 'created_at',
    title: t('items.columns.createdAt'),
    minWidth: 180,
    sorter: true,
    sortType: 'all',
  },
  {
    colKey: 'updated_at',
    title: t('items.columns.updatedAt'),
    minWidth: 180,
    sorter: true,
    sortType: 'all',
  },
  {
    colKey: 'actions',
    title: t('items.columns.actions'),
    width: 160,
    fixed: 'right',
  },
])

const errorMessage = (error: unknown, fallbackKey = 'feedback.actionFailed') =>
  resolveErrorMessage(error, t(fallbackKey))

const exportFileName = computed(() => {
  const date = new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/[\/\\]/g, '-')
  return `${t('items.listTitle')}-${date}.csv`
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
    await itemStore.fetchItems({ page: 1, search: searchForm.keyword.trim(), force: true })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
  }
}

const handleReset = async () => {
  searchForm.keyword = ''
  if (searchTimer) {
    clearTimeout(searchTimer)
    searchTimer = null
  }
  try {
    await itemStore.fetchItems({ page: 1, search: '', force: true })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
  }
}

const handleRefresh = async () => {
  try {
    await itemStore.fetchItems({ force: true })
    MessagePlugin.success(t('items.refreshSuccess'))
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
  }
}

const handleExport = async () => {
  if (!hasItems.value) {
    MessagePlugin.info(t('common.state.empty'))
    return
  }
  exporting.value = true
  try {
    const header = buildCsvRow([
      t('items.columns.title'),
      t('items.columns.description'),
      t('items.columns.owner'),
      t('items.columns.createdAt'),
      t('items.columns.updatedAt'),
    ])
    const rows = items.value.map((item) =>
      buildCsvRow([
        item.title,
        item.description,
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
    MessagePlugin.success(t('items.exportSuccess'))
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'items.exportFailed'))
  } finally {
    exporting.value = false
  }
}

const handlePaginationChange = async ({ current, pageSize }: PaginationChangeContext) => {
  try {
    await itemStore.fetchItems({ page: current, pageSize, force: true })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
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
    await itemStore.fetchItems({ page: 1, sortField, sortOrder, force: true })
    selectedRowKeys.value = []
  } catch (error) {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
  }
}

const handleSelectionChange = (keys: Array<string | number>) => {
  selectedRowKeys.value = keys.map((key) => String(key))
}

const handleDelete = async (item: Item) => {
  try {
    await itemStore.deleteItemById(item.id)
    selectedRowKeys.value = selectedRowKeys.value.filter((key) => key !== item.id)
    MessagePlugin.success(t('items.deleteSuccess'))
  } catch (error) {
    MessagePlugin.error(errorMessage(error))
  }
}

const handleBulkDelete = async () => {
  if (!hasSelection.value) return
  try {
    await itemStore.bulkDeleteByIds(selectedRowKeys.value)
    selectedRowKeys.value = []
    MessagePlugin.success(t('items.bulkDeleteSuccess'))
  } catch (error) {
    MessagePlugin.error(errorMessage(error))
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
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
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
      MessagePlugin.success(t('items.updateSuccess'))
    } else {
      await itemStore.createItem(payload)
      MessagePlugin.success(t('items.createSuccess'))
      selectedRowKeys.value = []
    }
    dialogVisible.value = false
  } catch (error) {
    MessagePlugin.error(errorMessage(error))
  }
}

const handleShortcut = (event: KeyboardEvent) => {
  if (!(event.metaKey || event.ctrlKey)) return
  const key = event.key.toLowerCase()
  if (key === 'k') {
    event.preventDefault()
    focusSearchInput()
  }
  if (key === 'n') {
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
        .fetchItems({ page: 1, search: value.trim(), force: false })
        .catch((error) => {
          MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
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
  itemStore.fetchItems({ force: true }).catch((error) => {
    MessagePlugin.error(errorMessage(error, 'feedback.fetchFailed'))
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
    <t-card :title="t('items.listTitle')" bordered>
      <div class="item-list__toolbar">
        <div class="item-list__search">
          <t-input
            ref="searchInputRef"
            v-model="searchForm.keyword"
            :placeholder="t('items.searchPlaceholder')"
            clearable
            @enter="handleSearch"
          />
          <t-button theme="primary" @click="handleSearch">
            {{ t('common.actions.search') }}
          </t-button>
          <t-button variant="outline" @click="handleReset">
            {{ t('common.actions.reset') }}
          </t-button>
        </div>
        <t-space size="small">
          <t-tooltip :content="t('items.shortcuts.create')">
            <t-button theme="primary" @click="openCreateDialog">
              {{ t('common.actions.createItem') }}
            </t-button>
          </t-tooltip>
          <t-button variant="outline" @click="handleRefresh">
            {{ t('common.actions.refresh') }}
          </t-button>
          <t-button
            variant="outline"
            :loading="exporting"
            :disabled="!hasItems"
            @click="handleExport"
          >
            {{ t('items.exportButton') }}
          </t-button>
          <t-popconfirm
            :content="t('items.bulkDeleteConfirm')"
            theme="danger"
            :disabled="!hasSelection || bulkDeleting"
            @confirm="handleBulkDelete"
          >
            <t-button theme="danger" :disabled="!hasSelection" :loading="bulkDeleting">
              {{ t('common.actions.bulkDelete') }}
            </t-button>
          </t-popconfirm>
        </t-space>
      </div>

      <t-table
        row-key="id"
        :data="items"
        :loading="tableLoading"
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
          <span>{{ row.description || placeholderText }}</span>
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
              {{ t('common.actions.view') }}
            </t-button>
            <t-button size="small" variant="text" @click="openEditDialog(row)">
              {{ t('common.actions.edit') }}
            </t-button>
            <t-popconfirm
              :content="t('items.deleteConfirm')"
              theme="danger"
              @confirm="handleDelete(row)"
            >
              <t-button
                size="small"
                variant="text"
                theme="danger"
                :loading="Boolean(deletingMap[row.id])"
              >
                {{ t('common.actions.delete') }}
              </t-button>
            </t-popconfirm>
          </t-space>
        </template>
        <template #empty>
          <t-empty :description="emptyDescription" />
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
      :confirm-btn="{ content: t('common.actions.save'), loading: dialogSubmitting }"
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
          <t-form-item name="title" :label="t('items.dialog.titleLabel')">
            <t-input
              v-model="formModel.title"
              :placeholder="t('items.dialog.titlePlaceholder')"
              clearable
            />
          </t-form-item>
          <t-form-item name="description" :label="t('items.dialog.descriptionLabel')">
            <t-textarea
              v-model="formModel.description"
              :placeholder="t('items.dialog.descriptionPlaceholder')"
              maxlength="255"
              show-limit-number
              auto-size
            />
          </t-form-item>
          <t-form-item name="context" :label="t('items.dialog.contextLabel')">
            <Suspense>
              <RichTextEditor
                v-model="formModel.context"
                :placeholder="t('items.dialog.contextPlaceholder')"
              />
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
