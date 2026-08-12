<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { VueDraggable } from 'vue-draggable-plus'
import { ArrowLeft, ArrowRight, RefreshLeft } from '@element-plus/icons-vue'
import { useEditorStore } from '../store/editor'
import { getSlotAspectRatio } from '../utils/layout'
import { PRINT_SIZES } from '../config'
import type { CropTransform } from '../store/editor.types'
import ImageSlot from './ImageSlot.vue'

interface DragEventLike {
  oldIndex?: number
  newIndex?: number
}

const emit = defineEmits<{ add: [index: number]; duplicate: [index: number]; dropFiles: [index: number, files: File[]] }>()
const store = useEditorStore()
const { slots, selectedImage, selectedImageId } = storeToRefs(store)
const gridStyle = computed(() => ({
  '--slot-ratio': String(getSlotAspectRatio(store.layoutSettings)),
  '--editor-gap': `${Math.min(store.imageGapMm, 20)}px`,
  '--grid-columns': String(PRINT_SIZES[store.sizeId].columns),
}))
const zoom = computed({
  get: () => selectedImage.value?.crop.zoom ?? 1,
  set: (value: number) => {
    if (!selectedImage.value) return
    store.updateCrop(selectedImage.value.id, { ...selectedImage.value.crop, zoom: value })
  },
})
const selectedIndex = computed(() =>
  slots.value.findIndex((slot) => slot.image?.id === selectedImageId.value),
)
const announce = ref('')

function updateCrop(imageId: string, crop: CropTransform): void {
  store.updateCrop(imageId, crop)
}

async function onDropFiles(index: number, files: File[]): Promise<void> {
  const report = await store.addFiles(files, index)
  if (report.added > 0) {
    announce.value = `已添加 ${report.added} 张图片`
  }
}

function moveSelected(direction: -1 | 1): void {
  const from = selectedIndex.value
  const to = from + direction
  if (from < 0 || to < 0 || to >= slots.value.length) return
  store.moveImage(from, to)
  announce.value = `图片已移动到第 ${to + 1} 格`
}

function resetCrop(): void {
  if (!selectedImage.value) return
  store.updateCrop(selectedImage.value.id, { zoom: 1, offsetX: 0, offsetY: 0 })
}

function onDragEnd(event: DragEventLike): void {
  store.finishDrag(event.oldIndex, event.newIndex)
  if (event.newIndex !== undefined) announce.value = `图片已移动到第 ${event.newIndex + 1} 格`
}
</script>

<template>
  <section class="layout-editor" aria-labelledby="layout-title">
    <div class="section-heading">
      <div>
        <h2 id="layout-title">排版顺序</h2>
        <p>{{ store.imageCount }}/{{ PRINT_SIZES[store.sizeId].columns * PRINT_SIZES[store.sizeId].rows }} 张，拖动手柄调整顺序</p>
      </div>
    </div>

    <VueDraggable
      v-model="slots"
      class="layout-grid"
      :style="gridStyle"
      item-key="id"
      handle=".drag-handle"
      :animation="160"
      ghost-class="drag-ghost"
      @start="store.captureDrag"
      @end="onDragEnd"
    >
      <ImageSlot
        v-for="(slot, index) in slots"
        :key="slot.id"
        :item="slot"
        :index="index"
        :selected="slot.image?.id === selectedImageId"
        @add="emit('add', $event)"
        @duplicate="emit('duplicate', $event)"
        @remove="store.removeImage"
        @select="store.selectImage"
        @update-crop="updateCrop"
        @drop-files="onDropFiles"
      />
    </VueDraggable>

    <div v-if="selectedImage" class="adjustment-bar">
      <div class="adjustment-name" :title="selectedImage.name">
        <span>当前图片</span>
        <strong>{{ selectedImage.name }}</strong>
      </div>
      <div class="zoom-control">
        <span>缩放</span>
        <el-slider v-model="zoom" :min="1" :max="3" :step="0.05" aria-label="图片缩放" />
        <span>{{ zoom.toFixed(2) }}x</span>
      </div>
      <div class="adjustment-actions">
        <el-tooltip content="向前移动" placement="top">
          <el-button
            class="icon-button"
            circle
            :icon="ArrowLeft"
            :disabled="selectedIndex <= 0"
            aria-label="向前移动图片"
            @click="moveSelected(-1)"
          />
        </el-tooltip>
        <el-tooltip content="向后移动" placement="top">
          <el-button
            class="icon-button"
            circle
            :icon="ArrowRight"
            :disabled="selectedIndex < 0 || selectedIndex >= slots.length - 1"
            aria-label="向后移动图片"
            @click="moveSelected(1)"
          />
        </el-tooltip>
        <el-tooltip content="重置裁剪" placement="top">
          <el-button
            class="icon-button"
            circle
            :icon="RefreshLeft"
            aria-label="重置图片裁剪"
            @click="resetCrop"
          />
        </el-tooltip>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ announce }}</p>
  </section>
</template>

<style scoped>
.layout-editor {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-heading h2 {
  margin: 0;
  font-size: 17px;
  line-height: 1.3;
}

.section-heading p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), minmax(0, 1fr));
  gap: var(--editor-gap);
}

.drag-ghost {
  opacity: 0.35;
}

.adjustment-bar {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(220px, 1.5fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 58px;
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--surface-subtle);
  border: 1px solid var(--line);
  border-radius: 6px;
}

.adjustment-name {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.adjustment-name span,
.zoom-control > span {
  color: var(--text-muted);
  font-size: 12px;
}

.adjustment-name strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zoom-control {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(100px, 1fr) 42px;
  align-items: center;
  gap: 10px;
}

.adjustment-actions {
  display: flex;
  gap: 6px;
}

@media (max-width: 720px) {
  .layout-grid {
    gap: min(var(--editor-gap), 10px);
  }

  .adjustment-bar {
    grid-template-columns: 1fr auto;
    gap: 10px;
  }

  .zoom-control {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
