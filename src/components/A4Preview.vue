<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../store/editor'
import {
  createA4Layout,
  rectToPercent,
  getPrintSize,
} from '../utils/layout'
import CropCanvas from './CropCanvas.vue'
import DateStamp from './DateStamp.vue'
import { isDateStampEnabled } from '../utils/dateStamp'

withDefaults(defineProps<{ showEmptyGuides?: boolean }>(), { showEmptyGuides: true })

const store = useEditorStore()
const { slots } = storeToRefs(store)
const slotRects = computed(() => createA4Layout(store.layoutSettings))
const pageStyle = computed(() => ({ aspectRatio: `${getPrintSize(store.layoutSettings).widthPx} / ${getPrintSize(store.layoutSettings).heightPx}` }))
</script>

<template>
  <div class="a4-page" :style="pageStyle" :aria-label="`${getPrintSize(store.layoutSettings).label} 页面预览`">
    <div
      v-for="(rect, index) in slotRects"
      :key="slots[index]?.id ?? index"
      class="preview-slot"
      :class="{ 'preview-slot--empty': !slots[index]?.image && showEmptyGuides }"
      :style="rectToPercent(rect, store.layoutSettings)"
    >
      <CropCanvas
        v-if="slots[index]?.image"
        :image="slots[index]!.image!"
        :label="`页面预览第 ${index + 1} 格`"
      />
      <DateStamp
        v-if="isDateStampEnabled(slots[index]?.image?.dateStamp ?? null)"
        :date-stamp="slots[index]!.image!.dateStamp!"
        :format="store.dateFormat"
      />
      <span v-else-if="showEmptyGuides">{{ index + 1 }}</span>
    </div>
  </div>
</template>

<style scoped>
.a4-page {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
  box-shadow: var(--shadow);
}

.preview-slot {
  position: absolute;
  overflow: hidden;
  background: #fff;
  container-type: inline-size;
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
