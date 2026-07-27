import type { Rect } from '../store/editor.types'
import type { LayoutSettings } from '../store/editor.types'
import { PRINT_CONFIG } from '../config'

export const A4_WIDTH_PX = PRINT_CONFIG.widthPx
export const A4_HEIGHT_PX = PRINT_CONFIG.heightPx
export const PRINT_DPI = PRINT_CONFIG.dpi
export const GRID_COLUMNS = PRINT_CONFIG.columns
export const GRID_ROWS = PRINT_CONFIG.rows

export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
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

export function normalizeLayoutSettings(settings: LayoutSettings): LayoutSettings {
  return {
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
  const pageMarginPx = mmToPx(normalized.marginMm)
  const gridGapPx = mmToPx(normalized.gapMm)
  const contentWidth =
    A4_WIDTH_PX - pageMarginPx * 2 - gridGapPx * (GRID_COLUMNS - 1)
  const contentHeight =
    A4_HEIGHT_PX - pageMarginPx * 2 - gridGapPx * (GRID_ROWS - 1)
  const columnWidths = distributeTrackSizes(contentWidth, GRID_COLUMNS)
  const rowHeights = distributeTrackSizes(contentHeight, GRID_ROWS)
  const slots: Rect[] = []

  let y = pageMarginPx
  for (let row = 0; row < GRID_ROWS; row += 1) {
    let x = pageMarginPx
    const height = rowHeights[row] ?? 0

    for (let column = 0; column < GRID_COLUMNS; column += 1) {
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
  const verticalGuides = [0, 1].map((column): LineSegment => {
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
  const horizontalGuides = [0, 1].map((row): LineSegment => {
    const topSlot = slots[row * GRID_COLUMNS]!
    const bottomSlot = slots[(row + 1) * GRID_COLUMNS]!
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

export function rectToPercent(rect: Rect): Record<string, string> {
  return {
    left: `${(rect.x / A4_WIDTH_PX) * 100}%`,
    top: `${(rect.y / A4_HEIGHT_PX) * 100}%`,
    width: `${(rect.width / A4_WIDTH_PX) * 100}%`,
    height: `${(rect.height / A4_HEIGHT_PX) * 100}%`,
  }
}
