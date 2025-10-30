<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  MessagePlugin,
  type FormInstanceFunctions,
  type FormRules,
} from 'tdesign-vue-next'
import RichTextEditor from '../../components/common/RichTextEditor.vue'
import { useItemStore } from '../../stores/item'
import { ITEM_TAG_LABEL_MAP, ITEM_TAG_VALUES } from '../../types/item'
import type { Item, ItemTag } from '../../types/item'

interface ItemFormModel {
  title: string
  description: string
  context: string
  tag: ItemTag
}

const route = useRoute()
const router = useRouter()
const itemStore = useItemStore()

const PLACEHOLDER_TEXT = '—'
const DEFAULT_TAG: ItemTag = 'DEFAULT'
const tagOptions = ITEM_TAG_VALUES.map((value) => ({
  label: ITEM_TAG_LABEL_MAP[value],
  value,
})) as Array<{ label: string; value: ItemTag }>

const resolveTagLabel = (tag?: ItemTag | null) => {
  if (!tag) return PLACEHOLDER_TEXT
  return ITEM_TAG_LABEL_MAP[tag] ?? tag
}

const editDialogVisible = ref(false)
const formRef = ref<FormInstanceFunctions<ItemFormModel> | null>(null)
const formModel = reactive<ItemFormModel>({
  title: '',
  description: '',
  context: '',
  tag: DEFAULT_TAG,
})

const formRules: FormRules<ItemFormModel> = {
  title: [
    { required: true, message: '请输入条目标题', trigger: 'blur' },
    { max: 255, message: '标题最多 255 个字符', trigger: 'blur' },
  ],
  description: [{ max: 255, message: '描述最多 255 个字符', trigger: 'blur' }],
  tag: [{ required: true, message: '请选择条目标签', trigger: 'change' }],
}

const detail = computed(() => itemStore.currentDetail)
const detailLoading = computed(() => itemStore.isDetailLoading)
const deleting = computed(() => (detail.value ? Boolean(itemStore.deletingMap[detail.value.id]) : false))
const updating = computed(() => (detail.value ? Boolean(itemStore.updatingIds[detail.value.id]) : false))
const hasContext = computed(
  () => Boolean(detail.value?.context && detail.value.context.replace(/<[^>]*>/g, '').trim()),
)

