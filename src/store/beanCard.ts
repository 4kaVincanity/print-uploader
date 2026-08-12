import { computed, markRaw, ref } from 'vue'
import { defineStore } from 'pinia'
import { decodeImageFile, validateImageFile } from '../utils/image'

export type CardTemplate = 'square' | 'a4'
export interface BeanRecord { id: string; name: string; variety: string; altitude: string; originCountry: string; isBlend: boolean; process: string; roast: string; flavor: string; supplement: string; shopName: string }
export interface Illustration { id: string; name: string; url: string; width: number; height: number; image: HTMLImageElement; x: number; y: number; scale: number; zIndex: number }
const empty = (): Omit<BeanRecord, 'id'> => ({ name: '', variety: '', altitude: '', originCountry: '', isBlend: false, process: '', roast: '', flavor: '', supplement: '', shopName: '隅木焙煎所' })
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
function isHeif(file: File): boolean { return ['image/heif', 'image/heic'].includes(file.type.toLowerCase()) || /\.hei[cf]$/i.test(file.name) }
async function makeBlackTransparent(file: File): Promise<File> {
  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => { const element = new Image(); element.onload = () => resolve(element); element.onerror = reject; element.src = url })
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const context = canvas.getContext('2d'); if (!context) return file
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    for (let index = 0; index < pixels.data.length; index += 4) {
      if ((pixels.data[index] ?? 255) < 24 && (pixels.data[index + 1] ?? 255) < 24 && (pixels.data[index + 2] ?? 255) < 24) pixels.data[index + 3] = 0
    }
    context.putImageData(pixels, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    return blob ? new File([blob], file.name, { type: 'image/png' }) : file
  } finally { URL.revokeObjectURL(url) }
}
async function convertHeif(file: File): Promise<File> {
  try {
    const body = new FormData(); body.append('image', file)
    const response = await fetch('/api/illustrations/convert', { method: 'POST', body })
    if (!response.ok) throw new Error(await response.text())
    return makeBlackTransparent(new File([await response.blob()], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' }))
  } catch {
    const { default: heic2any } = await import('heic2any')
    const converted = await heic2any({ blob: file, toType: 'image/png' })
    const blob = Array.isArray(converted) ? converted[0] : converted
    if (!blob) throw new Error('HEIF 轉換失敗：此檔案的編碼格式不受支援')
    return makeBlackTransparent(new File([blob], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' }))
  }
}

export const useBeanCardStore = defineStore('beanCard', () => {
  const template = ref<CardTemplate>('square')
  const data = ref<Omit<BeanRecord, 'id'>>(empty())
  const records = ref<BeanRecord[]>([])
  const selectedRecordId = ref<string | null>(null)
  const illustrations = ref<Illustration[]>([])
  const selectedIllustrationId = ref<string | null>(null)
  const loadingRecords = ref(false)
  const error = ref('')
  const busy = ref(false)
  const selectedIllustration = computed(() => illustrations.value.find((item) => item.id === selectedIllustrationId.value) ?? null)

  async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.message || '豆子資料庫操作失敗') }
    return response.status === 204 ? undefined as T : response.json() as Promise<T>
  }
  async function loadRecords() { loadingRecords.value = true; error.value = ''; try { records.value = await request<BeanRecord[]>('/api/beans') } catch (e) { error.value = e instanceof Error ? e.message : '讀取豆子資料失敗' } finally { loadingRecords.value = false } }
  function applyRecord(record: BeanRecord) { selectedRecordId.value = record.id; data.value = { name: record.name, variety: record.variety, altitude: record.altitude, originCountry: record.originCountry ?? '', isBlend: record.isBlend ?? false, process: record.process, roast: record.roast, flavor: record.flavor, supplement: record.supplement ?? '', shopName: record.shopName } }
  async function saveRecord() { busy.value = true; error.value = ''; try { const current = selectedRecordId.value ? await request<BeanRecord>(`/api/beans/${selectedRecordId.value}`, { method: 'PUT', body: JSON.stringify(data.value) }) : await request<BeanRecord>('/api/beans', { method: 'POST', body: JSON.stringify(data.value) }); const index = records.value.findIndex((record) => record.id === current.id); if (index < 0) records.value.push(current); else records.value[index] = current; selectedRecordId.value = current.id } catch (e) { error.value = e instanceof Error ? e.message : '儲存失敗' } finally { busy.value = false } }
  async function deleteRecord() { if (!selectedRecordId.value) return; busy.value = true; error.value = ''; try { await request<void>(`/api/beans/${selectedRecordId.value}`, { method: 'DELETE' }); records.value = records.value.filter((record) => record.id !== selectedRecordId.value); selectedRecordId.value = null } catch (e) { error.value = e instanceof Error ? e.message : '刪除失敗' } finally { busy.value = false } }
  function newRecord() { selectedRecordId.value = null; data.value = empty() }
  async function addIllustrations(files: File[]) { for (const originalFile of files) { try { const file = isHeif(originalFile) ? await convertHeif(originalFile) : originalFile; const validation = validateImageFile(file); if (validation) { error.value = validation; continue } const decoded = await decodeImageFile(file); const item: Illustration = { id: id(), name: decoded.name, url: decoded.url, width: decoded.width, height: decoded.height, image: markRaw(decoded.decoded), x: .5, y: .2, scale: .35, zIndex: illustrations.value.length }; illustrations.value.push(item); selectedIllustrationId.value = item.id } catch (e) { error.value = e instanceof Error ? e.message : '插圖讀取失敗' } } }
  function updateIllustration(itemId: string, patch: Partial<Pick<Illustration, 'x' | 'y' | 'scale'>>) { const item = illustrations.value.find((entry) => entry.id === itemId); if (item) Object.assign(item, patch) }
  function removeIllustration(itemId: string) { const index = illustrations.value.findIndex((item) => item.id === itemId); const item = illustrations.value[index]; if (!item) return; URL.revokeObjectURL(item.url); illustrations.value.splice(index, 1); illustrations.value.forEach((entry, i) => entry.zIndex = i); selectedIllustrationId.value = null }
  function moveLayer(itemId: string, amount: number) { const index = illustrations.value.findIndex((item) => item.id === itemId); const next = index + amount; if (index < 0 || next < 0 || next >= illustrations.value.length) return; const item = illustrations.value.splice(index, 1)[0]; if (!item) return; illustrations.value.splice(next, 0, item); illustrations.value.forEach((entry, i) => entry.zIndex = i) }
  function clearIllustrations() { illustrations.value.forEach((item) => URL.revokeObjectURL(item.url)); illustrations.value = []; selectedIllustrationId.value = null }
  function cleanup() { illustrations.value.forEach((item) => URL.revokeObjectURL(item.url)) }
  return { template, data, records, selectedRecordId, illustrations, selectedIllustrationId, selectedIllustration, loadingRecords, error, busy, loadRecords, applyRecord, saveRecord, deleteRecord, newRecord, addIllustrations, updateIllustration, removeIllustration, moveLayer, clearIllustrations, cleanup }
})
