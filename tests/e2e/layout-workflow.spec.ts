import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { createA4Layout } from '../../src/utils/layout'

async function createPng(page: Page, color: string): Promise<Buffer> {
  const dataUrl = await page.evaluate((fill) => {
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 180
    const context = canvas.getContext('2d')!
    context.fillStyle = fill
    context.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
  }, color)
  return Buffer.from(dataUrl.split(',')[1]!, 'base64')
}

test('desktop upload, preview, and download workflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('desktop'))
  await page.goto('/')
  const redPng = await createPng(page, '#ef4444')
  const bluePng = await createPng(page, '#2563eb')
  const greenPng = await createPng(page, '#16a34a')
  await page.locator('input[type="file"]').first().setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: redPng },
    { name: 'two.png', mimeType: 'image/png', buffer: bluePng },
  ])

  await expect(page.getByText('2/9 张')).toBeVisible()
  await expect(page.locator('.grid-slot')).toHaveCount(9)
  await expect(page.getByText('A4 竖版 · 0 mm 边距 · 0 mm 间距')).toBeVisible()
  await page.getByRole('spinbutton', { name: '页面边距' }).fill('12')
  await page.getByRole('spinbutton', { name: '页面边距' }).press('Enter')
  await page.getByRole('spinbutton', { name: '图片间距' }).fill('6')
  await page.getByRole('spinbutton', { name: '图片间距' }).press('Enter')
  await expect(page.getByText('A4 竖版 · 12 mm 边距 · 6 mm 间距')).toBeVisible()
  await expect(page.getByTestId('crop-guide')).toHaveCount(0)
  const editorPixel = await page.locator('.grid-slot canvas').first().evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement
    const context = element.getContext('2d')!
    return Array.from(context.getImageData(element.width / 2, element.height / 2, 1, 1).data)
  })
  expect(editorPixel[0]).toBeGreaterThan(200)

  await page.getByRole('button', { name: '向后移动图片' }).click()
  await page.getByRole('button', { name: '向后移动图片' }).click()
  await expect(page.locator('.grid-slot').nth(1)).toHaveClass(/grid-slot--empty/)
  const movedPixel = await page.locator('.grid-slot').nth(2).locator('canvas').evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement
    const context = element.getContext('2d')!
    return Array.from(context.getImageData(element.width / 2, element.height / 2, 1, 1).data)
  })
  expect(movedPixel[0]).toBeGreaterThan(200)

  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.locator('.empty-slot-button').first().click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({ name: 'target.png', mimeType: 'image/png', buffer: greenPng })
  const targetedPixel = await page.locator('.grid-slot').nth(1).locator('canvas').evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement
    const context = element.getContext('2d')!
    return Array.from(context.getImageData(element.width / 2, element.height / 2, 1, 1).data)
  })
  expect(targetedPixel[1]).toBeGreaterThan(100)
  await expect(page.locator('.a4-page')).toHaveScreenshot('desktop-a4-no-crop-guides.png')
  await page.screenshot({ path: 'test-results/desktop-workspace.png', fullPage: true })

  await page.getByRole('button', { name: '生成预览' }).click()
  await expect(page.getByRole('dialog', { name: '确认 A4 排版' })).toBeVisible()
  await expect(page.getByAltText('已生成的 A4 排版效果')).toBeVisible()
  const generatedPixel = await page.getByAltText('已生成的 A4 排版效果').evaluate(async (image) => {
    const element = image as HTMLImageElement
    await element.decode()
    const canvas = document.createElement('canvas')
    canvas.width = element.naturalWidth
    canvas.height = element.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(element, 0, 0)
    return Array.from(context.getImageData(2006, 643, 1, 1).data)
  })
  expect(generatedPixel[0]).toBeGreaterThan(200)
  const generatedMarginPixel = await page.getByAltText('已生成的 A4 排版效果').evaluate(
    async (image) => {
      const element = image as HTMLImageElement
      await element.decode()
      const canvas = document.createElement('canvas')
      canvas.width = element.naturalWidth
      canvas.height = element.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(element, 0, 0)
      return Array.from(context.getImageData(1, 1, 1, 1).data)
    },
  )
  expect(generatedMarginPixel.slice(0, 3)).toEqual([255, 255, 255])

  const settings = { marginMm: 12, gapMm: 6 }
  const layout = createA4Layout(settings)
  const sampledPixels = await page.getByAltText('已生成的 A4 排版效果').evaluate(
    async (image, samplePoints) => {
      const element = image as HTMLImageElement
      await element.decode()
      const canvas = document.createElement('canvas')
      canvas.width = element.naturalWidth
      canvas.height = element.naturalHeight
      const context = canvas.getContext('2d')!
      context.drawImage(element, 0, 0)

      return samplePoints.map(({ x, y }) =>
        Array.from(context.getImageData(Math.round(x), Math.round(y), 1, 1).data),
      )
    },
    [
      { x: 1, y: 1 },
      { x: layout[1]!.x + layout[1]!.width / 2, y: layout[1]!.y + 1 },
      { x: layout[2]!.x + layout[2]!.width - 1, y: layout[2]!.y + 100 },
    ],
  )
  expect(sampledPixels[0]!.slice(0, 3)).toEqual([255, 255, 255])
  expect(sampledPixels[1]![1]).toBeGreaterThan(100)
  expect(sampledPixels[2]![0]).toBeGreaterThan(200)

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('dialog').getByRole('button', { name: '下载 PNG' }).click()
  const download = await downloadPromise
  await expect(page.getByRole('dialog', { name: '确认 A4 排版' })).toBeHidden()
  expect(download.suggestedFilename()).toMatch(/^a4-image-layout-.*\.png$/)
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const output = await readFile(downloadPath!)
  expect(output.readUInt32BE(16)).toBe(2480)
  expect(output.readUInt32BE(20)).toBe(3508)
  await page.screenshot({ path: 'test-results/desktop-confirmation.png', fullPage: true })
})

test('mobile workspace has no horizontal overflow or overlapping main regions', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('mobile'))
  await page.goto('/')
  const greenPng = await createPng(page, '#16a34a')
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'mobile.png',
    mimeType: 'image/png',
    buffer: greenPng,
  })

  await expect(page.getByText('1/9 张')).toBeVisible()
  await expect(page.getByText('A4 竖版 · 0 mm 边距 · 0 mm 间距')).toBeVisible()
  const firstPreviewPosition = await page.locator('.preview-slot').first().evaluate((slot) => ({
    left: (slot as HTMLElement).style.left,
    top: (slot as HTMLElement).style.top,
  }))
  expect(firstPreviewPosition).toEqual({ left: '0%', top: '0%' })
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    headerBottom: document.querySelector('.app-header')?.getBoundingClientRect().bottom ?? 0,
    editorTop: document.querySelector('.editor-pane')?.getBoundingClientRect().top ?? 0,
  }))
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport)
  expect(metrics.editorTop).toBeGreaterThanOrEqual(metrics.headerBottom)

  const imagePixel = await page.locator('.grid-slot canvas').first().evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement
    const context = element.getContext('2d')!
    return Array.from(context.getImageData(element.width / 2, element.height / 2, 1, 1).data)
  })
  expect(imagePixel[1]).toBeGreaterThan(100)

  await expect(page.getByTestId('crop-guide')).toHaveCount(0)
  await expect(page.locator('.a4-page')).toHaveScreenshot('mobile-a4-no-crop-guides.png')

  await page.screenshot({ path: 'test-results/mobile-workspace.png', fullPage: true })
})
