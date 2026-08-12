export interface CropTransform {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface ImageEntry {
  id: string
  file: File
  name: string
  url: string
  width: number
  height: number
  decoded: HTMLImageElement
  crop: CropTransform
}

export interface LayoutSlot {
  id: string
  image: ImageEntry | null
}

export interface LayoutSettings {
  sizeId?: keyof typeof import('../config').PRINT_SIZES
  marginMm: number
  gapMm: number
}

export type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error'

export interface GeneratedResult {
  url: string
  revision: number
  width: number
  height: number
}

export interface ImportReport {
  added: number
  rejected: string[]
  skippedForCapacity: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}
