import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImageEntry } from '../../src/store/editor.types'

vi.mock('../../src/utils/image', () => ({
  validateImageFile: (file: File) =>
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? null : `${file.name}：不支持`,
  decodeImageFile: async (file: File) => ({
    file,
    name: file.name,
    url: `blob:${file.name}`,
    width: 1200,
    height: 1800,
    decoded: document.createElement('img'),
  }),
}))

import { useEditorStore } from '../../src/store/editor'
import { formatDateStamp, isDateStampEnabled } from '../../src/utils/dateStamp'

function file(name: string, type = 'image/png'): File {
  return new File(['image'], name, { type })
}

function fakeImage(id: string): ImageEntry {
  return {
    id,
    file: file(`${id}.png`),
    name: `${id}.png`,
    url: `blob:${id}`,
    width: 1000,
    height: 1000,
    decoded: document.createElement('img'),
    crop: { zoom: 1, offsetX: 0, offsetY: 0 },
    dateStamp: null,
  }
}

describe('editor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((value: Blob) => `blob:${value.size}`),
      revokeObjectURL: vi.fn(),
    })
  })

  it('keeps valid imports and reports invalid files', async () => {
    const store = useEditorStore()
    const report = await store.addFiles([file('good.png'), file('bad.txt', 'text/plain')])
    expect(report.added).toBe(1)
    expect(report.rejected).toEqual(['bad.txt：不支持'])
    expect(store.imageCount).toBe(1)
  })

  it('enforces nine images across multi-file selections', async () => {
    const store = useEditorStore()
    const report = await store.addFiles(
      Array.from({ length: 11 }, (_, index) => file(`${index + 1}.png`)),
    )
    expect(store.imageCount).toBe(9)
    expect(report.skippedForCapacity).toBe(2)
  })

  it('deletes images, moves into an empty slot, and preserves crop data', () => {
    const store = useEditorStore()
    const first = fakeImage('first')
    first.crop.zoom = 2
    store.slots[0]!.image = first
    store.slots[1]!.image = fakeImage('second')
    store.selectImage(first.id)

    store.moveImage(0, 4)
    expect(store.slots[0]!.image).toBeNull()
    expect(store.slots[4]!.image?.id).toBe('first')
    expect(store.slots[4]!.image?.crop.zoom).toBe(2)

    store.removeImage(4)
    expect(store.imageCount).toBe(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first')
  })

  it('places the first imported image into a requested empty slot', async () => {
    const store = useEditorStore()
    const report = await store.addFiles([file('target.png')], 1)

    expect(report.added).toBe(1)
    expect(store.slots[0]!.image).toBeNull()
    expect(store.slots[1]!.image?.name).toBe('target.png')
  })

  it('duplicates an occupied image into an empty slot', async () => {
    const store = useEditorStore()
    const original = fakeImage('original')
    original.crop.zoom = 1.5
    original.dateStamp = {
      value: '2026/09/01',
      position: { x: 0.25, y: 0.75 },
    }
    store.slots[0]!.image = original

    const duplicated = await store.duplicateImage(0, 1)

    expect(duplicated).toBe(true)
    expect(store.slots[1]!.image).toBeDefined()
    expect(store.slots[1]!.image?.name).toBe('original.png')
    expect(store.slots[1]!.image?.id).not.toBe(original.id)
    expect(store.slots[1]!.image?.crop).toEqual(original.crop)
    expect(store.slots[1]!.image?.dateStamp).toEqual(original.dateStamp)
    expect(store.slots[1]!.image?.dateStamp).not.toBe(original.dateStamp)
    expect(store.slots[1]!.image?.dateStamp?.position).not.toBe(original.dateStamp.position)
  })

  it('adds an independent date with today as the default and updates its value and position', () => {
    const store = useEditorStore()
    const first = fakeImage('first')
    const second = fakeImage('second')
    store.slots[0]!.image = first
    store.slots[1]!.image = second

    store.setDateEnabled(first.id, true)
    expect(first.dateStamp).toEqual({
      value: formatDateStamp(),
      position: { x: 0.5, y: 0.86 },
    })
    expect(second.dateStamp).toBeNull()

    store.updateImageDate(first.id, {
      value: '2026/09/01',
      position: { x: -1, y: 2 },
    })
    expect(first.dateStamp).toEqual({
      value: '2026/09/01',
      position: { x: 0, y: 1 },
    })

    store.setDateEnabled(first.id, false)
    expect(first.dateStamp).toEqual({
      value: '2026/09/01',
      position: { x: 0, y: 1 },
      enabled: false,
    })
    store.setDateEnabled(first.id, true)
    expect(isDateStampEnabled(first.dateStamp)).toBe(true)
    expect(first.dateStamp?.value).toBe('2026/09/01')
  })

  it('applies the batch date switch and position to existing and future images without losing dates', async () => {
    const store = useEditorStore()
    const first = fakeImage('first')
    const second = fakeImage('second')
    first.dateStamp = { value: '2026/09/01', position: { x: 0.2, y: 0.7 } }
    store.slots[0]!.image = first
    store.slots[1]!.image = second

    store.setAllDatePosition({ x: 0.3, y: 0.8 })
    expect(first.dateStamp?.position).toEqual({ x: 0.3, y: 0.8 })
    store.setAllDatesEnabled(true)
    expect(second.dateStamp).toEqual({
      value: formatDateStamp(),
      position: { x: 0.3, y: 0.8 },
    })
    await store.addFiles([file('third.png')])
    expect(store.images[2]?.dateStamp?.position).toEqual({ x: 0.3, y: 0.8 })

    store.setAllDatesEnabled(false)
    expect(store.images.every((image) => !isDateStampEnabled(image.dateStamp))).toBe(true)
    expect(first.dateStamp?.value).toBe('2026/09/01')
    store.setAllDatesEnabled(true)
    expect(first.dateStamp?.value).toBe('2026/09/01')
    expect(store.images.every((image) => isDateStampEnabled(image.dateStamp))).toBe(true)
  })

  it('reorders occupied positions and clamps crop updates', () => {
    const store = useEditorStore()
    store.slots[0]!.image = fakeImage('first')
    store.slots[1]!.image = fakeImage('second')
    store.moveImage(0, 1)
    expect(store.slots[0]!.image?.id).toBe('second')
    expect(store.slots[1]!.image?.id).toBe('first')

    store.updateCrop('first', { zoom: 8, offsetX: -9, offsetY: 9 })
    expect(store.slots[1]!.image?.crop).toEqual({ zoom: 3, offsetX: -1, offsetY: 1 })
  })

  it('defaults to a full page and clamps layout settings', () => {
    const store = useEditorStore()
    expect(store.layoutSettings).toEqual({ sizeId: 'a4', marginMm: 0, gapMm: 0 })

    store.setPageMargin(99)
    store.setImageGap(-5)
    expect(store.layoutSettings).toEqual({ sizeId: 'a4', marginMm: 30, gapMm: 0 })

    store.setImageGap(8)
    expect(store.layoutSettings).toEqual({ sizeId: 'a4', marginMm: 30, gapMm: 8 })
    expect(store.revision).toBe(2)
  })

  it('adds twelve slots when switching to the 99 x 52.5 mm layout', () => {
    const store = useEditorStore()
    expect(store.slots).toHaveLength(9)
    store.updateLayoutSettings({ sizeId: 'card995x52_5' })
    expect(store.slots).toHaveLength(12)
    expect(store.layoutSettings.sizeId).toBe('card995x52_5')
  })

  it('uses ten slots for A4 landscape and safely compacts overflow positions', () => {
    const store = useEditorStore()
    store.updateLayoutSettings({ sizeId: 'card995x52_5' })
    store.slots[11]!.image = fakeImage('last')

    store.updateLayoutSettings({ sizeId: 'a4Landscape5x2' })

    expect(store.slots).toHaveLength(10)
    expect(store.layoutSettings.sizeId).toBe('a4Landscape5x2')
    expect(store.slots[0]!.image?.id).toBe('last')
    expect(store.remainingCapacity).toBe(9)
  })
})
