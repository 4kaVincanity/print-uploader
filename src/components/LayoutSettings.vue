<script setup lang="ts">
import { computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { PRINT_CONFIG, PRINT_SIZES } from '../config'
import { useEditorStore } from '../store/editor'

const store = useEditorStore()
const pageMargin = computed({
  get: () => store.pageMarginMm,
  set: (value: number | undefined) => store.setPageMargin(value),
})
const imageGap = computed({
  get: () => store.imageGapMm,
  set: (value: number | undefined) => store.setImageGap(value),
})
const sizeId = computed({
  get: () => store.sizeId,
  set: (value: keyof typeof PRINT_SIZES) => store.updateLayoutSettings({ sizeId: value }),
})
</script>

<template>
  <section class="layout-settings" aria-labelledby="layout-settings-title">
    <div class="settings-title">
      <el-icon :size="17"><Setting /></el-icon>
      <div>
        <h2 id="layout-settings-title">版面设置</h2>
        <p>默认铺满整张 A4 页面</p>
      </div>
    </div>
    <div class="settings-controls">
      <label class="size-control">
        <span>纸张尺寸</span>
        <el-select v-model="sizeId" aria-label="纸张尺寸">
          <el-option
            v-for="(size, id) in PRINT_SIZES"
            :key="id"
            :label="size.label"
            :value="id"
            :disabled="store.imageCount > size.columns * size.rows"
          />
        </el-select>
      </label>
      <label>
        <span>页面边距</span>
        <el-input-number
          v-model="pageMargin"
          :min="PRINT_CONFIG.marginMm.min"
          :max="PRINT_CONFIG.marginMm.max"
          :step="PRINT_CONFIG.marginMm.step"
          step-strictly
          controls-position="right"
          aria-label="页面边距"
        />
        <small>mm</small>
      </label>
      <label>
        <span>图片间距</span>
        <el-input-number
          v-model="imageGap"
          :min="PRINT_CONFIG.gapMm.min"
          :max="PRINT_CONFIG.gapMm.max"
          :step="PRINT_CONFIG.gapMm.step"
          step-strictly
          controls-position="right"
          aria-label="图片间距"
        />
        <small>mm</small>
      </label>
    </div>
  </section>
</template>

<style scoped>
.layout-settings {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.settings-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
}

.settings-title h2 {
  margin: 0;
  font-size: 15px;
}

.settings-title p {
  margin: 3px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.settings-controls {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(230px, 1.3fr) repeat(2, minmax(180px, 1fr));
  align-items: center;
  gap: 12px;
}

.settings-controls label {
  display: grid;
  grid-template-columns: auto minmax(90px, 1fr) 24px;
  align-items: center;
  gap: 7px;
  color: var(--text-muted);
  font-size: 13px;
}

.settings-controls .size-control {
  grid-template-columns: auto minmax(150px, 1fr);
}

.settings-controls small {
  font-size: 12px;
}

@media (max-width: 720px) {
  .layout-settings {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }

  .settings-controls {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .settings-controls label {
    grid-template-columns: 1fr 24px;
  }

  .settings-controls .size-control {
    grid-column: 1 / -1;
    grid-template-columns: 1fr;
  }

  .settings-controls label > span {
    grid-column: 1 / -1;
  }

  .settings-controls :deep(.el-input-number) {
    width: 100%;
  }
}
</style>
