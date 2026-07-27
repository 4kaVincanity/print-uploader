<script setup lang="ts">
import { Delete, Rank } from '@element-plus/icons-vue'
import type { CropTransform, LayoutSlot } from '../store/editor.types'
import CropCanvas from './CropCanvas.vue'

defineProps<{
  item: LayoutSlot
  index: number
  selected: boolean
}>()

const emit = defineEmits<{
  remove: [index: number]
  select: [imageId: string]
  updateCrop: [imageId: string, crop: CropTransform]
  add: [index: number]
}>()
</script>

<template>
  <div
    class="grid-slot"
    :class="{
      'grid-slot--empty': !item.image,
      'grid-slot--selected': selected,
    }"
  >
    <template v-if="item.image">
      <CropCanvas
        :image="item.image"
        interactive
        :label="`第 ${index + 1} 格：${item.image.name}`"
        @select="emit('select', item.image!.id)"
        @update-crop="emit('updateCrop', item.image!.id, $event)"
      />
      <div class="slot-index">{{ index + 1 }}</div>
      <div class="slot-actions">
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

    <button v-else class="empty-slot-button" type="button" @click="emit('add', index)">
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
}

.slot-actions {
  position: absolute;
  right: 6px;
  bottom: 6px;
  display: flex;
  gap: 5px;
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
</style>
