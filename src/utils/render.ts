import type { ImageEntry, LayoutSettings, LayoutSlot } from '../store/editor.types'
import { getCoverSourceRect } from './crop'
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  DEFAULT_LAYOUT_SETTINGS,
  createA4Layout,
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

export function renderA4ToContext(
  context: CanvasRenderingContext2D,
  slots: LayoutSlot[],
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
): void {
  context.save()
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX)

  createA4Layout(settings).forEach((rect, index) => {
    const image = slots[index]?.image
    if (image) {
      drawCroppedImage(context, image, rect.x, rect.y, rect.width, rect.height)
    }
  })

  context.restore()
}

export async function renderA4Png(
  slots: LayoutSlot[],
  settings: LayoutSettings = DEFAULT_LAYOUT_SETTINGS,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = A4_WIDTH_PX
  canvas.height = A4_HEIGHT_PX
  const context = canvas.getContext('2d', { alpha: false })

  if (!context) {
    throw new Error('当前浏览器无法创建图片画布')
  }

  renderA4ToContext(context, slots, settings)

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
