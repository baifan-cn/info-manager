<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const editableRef = ref<HTMLDivElement | null>(null)
const isComposing = ref(false)
const localValue = computed(() => props.modelValue || '')

const updateContent = () => {
  const el = editableRef.value
  if (!el) return
  const html = el.innerHTML || ''
  const stripped = el.innerText?.trim() ?? ''
  if (!stripped) {
    emit('update:modelValue', '')
    return
  }
  emit('update:modelValue', html)
}

const syncContent = (value: string) => {
  const el = editableRef.value
  if (!el) return
  if (el.innerHTML !== value) {
    el.innerHTML = value
  }
}

const handleInput = () => {
  if (isComposing.value) return
  updateContent()
}

const handleCompositionStart = () => {
  isComposing.value = true
}

const handleCompositionEnd = () => {
  isComposing.value = false
  updateContent()
}

const handleCommand = (command: string) => {
  const el = editableRef.value
  if (!el) return
  el.focus()
  document.execCommand(command, false)
  updateContent()
}

const handleClear = () => {
  if (!editableRef.value) return
  editableRef.value.innerHTML = ''
  emit('update:modelValue', '')
}

const bindListeners = (el: HTMLDivElement | null) => {
  if (!el) return
  el.addEventListener('input', handleInput)
  el.addEventListener('compositionstart', handleCompositionStart)
  el.addEventListener('compositionend', handleCompositionEnd)
}

const unbindListeners = (el: HTMLDivElement | null) => {
  if (!el) return
  el.removeEventListener('input', handleInput)
  el.removeEventListener('compositionstart', handleCompositionStart)
  el.removeEventListener('compositionend', handleCompositionEnd)
}

onMounted(() => {
  syncContent(localValue.value)
})

onBeforeUnmount(() => {
  unbindListeners(editableRef.value)
})

watch(
  () => localValue.value,
  (val) => {
    if (isComposing.value) return
    syncContent(val)
  },
)

watch(editableRef, (el, prev) => {
  if (prev) unbindListeners(prev)
  if (el) {
    bindListeners(el)
    syncContent(localValue.value)
  }
})
</script>

<template>
  <div class="rich-text-editor">
    <div class="rich-text-editor__toolbar">
      <t-space size="small">
        <t-button size="small" variant="text" @click="handleCommand('bold')">加粗</t-button>
        <t-button size="small" variant="text" @click="handleCommand('italic')">斜体</t-button>
        <t-button size="small" variant="text" @click="handleCommand('underline')">
          下划线
        </t-button>
        <t-button size="small" variant="text" @click="handleCommand('insertUnorderedList')">
          无序列表
        </t-button>
        <t-button size="small" variant="text" @click="handleCommand('insertOrderedList')">
          有序列表
        </t-button>
        <t-button size="small" variant="text" @click="handleClear">清空</t-button>
      </t-space>
    </div>
    <div
      ref="editableRef"
      class="rich-text-editor__input"
      contenteditable="true"
      :data-placeholder="props.placeholder || '请输入内容'"
    />
  </div>
</template>

<style scoped>
.rich-text-editor {
  border: 1px solid var(--td-border-level-1-color);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  transition: border-color 0.2s ease;
}

.rich-text-editor__toolbar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--td-border-level-1-color);
}

.rich-text-editor__input {
  min-height: 200px;
  outline: none;
  padding: 12px;
  line-height: 1.6;
  overflow-y: auto;
  word-break: break-word;
}

.rich-text-editor__input:empty::before {
  content: attr(data-placeholder);
  color: var(--td-text-color-placeholder);
}

.rich-text-editor:focus-within {
  border-color: var(--td-brand-color);
  box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
}

.rich-text-editor :deep(.t-button) {
  color: var(--td-text-color-secondary);
}

.rich-text-editor :deep(.t-button:hover) {
  color: var(--td-brand-color);
}
</style>
