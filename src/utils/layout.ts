import type { Rect } from '../store/editor.types'
import type { LayoutSettings } from '../store/editor.types'
import { PRINT_CONFIG, PRINT_SIZES } from '../config'

type PrintSizeId = keyof typeof PRINT_SIZES
type NormalizedLayoutSettings = LayoutSettings & { sizeId: PrintSizeId }

export const A4_WIDTH_PX = PRINT_CONFIG.widthPx
export const A4_HEIGHT_PX = PRINT_CONFIG.heightPx
export const PRINT_DPI = PRINT_CONFIG.dpi
export const GRID_COLUMNS = PRINT_CONFIG.columns
export const GRID_ROWS = PRINT_CONFIG.rows

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  sizeId: 'a4',
  marginMm: PRINT_CONFIG.marginMm.default,
  gapMm: PRINT_CONFIG.gapMm.default,
}

export interface LineSegment {
  orientation: 'vertical' | 'horizontal'
  x1: number
  y1: number
  x2: number
  y2: number
}

export function mmToPx(mm: number, dpi = PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeLayoutSettings(settings: LayoutSettings): NormalizedLayoutSettings {
  const sizeId = settings.sizeId ?? 'a4'
  const normalizedSizeId: PrintSizeId = sizeId in PRINT_SIZES ? sizeId : 'a4'
  return {
    sizeId: normalizedSizeId,
    marginMm: clamp(
      Number.isFinite(settings.marginMm) ? settings.marginMm : PRINT_CONFIG.marginMm.default,
      PRINT_CONFIG.marginMm.min,
      PRINT_CONFIG.marginMm.max,
    ),
    gapMm: clamp(
      Number.isFinite(settings.gapMm) ? settings.gapMm : PRINT_CONFIG.gapMm.default,
      PRINT_CONFIG.gapMm.min,
      PRINT_CONFIG.gapMm.max,
    ),
  }
}

function distributeTrackSizes(total: number, count: number): number[] {
  const base = Math.floor(total / count)
  const remainder = total - base * count

  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? base + remainder : base,
  )
}

export function createA4Layout(
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
): Rect[] {
  const normalized = normalizeLayoutSettings(settings)
  const size = PRINT_SIZES[normalized.sizeId]
  const pageMarginPx = mmToPx(normalized.marginMm)
  const gridGapPx = mmToPx(normalized.gapMm)
  const contentWidth =
    size.widthPx - pageMarginPx * 2 - gridGapPx * (size.columns - 1)
  const contentHeight =
    size.heightPx - pageMarginPx * 2 - gridGapPx * (size.rows - 1)
  const columnWidths = distributeTrackSizes(contentWidth, size.columns)
  const rowHeights = distributeTrackSizes(contentHeight, size.rows)
  const slots: Rect[] = []

  let y = pageMarginPx
  for (let row = 0; row < size.rows; row += 1) {
    let x = pageMarginPx
    const height = rowHeights[row] ?? 0

    for (let column = 0; column < size.columns; column += 1) {
      const width = columnWidths[column] ?? 0
      slots.push({ x, y, width, height })
      x += width + gridGapPx
    }

    y += height + gridGapPx
  }

  return slots
}

export function createCropGuides(
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
): LineSegment[] {
  const slots = createA4Layout(settings)
  const first = slots[0]
  const last = slots[slots.length - 1]

  if (!first || !last) return []

  const gridLeft = first.x
  const gridTop = first.y
  const gridRight = last.x + last.width
  const gridBottom = last.y + last.height
  const size = PRINT_SIZES[normalizeLayoutSettings(settings).sizeId]
  const verticalGuides = Array.from({ length: size.columns - 1 }, (_, column): LineSegment => {
    const leftSlot = slots[column]!
    const rightSlot = slots[column + 1]!
    const x = (leftSlot.x + leftSlot.width + rightSlot.x) / 2

    return {
      orientation: 'vertical',
      x1: x,
      y1: gridTop,
      x2: x,
      y2: gridBottom,
    }
  })
  const horizontalGuides = Array.from({ length: size.rows - 1 }, (_, row): LineSegment => {
    const topSlot = slots[row * size.columns]!
    const bottomSlot = slots[(row + 1) * size.columns]!
    const y = (topSlot.y + topSlot.height + bottomSlot.y) / 2

    return {
      orientation: 'horizontal',
      x1: gridLeft,
      y1: y,
      x2: gridRight,
      y2: y,
    }
  })

  return [...verticalGuides, ...horizontalGuides]
}

export function getSlotAspectRatio(settings: LayoutSettings): number {
  const first = createA4Layout(settings)[0]
  return (first?.width ?? 1) / (first?.height ?? 1)
}

export function getPrintSize(settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS) {
  return PRINT_SIZES[normalizeLayoutSettings(settings).sizeId]
}

export function rectToPercent(rect: Rect, settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS): Record<string, string> {
  const size = getPrintSize(settings)
  return {
    left: `${(rect.x / size.widthPx) * 100}%`,
    top: `${(rect.y / size.heightPx) * 100}%`,
    width: `${(rect.width / size.widthPx) * 100}%`,
    height: `${(rect.height / size.heightPx) * 100}%`,
  }
}
