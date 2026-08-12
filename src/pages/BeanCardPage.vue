<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ArrowLeft, Delete, Download, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useBeanCardStore } from '../store/beanCard'
import type { BeanRecord } from '../store/beanCard'
import { cardSize, createBeanCardPng, renderBeanCard } from '../utils/beanCardRender'
import { parseBeanText } from '../utils/beanTextParser'

const emit = defineEmits<{ back: [] }>()
const store = useBeanCardStore()
const canvas = ref<HTMLCanvasElement | null>(null)
const fontReady = ref(false)
const exporting = ref(false)
const dragging = ref<{ id: string; offsetX: number; offsetY: number } | null>(null)
const input = ref<HTMLInputElement | null>(null)
const pastedText = ref('')
type SaveFilePicker = (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>
type BeanField = Exclude<keyof BeanRecord, 'id' | 'isBlend'>
const fields = computed<{ key: BeanField; label: string }[]>(() => [
  { key: 'name', label: '咖啡豆名稱' },
  ...(store.data.isBlend ? [{ key: 'originCountry' as const, label: '原產國' }] : [{ key: 'variety' as const, label: '品種 / 批次' }, { key: 'altitude' as const, label: '標高 / 海拔' }]),
  { key: 'process', label: '生產處理' }, { key: 'roast', label: store.data.isBlend ? '焙煎度' : '烘煎度' }, { key: 'flavor', label: store.data.isBlend ? '風味' : '風味描述' }, { key: 'supplement', label: '補充' }, { key: 'shopName', label: '店鋪名稱' },
])
async function draw() { await nextTick(); const element = canvas.value; if (!element) return; const size = cardSize(store.template); element.width = size.width; element.height = size.height; const context = element.getContext('2d'); if (context) renderBeanCard(context, store.template, store.data, store.illustrations) }
watch([() => store.template, () => store.data, () => store.illustrations], draw, { deep: true })
onMounted(async () => { try { await document.fonts.load('16px Libian'); fontReady.value = true } catch { store.error = 'Libian 字體載入失敗，無法可靠輸出' } await store.loadRecords(); draw() })
onBeforeUnmount(store.cleanup)
function selectRecord(id: string) { const record = store.records.find((item) => item.id === id); if (record) store.applyRecord(record) }
function recordLabel(record: BeanRecord): string { return [record.name, record.isBlend ? record.originCountry : record.variety, record.process].filter(Boolean).join(' ') }
function fillFromText() { const parsed = parseBeanText(pastedText.value); if (!parsed.name) { ElMessage.warning('請先貼上咖啡豆名稱與欄位文字'); return } Object.assign(store.data, parsed, { supplement: parsed.supplement ?? '' }); store.clearIllustrations(); store.selectedRecordId = null; ElMessage.success('已辨識並填入豆子資料') }
function selectFiles() { input.value?.click() }
async function upload(event: Event) { await store.addIllustrations(Array.from((event.target as HTMLInputElement).files ?? [])); (event.target as HTMLInputElement).value = '' }
function point(event: PointerEvent) { const rect = canvas.value!.getBoundingClientRect(); return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height } }
function pointerDown(event: PointerEvent) { const p = point(event); const items = [...store.illustrations].sort((a, b) => b.zIndex - a.zIndex); const item = items.find((entry) => { const base = Math.min(cardSize(store.template).width, cardSize(store.template).height) * entry.scale; const ratio = entry.width / entry.height; const w = (ratio >= 1 ? base : base * ratio) / cardSize(store.template).width; const h = (ratio >= 1 ? base / ratio : base) / cardSize(store.template).height; return Math.abs(p.x - entry.x) <= w / 2 && Math.abs(p.y - entry.y) <= h / 2 }); if (item) { store.selectedIllustrationId = item.id; dragging.value = { id: item.id, offsetX: p.x - item.x, offsetY: p.y - item.y }; canvas.value?.setPointerCapture(event.pointerId) } }
function pointerMove(event: PointerEvent) { if (!dragging.value) return; const p = point(event); store.updateIllustration(dragging.value.id, { x: Math.max(-.2, Math.min(1.2, p.x - dragging.value.offsetX)), y: Math.max(-.2, Math.min(1.2, p.y - dragging.value.offsetY)) }) }
function pointerUp() { dragging.value = null }
async function download() { if (!fontReady.value) return; exporting.value = true; try { const blob = await createBeanCardPng(store.template, store.data, store.illustrations); const baseName = [store.data.name, store.data.variety, store.data.process].map((value) => value.trim()).filter(Boolean).join(' ').replaceAll(/[\\/:*?"<>|]/g, ''); const shape = store.template === 'square' ? '方形' : '竖形'; const filename = `${baseName || 'coffee-bean-card'} ${shape}.png`; const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker; if (picker) { const handle = await picker({ suggestedName: filename, types: [{ description: 'PNG 圖片', accept: { 'image/png': ['.png'] } }] }); const writable = await handle.createWritable(); await writable.write(blob); await writable.close(); ElMessage.success('PNG 已儲存') } else { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1500) } } catch (error) { if (!(error instanceof DOMException && error.name === 'AbortError')) ElMessage.error(error instanceof Error ? error.message : '輸出失敗') } finally { exporting.value = false } }
</script>

<template>
  <div class="bean-page">
    <header class="bean-header"><el-button :icon="ArrowLeft" @click="emit('back')">返回 A4 排版</el-button><h1>咖啡豆卡生成器</h1><el-button type="primary" :icon="Download" :loading="exporting" :disabled="!fontReady" @click="download">選擇位置下載 PNG</el-button></header>
    <main class="bean-workspace">
      <aside class="bean-controls">
        <h2>豆子資料</h2>
        <el-select :model-value="store.selectedRecordId" placeholder="選擇已保存豆子" clearable @update:model-value="(value: string) => value ? selectRecord(value) : store.newRecord()"><el-option v-for="item in store.records" :key="item.id" :label="recordLabel(item)" :value="item.id" /></el-select>
        <el-switch v-model="store.data.isBlend" active-text="配方" inactive-text="單品" />
        <el-input v-model="pastedText" type="textarea" :rows="5" placeholder="貼上豆名與「欄位 / 內容」，即可自動填入" />
        <el-button class="parse-button" @click="fillFromText">辨識並填入</el-button>
        <el-form label-position="top"><el-form-item v-for="field in fields" :key="field.key" :label="field.label"><el-input v-model="store.data[field.key]" :type="field.key === 'flavor' ? 'textarea' : 'text'" /></el-form-item></el-form>
        <div class="record-actions"><el-button :icon="Plus" @click="store.newRecord">新增</el-button><el-button type="primary" :loading="store.busy" @click="store.saveRecord">保存資料</el-button><el-button :icon="Delete" :disabled="!store.selectedRecordId" @click="store.deleteRecord">刪除</el-button></div>
        <el-alert v-if="store.error" :title="store.error" type="error" :closable="false" />
        <h2>模板與插圖</h2>
        <el-radio-group v-model="store.template"><el-radio-button label="square">方形</el-radio-button><el-radio-button label="a4">竖形</el-radio-button></el-radio-group>
        <input ref="input" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heif,image/heic,.heif,.heic" multiple @change="upload" /><el-button class="upload-button" :icon="Upload" @click="selectFiles">上傳插圖</el-button>
        <div v-if="store.illustrations.length" class="layers"><p>插圖圖層（畫布內可拖曳）</p><div v-for="item in store.illustrations" :key="item.id" class="layer" :class="{ active: store.selectedIllustrationId === item.id }" @click="store.selectedIllustrationId = item.id"><span>{{ item.name }}</span><el-button text @click.stop="store.moveLayer(item.id, 1)">上移</el-button><el-button text @click.stop="store.moveLayer(item.id, -1)">下移</el-button><el-button text type="danger" @click.stop="store.removeIllustration(item.id)">刪除</el-button></div></div>
        <el-slider v-if="store.selectedIllustration" v-model="store.selectedIllustration.scale" :min="0.03" :max="0.8" :step="0.01" show-input />
      </aside>
      <section class="bean-preview"><p>預覽{{ fontReady ? '' : '（字體載入中）' }}</p><div class="canvas-shell" :class="store.template"><canvas ref="canvas" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="pointerUp" /></div></section>
    </main>
  </div>
</template>

<style scoped>
.bean-page { min-height: 100vh; background:#f1f2ee; color:#252525; } .bean-header { height:68px; display:flex; align-items:center; gap:18px; padding:0 28px; background:#fff; border-bottom:1px solid #ddd; } .bean-header h1 { margin:0; flex:1; font-size:20px; } .bean-workspace { display:grid; grid-template-columns:360px minmax(0,1fr); gap:26px; max-width:1500px; margin:auto; padding:26px; } .bean-controls { padding:20px; background:#fff; border-radius:10px; box-shadow:0 2px 12px #0000000c; } .bean-controls h2 { font-size:16px; margin:0 0 14px; } .bean-controls :deep(.el-select) { width:100%; margin-bottom:14px; } .parse-button { width:100%; margin:8px 0 4px; } .record-actions { display:flex; flex-wrap:wrap; gap:8px; margin:10px 0 20px; } .upload-button { display:flex; width:100%; margin:16px 0; } .layers { border-top:1px solid #eee; } .layers p { font-size:13px; } .layer { display:flex; align-items:center; gap:3px; padding:6px; border-radius:5px; font-size:12px; cursor:pointer; } .layer.active { background:#f0f4ff; } .layer span { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .bean-preview { display:flex; flex-direction:column; align-items:center; } .bean-preview > p { align-self:stretch; margin-top:0; } .canvas-shell { background:#fff; box-shadow:0 6px 28px #0002; touch-action:none; } .canvas-shell.square { width:min(100%, 700px); aspect-ratio:1; } .canvas-shell.a4 { width:min(100%, 520px); aspect-ratio:827/1169; } canvas { width:100%; height:100%; display:block; } @media(max-width:800px) { .bean-workspace { grid-template-columns:1fr; padding:14px; } .bean-header { padding:0 14px; } .bean-header h1 { font-size:16px; } }
</style>
