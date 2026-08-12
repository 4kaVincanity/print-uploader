<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Download, Picture, Printer } from '@element-plus/icons-vue'
import { useEditorStore } from '../store/editor'
import ImageUploader from '../components/ImageUploader.vue'
import LayoutGrid from '../components/LayoutGrid.vue'
import A4Preview from '../components/A4Preview.vue'
import LayoutSettings from '../components/LayoutSettings.vue'

const emit = defineEmits<{ openBeanCard: [] }>()
const store = useEditorStore()
const { generatedResult, generationStatus, generationError, canDownload } = storeToRefs(store)
const previewDialogVisible = ref(false)
const hiddenInput = ref<HTMLInputElement | null>(null)
const pendingAddSlotIndex = ref<number | null>(null)

function triggerAdd(slotIndex?: number): void {
  pendingAddSlotIndex.value = slotIndex ?? null
  hiddenInput.value?.click()
}

async function duplicateToSlot(slotIndex: number): Promise<void> {
  await store.duplicateImage(slotIndex)
}

async function addFromHiddenInput(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  const targetSlotIndex = pendingAddSlotIndex.value
  pendingAddSlotIndex.value = null
  if (files.length > 0) {
    const report = await store.addFiles(files, targetSlotIndex ?? undefined)
    if (report.added) ElMessage.success(`已添加 ${report.added} 张图片`)
    if (report.skippedForCapacity) ElMessage.warning('版面最多容纳 9 张图片')
    if (report.rejected.length) ElMessage.error(report.rejected.join('；'))
  }
  input.value = ''
}

async function generatePreview(): Promise<void> {
  try {
    await store.generatePreview()
    previewDialogVisible.value = true
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '生成失败，请重试')
  }
}

function download(): void {
  if (!store.downloadGenerated()) {
    ElMessage.warning('请先生成最新预览')
    return
  }
  previewDialogVisible.value = false
}

onBeforeUnmount(store.cleanup)
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-block">
        <div class="brand-icon"><el-icon :size="22"><Printer /></el-icon></div>
        <div>
          <h1>A4 图片排版</h1>
          <p>3 × 3 网格 · 300 DPI PNG</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="emit('openBeanCard')">咖啡豆卡生成</el-button>
        <ImageUploader
          compact
          :disabled="store.remainingCapacity === 0"
        />
        <el-button
          type="primary"
          :icon="Picture"
          :loading="generationStatus === 'generating'"
          :disabled="store.imageCount === 0 || generationStatus === 'generating'"
          @click="generatePreview"
        >
          生成预览
        </el-button>
      </div>
    </header>

    <main class="workspace">
      <section class="editor-pane">
        <LayoutSettings />
        <ImageUploader v-if="store.imageCount === 0" />
        <LayoutGrid
          v-else
          @add="triggerAdd"
          @duplicate="duplicateToSlot"
          @drop-files="async (index, files) => { await store.addFiles(files, index) }"
        />
        <input
          ref="hiddenInput"
          class="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          @change="addFromHiddenInput"
        />
      </section>

      <aside class="preview-pane" aria-labelledby="preview-heading">
        <div class="preview-heading-row">
          <div>
            <h2 id="preview-heading">页面预览</h2>
            <p>A4 竖版 · {{ store.pageMarginMm }} mm 边距 · {{ store.imageGapMm }} mm 间距</p>
          </div>
          <el-button
            class="icon-button"
            circle
            :icon="Download"
            :disabled="!canDownload"
            aria-label="下载已生成的 PNG"
            @click="download"
          />
        </div>
        <div class="preview-frame">
          <A4Preview />
        </div>
        <el-alert
          v-if="generationError"
          :title="generationError"
          type="error"
          :closable="false"
          show-icon
        />
        <p class="print-note">输出尺寸 2480 × 3508 px。打印时选择 A4，并使用 100% 或适合页面。</p>
      </aside>
    </main>

    <el-dialog
      v-model="previewDialogVisible"
      title="确认 A4 排版"
      width="min(720px, 92vw)"
      align-center
      destroy-on-close
    >
      <div v-if="generatedResult" class="generated-preview">
        <img :src="generatedResult.url" alt="已生成的 A4 排版效果" />
        <div class="generated-meta">
          <span>{{ generatedResult.width }} × {{ generatedResult.height }} px</span>
          <span>PNG · 浏览器本地生成</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">返回调整</el-button>
        <el-button type="primary" :icon="Download" :disabled="!canDownload" @click="download">
          下载 PNG
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px clamp(16px, 3vw, 36px);
  background: rgb(255 255 255 / 94%);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(12px);
}

.brand-block,
.header-actions,
.preview-heading-row,
.generated-meta {
  display: flex;
  align-items: center;
}

.brand-block {
  min-width: 0;
  gap: 11px;
}

.brand-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  color: #fff;
  background: var(--accent);
  border-radius: 6px;
}

.brand-block h1,
.preview-heading-row h2 {
  margin: 0;
  letter-spacing: 0;
}

.brand-block h1 {
  font-size: 18px;
}

.brand-block p,
.preview-heading-row p {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.header-actions {
  gap: 8px;
}

.workspace {
  width: min(1480px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 410px);
  gap: clamp(18px, 3vw, 38px);
  margin: 0 auto;
  padding: clamp(18px, 3vw, 34px);
}

.editor-pane,
.preview-pane {
  min-width: 0;
}

.editor-pane {
  padding: clamp(16px, 2.4vw, 28px);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 7px;
}

.preview-pane {
  align-self: start;
  position: sticky;
  top: 98px;
}

.preview-heading-row {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.preview-heading-row h2 {
  font-size: 17px;
}

.preview-frame {
  width: min(100%, 390px);
  margin: 0 auto;
  padding: 10px;
  background: #dfe4e8;
  border: 1px solid #c9d0d7;
}

.print-note {
  margin: 14px 0 0;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.6;
}

.generated-preview {
  max-height: 68vh;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
}

.generated-preview img {
  min-height: 0;
  max-width: 100%;
  max-height: 60vh;
  justify-self: center;
  object-fit: contain;
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
}

.generated-meta {
  justify-content: center;
  gap: 18px;
  color: var(--text-muted);
  font-size: 12px;
}

@media (max-width: 980px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr) minmax(270px, 320px);
    gap: 18px;
  }
}

@media (max-width: 760px) {
  .app-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions :deep(.el-button) {
    flex: 1;
    margin-left: 0;
  }

  .workspace {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .editor-pane {
    padding: 12px;
  }

  .preview-pane {
    position: static;
  }

  .preview-frame {
    width: min(100%, 430px);
  }
}

@media (max-width: 420px) {
  .brand-block p {
    display: none;
  }

  .header-actions :deep(.el-button span) {
    font-size: 13px;
  }

  .generated-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