function extractErrorMessage(error: unknown) {
  if (!error) return '操作失败，请稍后重试'
  if (typeof error === 'string') return error
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return '操作失败，请稍后重试'
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
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

const loadItemDetail = async (id: string) => {
  if (!id) return
  if (itemStore.currentDetail && itemStore.currentDetail.id !== id) {
    itemStore.clearDetail()
  }
  try {
    await itemStore.fetchItemDetail(id)
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
    router.replace({ name: 'items' })
  }
}

const handleBack = () => {
  router.push({ name: 'items' })
}

const openEditDialog = () => {
  if (!detail.value) return
  populateForm(detail.value)
  editDialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleEditDialogClose = () => {
  editDialogVisible.value = false
}

const handleEditConfirm = async () => {
  if (!detail.value || updating.value) return
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
    await itemStore.updateItemById(detail.value.id, payload)
    MessagePlugin.success('条目信息已更新')
    editDialogVisible.value = false
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

const handleDelete = async () => {
  if (!detail.value || deleting.value) return
  try {
    await itemStore.deleteItemById(detail.value.id)
    itemStore.clearDetail()
    MessagePlugin.success('条目已删除')
    router.push({ name: 'items' })
  } catch (error) {
    MessagePlugin.error(extractErrorMessage(error))
  }
}

watch(editDialogVisible, (visible) => {
  if (!visible) {
    resetForm()
    formRef.value?.clearValidate()
  }
})

watch(
  () => route.params.id,
  (value) => {
    if (Array.isArray(value)) {
      loadItemDetail(value[0] ?? '')
    } else if (typeof value === 'string') {
      loadItemDetail(value)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  itemStore.clearDetail()
})
</script>

<template>
  <div class="item-detail-view">
    <t-card title="条目详情" bordered>
      <template #actions>
        <t-space size="small">
          <t-button variant="outline" @click="handleBack">返回列表</t-button>
          <t-button theme="primary" :disabled="!detail" @click="openEditDialog">
            快速编辑
          </t-button>
          <t-popconfirm
            v-if="detail"
            content="确认删除该条目？此操作不可恢复"
            theme="danger"
            :cancel-btn="{ disabled: deleting }"
            :confirm-btn="{ theme: 'danger', loading: deleting }"
            @confirm="handleDelete"
          >
            <t-button theme="danger" variant="outline" :loading="deleting">
              删除条目
            </t-button>
          </t-popconfirm>
        </t-space>
      </template>

      <t-loading :loading="detailLoading" size="small">
        <template v-if="detail">
          <t-descriptions :column="2" layout="horizontal" size="large" bordered>
            <t-descriptions-item label="标题">{{ detail.title }}</t-descriptions-item>
            <t-descriptions-item label="标签">
              {{ resolveTagLabel(detail.tag) }}
            </t-descriptions-item>
            <t-descriptions-item label="所有者">
              {{ detail.owner_id || '—' }}
            </t-descriptions-item>
            <t-descriptions-item label="描述" :span="2">
              {{ detail.description || '—' }}
            </t-descriptions-item>
            <t-descriptions-item label="创建时间">
              {{ formatDate(detail.created_at) }}
            </t-descriptions-item>
            <t-descriptions-item label="更新时间">
              {{ formatDate(detail.updated_at) }}
            </t-descriptions-item>
          </t-descriptions>

          <t-divider class="item-detail__divider" />

          <t-card class="item-detail__content-card" title="正文内容" bordered size="small">
            <div v-if="hasContext" class="item-detail__content" v-html="detail.context" />
            <t-empty v-else description="暂无正文内容" />
          </t-card>
        </template>
        <t-empty v-else description="未找到条目信息" />
      </t-loading>
    </t-card>

    <t-dialog
      v-model:visible="editDialogVisible"
      header="编辑条目信息"
      width="720px"
      destroy-on-close
      :confirm-btn="{ content: '保存', loading: updating }"
      :cancel-btn="{ disabled: updating }"
      @confirm="handleEditConfirm"
      @close="handleEditDialogClose"
    >
      <t-form
        ref="formRef"
        :data="formModel"
        :rules="formRules"
        label-width="88"
        layout="vertical"
        :disabled="updating"
      >
        <t-form-item name="title" label="标题">
          <t-input v-model="formModel.title" placeholder="请输入条目标题" clearable />
        </t-form-item>
        <t-form-item name="tag" label="标签">
          <t-select
            v-model="formModel.tag"
            :options="tagOptions"
            placeholder="请选择条目标签"
            :clearable="false"
          />
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
    </t-dialog>
  </div>
</template>

<style scoped>
.item-detail-view {
  padding: 24px;
  background: var(--td-bg-color-page);
  min-height: 100vh;
}

.item-detail__divider {
  margin: 24px 0 16px;
}

.item-detail__content-card {
  background: var(--td-bg-color-container);
}

.item-detail__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--td-text-color-primary);
  line-height: 1.6;
  word-break: break-word;
}

.item-detail__content :deep(p) {
  margin: 0;
}

.item-detail__content :deep(img) {
  max-width: 100%;
  height: auto;
}

.item-detail__content :deep(h1),
.item-detail__content :deep(h2),
.item-detail__content :deep(h3),
.item-detail__content :deep(h4),
.item-detail__content :deep(h5),
.item-detail__content :deep(h6) {
  margin: 12px 0 8px;
  font-weight: 600;
}

.item-detail__content :deep(ul),
.item-detail__content :deep(ol) {
  padding-left: 20px;
}

.item-detail__content :deep(blockquote) {
  margin: 0;
  padding-left: 12px;
  border-left: 4px solid var(--td-brand-color-5);
  color: var(--td-text-color-secondary);
}

@media (max-width: 640px) {
  .item-detail-view {
    padding: 16px;
  }

  .item-detail__content {
    font-size: 14px;
  }
}
</style>
