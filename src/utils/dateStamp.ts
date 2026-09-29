import type { DateStampFormat, DateStampPosition, ImageDateStamp } from '../store/editor.types'

export const DEFAULT_DATE_STAMP_POSITION: Readonly<DateStampPosition> = {
  x: 0.5,
  y: 0.86,
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function formatDateStamp(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

export function displayDateStamp(value: string, format: DateStampFormat): string {
  const [year, month, day] = value.split('/')
  if (!year || !month || !day) return value
  if (format === 'hyphen') return `${year}-${month}-${day}`
  if (format === 'chinese') return `${year}年${month}月${day}日`
  return value
}

export function isDateStampEnabled(stamp: ImageDateStamp | null): boolean {
  return Boolean(stamp && stamp.enabled !== false)
}

export function isDateStampValue(value: string): boolean {
  const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function normalizeDateStampPosition(position: DateStampPosition): DateStampPosition {
  return {
    x: clamp(Number.isFinite(position.x) ? position.x : DEFAULT_DATE_STAMP_POSITION.x),
    y: clamp(Number.isFinite(position.y) ? position.y : DEFAULT_DATE_STAMP_POSITION.y),
  }
}

export function createDefaultDateStamp(date: Date = new Date()): ImageDateStamp {
  return {
    value: formatDateStamp(date),
    position: { ...DEFAULT_DATE_STAMP_POSITION },
  }
}
