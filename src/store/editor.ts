import { computed, markRaw, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  CropTransform,
  GeneratedResult,
  GenerationStatus,
  ImageEntry,
  ImportReport,
  LayoutSettings,
  LayoutSlot,
} from './editor.types'
import { PRINT_CONFIG, PRINT_SIZES } from '../config'
import { normalizeCrop } from '../utils/crop'
import { decodeImageFile, validateImageFile } from '../utils/image'
import {
  getPrintSize,
  normalizeLayoutSettings,
} from '../utils/layout'
import { renderA4Png } from '../utils/render'

function createSlots(): LayoutSlot[] {
  return Array.from({ length: PRINT_CONFIG.columns * PRINT_CONFIG.rows }, (_, index) => ({
    id: `slot-${index + 1}`,
    image: null,
  }))
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `image-${Date.now()}-${Math.random()}`
}

export const useEditorStore = defineStore('editor', () => {
  const slots = ref<LayoutSlot[]>(createSlots())
  const selectedImageId = ref<string | null>(null)
  const pageMarginMm = ref<number>(PRINT_CONFIG.marginMm.default)
  const imageGapMm = ref<number>(PRINT_CONFIG.gapMm.default)
  const sizeId = ref<keyof typeof PRINT_SIZES>('a4')
  const revision = ref(0)
  const generationStatus = ref<GenerationStatus>('idle')
  const generatedResult = ref<GeneratedResult | null>(null)
  const generationError = ref('')
  const importErrors = ref<string[]>([])
  let dragSnapshot: LayoutSlot[] | null = null

  const images = computed(() =>
    slots.value.flatMap((slot) => (slot.image ? [slot.image] : [])),
  )
  const imageCount = computed(() => images.value.length)
  const remainingCapacity = computed(
    () => PRINT_SIZES[sizeId.value].columns * PRINT_SIZES[sizeId.value].rows - imageCount.value,
  )
  const layoutSettings = computed<LayoutSettings>(() => ({
    sizeId: sizeId.value,
    marginMm: pageMarginMm.value,
    gapMm: imageGapMm.value,
  }))
  const selectedImage = computed(
    () => images.value.find((image) => image.id === selectedImageId.value) ?? null,
  )
  const isGeneratedCurrent = computed(
    () => generatedResult.value?.revision === revision.value,
  )
  const canDownload = computed(
    () => generationStatus.value === 'ready' && isGeneratedCurrent.value,
  )

  function releaseGeneratedResult(): void {
    if (generatedResult.value) {
      URL.revokeObjectURL(generatedResult.value.url)
      generatedResult.value = null
    }
  }

  function touch(): void {
    revision.value += 1
    generationError.value = ''
    if (generatedResult.value) {
      releaseGeneratedResult()
    }
    generationStatus.value = 'idle'
  }

  async function addFiles(files: File[], targetSlotIndex?: number): Promise<ImportReport> {
    const report: ImportReport = { added: 0, rejected: [], skippedForCapacity: 0 }
    let preferredSlotIndex = targetSlotIndex

    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        report.rejected.push(validationError)
        continue
      }

      const preferredSlot =
        preferredSlotIndex === undefined ? undefined : slots.value[preferredSlotIndex]
      const emptySlot =
        preferredSlot && !preferredSlot.image
          ? preferredSlot
          : slots.value.find((slot) => !slot.image)
      if (!emptySlot) {
        report.skippedForCapacity += 1
        continue
      }

      try {
        const decoded = await decodeImageFile(file)
        const image: ImageEntry = {
          ...decoded,
          decoded: markRaw(decoded.decoded),
          id: createId(),
          crop: { zoom: 1, offsetX: 0, offsetY: 0 },
        }
        emptySlot.image = image
        preferredSlotIndex = undefined
        selectedImageId.value ??= image.id
        report.added += 1
      } catch (error) {
        report.rejected.push(error instanceof Error ? error.message : `${file.name}：读取失败`)
      }
    }

    importErrors.value = report.rejected
    if (report.added > 0) {
      touch()
    }
    return report
  }

  async function duplicateImage(sourceSlotIndex: number, targetSlotIndex?: number): Promise<boolean> {
    const sourceSlot = slots.value[sourceSlotIndex]
    if (!sourceSlot?.image) return false

    const targetSlot =
      targetSlotIndex === undefined ? undefined : slots.value[targetSlotIndex]
    const emptySlot =
      targetSlot && !targetSlot.image
        ? targetSlot
        : slots.value.find((slot, index) => index !== sourceSlotIndex && !slot.image)
    if (!emptySlot) return false

    const sourceImage = sourceSlot.image
    const duplicateFile = new File([sourceImage.file], sourceImage.file.name, {
      type: sourceImage.file.type,
      lastModified: sourceImage.file.lastModified,
    })
    const decoded = await decodeImageFile(duplicateFile)
    const image: ImageEntry = {
      ...decoded,
      decoded: markRaw(decoded.decoded),
      id: createId(),
      crop: { ...sourceImage.crop },
    }
    emptySlot.image = image
    selectedImageId.value ??= image.id
    touch()
    return true
  }

  function removeImage(slotIndex: number): void {
    const slot = slots.value[slotIndex]
    if (!slot?.image) return

    URL.revokeObjectURL(slot.image.url)
    if (selectedImageId.value === slot.image.id) {
      selectedImageId.value = null
    }
    slot.image = null
    touch()
  }

  function selectImage(imageId: string | null): void {
    selectedImageId.value = imageId
  }

  function updateCrop(imageId: string, crop: CropTransform): void {
    const image = images.value.find((entry) => entry.id === imageId)
    if (!image) return
    image.crop = normalizeCrop(crop)
    touch()
  }

  function updateLayoutSettings(settings: Partial<LayoutSettings>): void {
    const normalized = normalizeLayoutSettings({
      marginMm: settings.marginMm ?? pageMarginMm.value,
      gapMm: settings.gapMm ?? imageGapMm.value,
      sizeId: settings.sizeId ?? sizeId.value,
    })
    if (
      normalized.sizeId === sizeId.value &&
      normalized.marginMm === pageMarginMm.value &&
      normalized.gapMm === imageGapMm.value
    ) {
      return
    }
    pageMarginMm.value = normalized.marginMm
    imageGapMm.value = normalized.gapMm
    sizeId.value = normalized.sizeId
    const targetCount = PRINT_SIZES[sizeId.value].columns * PRINT_SIZES[sizeId.value].rows
    while (slots.value.length < targetCount) {
      slots.value.push({ id: `slot-${slots.value.length + 1}`, image: null })
    }
    touch()
  }

  function setPageMargin(value: number | undefined): void {
    updateLayoutSettings({ marginMm: value ?? PRINT_CONFIG.marginMm.default })
  }

  function setImageGap(value: number | undefined): void {
    updateLayoutSettings({ gapMm: value ?? PRINT_CONFIG.gapMm.default })
  }

  function moveImage(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    const fromSlot = slots.value[fromIndex]
    const toSlot = slots.value[toIndex]
    if (!fromSlot?.image || !toSlot) return

    if (!toSlot.image) {
      toSlot.image = fromSlot.image
      fromSlot.image = null
    } else {
      const [moved] = slots.value.splice(fromIndex, 1)
      if (moved) slots.value.splice(toIndex, 0, moved)
    }
    touch()
  }

  function captureDrag(): void {
    dragSnapshot = slots.value.map((slot) => ({ ...slot }))
  }

  function finishDrag(oldIndex: number | undefined, newIndex: number | undefined): void {
    if (!dragSnapshot) return
    slots.value = dragSnapshot
    dragSnapshot = null
    if (oldIndex === undefined || newIndex === undefined) return
    moveImage(oldIndex, newIndex)
  }

  async function generatePreview(): Promise<GeneratedResult> {
    if (imageCount.value === 0) {
      throw new Error('请先添加至少一张图片')
    }
    if (generationStatus.value === 'generating') {
      throw new Error('正在生成，请稍候')
    }

    generationStatus.value = 'generating'
    generationError.value = ''
    releaseGeneratedResult()
    const generationRevision = revision.value

    try {
      const blob = await renderA4Png(slots.value, layoutSettings.value)
      const size = getPrintSize(layoutSettings.value)
      const result: GeneratedResult = {
        url: URL.createObjectURL(blob),
        revision: generationRevision,
        width: size.widthPx,
        height: size.heightPx,
      }
      generatedResult.value = result
      generationStatus.value = 'ready'
      return result
    } catch (error) {
      generationStatus.value = 'error'
      generationError.value = error instanceof Error ? error.message : '生成失败，请重试'
      throw error
    }
  }

  function downloadGenerated(): boolean {
    if (!generatedResult.value || !canDownload.value) return false
    const anchor = document.createElement('a')
    const timestamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
    const downloadedUrl = generatedResult.value.url
    anchor.href = downloadedUrl
    anchor.download = `a4-image-layout-${timestamp}.png`
    anchor.click()
    window.setTimeout(() => {
      if (generatedResult.value?.url === downloadedUrl) {
        releaseGeneratedResult()
        generationStatus.value = 'idle'
      }
    }, 1500)
    return true
  }

  function cleanup(): void {
    images.value.forEach((image) => URL.revokeObjectURL(image.url))
    releaseGeneratedResult()
  }

  return {
    slots,
    selectedImageId,
    pageMarginMm,
    imageGapMm,
    revision,
    generationStatus,
    generatedResult,
    generationError,
    importErrors,
    images,
    imageCount,
    remainingCapacity,
    layoutSettings,
    sizeId,
    selectedImage,
    isGeneratedCurrent,
    canDownload,
    addFiles,
    duplicateImage,
    removeImage,
    selectImage,
    updateCrop,
    updateLayoutSettings,
    setPageMargin,
    setImageGap,
    moveImage,
    captureDrag,
    finishDrag,
    generatePreview,
    downloadGenerated,
    cleanup,
  }
})
