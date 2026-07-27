import type { CropTransform, Rect } from '../store/editor.types'

export const MIN_ZOOM = 1
export const MAX_ZOOM = 3

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeCrop(crop: CropTransform): CropTransform {
  return {
    zoom: clamp(crop.zoom, MIN_ZOOM, MAX_ZOOM),
    offsetX: clamp(crop.offsetX, -1, 1),
    offsetY: clamp(crop.offsetY, -1, 1),
  }
}

export function getCoverSourceRect(
  sourceWidth: number,
  sourceHeight: number,
  destinationWidth: number,
  destinationHeight: number,
  crop: CropTransform,
): Rect {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    destinationWidth <= 0 ||
    destinationHeight <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  const normalized = normalizeCrop(crop)
  const destinationRatio = destinationWidth / destinationHeight
  const sourceRatio = sourceWidth / sourceHeight

  let coverWidth: number
  let coverHeight: number

  if (sourceRatio > destinationRatio) {
    coverHeight = sourceHeight
    coverWidth = sourceHeight * destinationRatio
  } else {
    coverWidth = sourceWidth
    coverHeight = sourceWidth / destinationRatio
  }

  const width = coverWidth / normalized.zoom
  const height = coverHeight / normalized.zoom
  const centerX = sourceWidth / 2 + normalized.offsetX * ((sourceWidth - width) / 2)
  const centerY = sourceHeight / 2 + normalized.offsetY * ((sourceHeight - height) / 2)

  return {
    x: clamp(centerX - width / 2, 0, sourceWidth - width),
    y: clamp(centerY - height / 2, 0, sourceHeight - height),
    width,
    height,
  }
}

export function panCrop(
  crop: CropTransform,
  deltaX: number,
  deltaY: number,
): CropTransform {
  return normalizeCrop({
    ...crop,
    offsetX: crop.offsetX + deltaX,
    offsetY: crop.offsetY + deltaY,
  })
}
