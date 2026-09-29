<script setup lang="ts">
import { Calendar, Delete, DocumentCopy, Rank } from '@element-plus/icons-vue'
import type { CropTransform, DateStampFormat, DateStampPosition, LayoutSlot } from '../store/editor.types'
import { isDateStampEnabled } from '../utils/dateStamp'
import CropCanvas from './CropCanvas.vue'
import DateStamp from './DateStamp.vue'

const props = defineProps<{
  item: LayoutSlot
  index: number
  selected: boolean
  dateFormat: DateStampFormat
}>()

const emit = defineEmits<{
  remove: [index: number]
  duplicate: [index: number]
  select: [imageId: string]
  updateCrop: [imageId: string, crop: CropTransform]
  toggleDate: [imageId: string]
  updateDatePosition: [imageId: string, position: DateStampPosition]
  add: [index: number]
  dropFiles: [index: number, files: File[]]
}>()

function onDrop(event: DragEvent): void {
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length > 0) emit('dropFiles', props.index, files)
}
</script>

<template>
  <div
    class="grid-slot"
    :class="{
      'grid-slot--empty': !item.image,
      'grid-slot--selected': selected,
    }"
    @dragover.prevent
    @drop.prevent="onDrop"
  >
    <template v-if="item.image">
      <CropCanvas
        :image="item.image"
        interactive
        :label="`第 ${index + 1} 格：${item.image.name}`"
        @select="emit('select', item.image!.id)"
        @update-crop="emit('updateCrop', item.image!.id, $event)"
      />
      <DateStamp
        v-if="isDateStampEnabled(item.image.dateStamp)"
        :date-stamp="item.image.dateStamp!"
        :format="dateFormat"
        interactive
        :label="`第 ${index + 1} 张图片日期`"
        @select="emit('select', item.image!.id)"
        @update-position="emit('updateDatePosition', item.image!.id, $event)"
      />
      <div class="slot-index">{{ index + 1 }}</div>
      <div class="slot-actions">
        <el-tooltip :content="isDateStampEnabled(item.image.dateStamp) ? '移除日期' : '添加日期'" placement="top">
          <el-button
            class="icon-button"
            circle
            size="small"
            :type="isDateStampEnabled(item.image.dateStamp) ? 'primary' : ''"
            :icon="Calendar"
            :aria-label="`${isDateStampEnabled(item.image.dateStamp) ? '移除' : '添加'}第 ${index + 1} 张图片的日期`"
            @click.stop="emit('toggleDate', item.image!.id)"
          />
        </el-tooltip>
        <el-tooltip content="拖动调整顺序" placement="top">
          <el-button
            class="drag-handle icon-button"
            circle
            size="small"
            :icon="Rank"
            :aria-label="`拖动第 ${index + 1} 张图片`"
            @click.stop
          />
        </el-tooltip>
        <el-tooltip content="复制图片" placement="top">
          <el-button
            class="icon-button"
            circle
            size="small"
            :icon="DocumentCopy"
            :aria-label="`复制第 ${index + 1} 张图片`"
            @click.stop="emit('duplicate', index)"
          />
        </el-tooltip>
        <el-tooltip content="删除图片" placement="top">
          <el-button
            class="icon-button"
            circle
            size="small"
            type="danger"
            plain
            :icon="Delete"
            :aria-label="`删除第 ${index + 1} 张图片`"
            @click.stop="emit('remove', index)"
          />
        </el-tooltip>
      </div>
    </template>

    <button
      v-else
      class="empty-slot-button"
      type="button"
      @click="emit('add', index)"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <span class="empty-slot-number">{{ index + 1 }}</span>
      <span>空位</span>
    </button>
  </div>
</template>

<style scoped>
.grid-slot {
  position: relative;
  min-width: 0;
  overflow: hidden;
  aspect-ratio: var(--slot-ratio);
  background: #e8ecef;
  border: 2px solid transparent;
  border-radius: 5px;
  transition: border-color 140ms ease, box-shadow 140ms ease;
  container-type: inline-size;
}

.grid-slot--selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.grid-slot--empty {
  border: 1px dashed var(--line-strong);
  background: var(--surface-subtle);
}

.slot-index {
  position: absolute;
  top: 6px;
  left: 6px;
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  padding: 0 5px;
  color: #fff;
  background: rgb(25 31 37 / 76%);
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 3;
}

.slot-actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 5px;
  z-index: 3;
}

.drag-handle {
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.empty-slot-button {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 5px;
  color: var(--text-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.empty-slot-button:hover,
.empty-slot-button:focus-visible {
  color: var(--accent);
  background: var(--accent-soft);
  outline: none;
}

.empty-slot-number {
  font-size: 20px;
  font-weight: 700;
}

@media (max-width: 720px) {
  .slot-actions {
    right: 4px;
    bottom: 4px;
    gap: 3px;
  }

  .slot-index {
    top: 4px;
    left: 4px;
  }
}

@container (max-width: 140px) {
  .slot-actions {
    width: 52px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
