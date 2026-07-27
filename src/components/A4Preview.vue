<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../store/editor'
import {
  createA4Layout,
  rectToPercent,
} from '../utils/layout'
import CropCanvas from './CropCanvas.vue'

withDefaults(defineProps<{ showEmptyGuides?: boolean }>(), { showEmptyGuides: true })

const store = useEditorStore()
const { slots } = storeToRefs(store)
const slotRects = computed(() => createA4Layout(store.layoutSettings))
</script>

<template>
  <div class="a4-page" aria-label="A4 页面预览">
    <div
      v-for="(rect, index) in slotRects"
      :key="slots[index]?.id ?? index"
      class="preview-slot"
      :class="{ 'preview-slot--empty': !slots[index]?.image && showEmptyGuides }"
      :style="rectToPercent(rect)"
    >
      <CropCanvas
        v-if="slots[index]?.image"
        :image="slots[index]!.image!"
        :label="`A4 预览第 ${index + 1} 格`"
      />
      <span v-else-if="showEmptyGuides">{{ index + 1 }}</span>
    </div>
  </div>
</template>

<style scoped>
.a4-page {
  position: relative;
  width: 100%;
  aspect-ratio: 210 / 297;
  overflow: hidden;
  background: #fff;
  box-shadow: var(--shadow);
}

.preview-slot {
  position: absolute;
  overflow: hidden;
  background: #fff;
}

.preview-slot--empty {
  display: grid;
  place-items: center;
  color: #a8b0b8;
  background: #fafbfc;
  border: 1px dashed #cdd3d9;
  font-size: clamp(8px, 1.2vw, 12px);
}

</style>
