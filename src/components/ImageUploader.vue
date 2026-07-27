<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Upload } from '@element-plus/icons-vue'
import { useEditorStore } from '../store/editor'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    disabled?: boolean
  }>(),
  {
    compact: false,
    disabled: false,
  },
)

const store = useEditorStore()
const input = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

function openPicker(): void {
  if (!props.disabled) input.value?.click()
}

async function processFiles(files: File[]): Promise<void> {
  if (props.disabled || files.length === 0) return
  const report = await store.addFiles(files)

  if (report.added > 0) {
    ElMessage.success(`已添加 ${report.added} 张图片`)
  }
  if (report.skippedForCapacity > 0) {
    ElMessage.warning(`版面最多容纳 9 张图片，已跳过 ${report.skippedForCapacity} 张`)
  }
  if (report.rejected.length > 0) {
    ElMessage.error(report.rejected.join('；'))
  }
}

async function onChange(event: Event): Promise<void> {
  const target = event.target as HTMLInputElement
  await processFiles(Array.from(target.files ?? []))
  target.value = ''
}

async function onDrop(event: DragEvent): Promise<void> {
  isDragging.value = false
  await processFiles(Array.from(event.dataTransfer?.files ?? []))
}
</script>

<template>
  <div
    v-if="!compact"
    class="upload-zone"
    :class="{ 'upload-zone--active': isDragging, 'upload-zone--disabled': disabled }"
    role="button"
    tabindex="0"
    aria-label="上传图片"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <el-icon :size="28"><Upload /></el-icon>
    <strong>添加图片</strong>
    <span>点击选择或拖入 JPG、PNG、WebP</span>
  </div>

  <el-button v-else type="primary" :icon="Plus" :disabled="disabled" @click="openPicker">
    添加图片
  </el-button>

  <input
    ref="input"
    class="sr-only"
    type="file"
    accept="image/jpeg,image/png,image/webp"
    multiple
    :disabled="disabled"
    @change="onChange"
  />
</template>

<style scoped>
.upload-zone {
  min-height: 136px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  padding: 20px;
  color: var(--text-muted);
  background: var(--surface-subtle);
  border: 1px dashed var(--line-strong);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.upload-zone strong {
  color: var(--text);
  font-size: 15px;
}

.upload-zone span {
  font-size: 13px;
  text-align: center;
}

.upload-zone:hover,
.upload-zone:focus-visible,
.upload-zone--active {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: var(--accent);
  outline: none;
}

.upload-zone--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
