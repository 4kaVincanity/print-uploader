import type { DateStampFormat, ImageDateStamp, ImageEntry, LayoutSettings, LayoutSlot } from '../store/editor.types'
import { getCoverSourceRect } from './crop'
import { displayDateStamp, isDateStampEnabled } from './dateStamp'
import {
  DEFAULT_LAYOUT_SETTINGS,
  createA4Layout,
  getPrintSize,
} from './layout'

export function drawCroppedImage(
  context: CanvasRenderingContext2D,
  image: ImageEntry,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const source = getCoverSourceRect(
    image.width,
    image.height,
    width,
    height,
    image.crop,
  )

  context.drawImage(
    image.decoded,
    source.x,
    source.y,
    source.width,
    source.height,
    x,
    y,
    width,
    height,
  )
}

export function drawDateStamp(
  context: CanvasRenderingContext2D,
  dateStamp: ImageDateStamp,
  x: number,
  y: number,
  width: number,
  height: number,
  format: DateStampFormat = 'slash',
): void {
  const fontSize = Math.max(12, Math.round(width * 0.05))
  const value = displayDateStamp(dateStamp.value, format)
  const centerX = x + width * dateStamp.position.x
  const centerY = y + height * dateStamp.position.y
  const horizontalPadding = fontSize * 0.52
  const verticalPadding = fontSize * 0.28

  context.font = `400 ${fontSize}px Libian, serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  const metrics = context.measureText(value)
  context.fillStyle = 'rgba(255, 255, 255, 0.84)'
  context.fillRect(
    centerX - metrics.width / 2 - horizontalPadding,
    centerY - fontSize / 2 - verticalPadding,
    metrics.width + horizontalPadding * 2,
    fontSize + verticalPadding * 2,
  )
  context.fillStyle = '#17191c'
  context.fillText(value, centerX, centerY)
}

export function renderA4ToContext(
  context: CanvasRenderingContext2D,
  slots: LayoutSlot[],
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
  dateFormat: DateStampFormat = 'slash',
): void {
  context.save()
  context.fillStyle = '#ffffff'
  const size = getPrintSize(settings)
  context.fillRect(0, 0, size.widthPx, size.heightPx)

  createA4Layout(settings).forEach((rect, index) => {
    const image = slots[index]?.image
    if (image) {
      context.save()
      context.beginPath()
      context.rect(rect.x, rect.y, rect.width, rect.height)
      context.clip()
      drawCroppedImage(context, image, rect.x, rect.y, rect.width, rect.height)
      if (isDateStampEnabled(image.dateStamp)) {
        drawDateStamp(context, image.dateStamp!, rect.x, rect.y, rect.width, rect.height, dateFormat)
      }
      context.restore()
    }
  })

  context.restore()
}

export async function renderA4Png(
  slots: LayoutSlot[],
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
  dateFormat: DateStampFormat = 'slash',
): Promise<Blob> {
  if (slots.some((slot) => isDateStampEnabled(slot.image?.dateStamp ?? null))) {
    await document.fonts.load('400 16px Libian')
  }

  const canvas = document.createElement('canvas')
  const size = getPrintSize(settings)
  canvas.width = size.widthPx
  canvas.height = size.heightPx
  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw new Error('当前浏览器无法创建图片画布')
  }

  renderA4ToContext(context, slots, settings, dateFormat)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png')
  })

  canvas.width = 1
  canvas.height = 1

  if (!blob) {
    throw new Error('PNG 编码失败')
  }

  return blob
}
