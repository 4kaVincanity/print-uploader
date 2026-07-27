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
    expect(store.layoutSettings).toEqual({ marginMm: 0, gapMm: 0 })

    store.setPageMargin(99)
    store.setImageGap(-5)
    expect(store.layoutSettings).toEqual({ marginMm: 30, gapMm: 0 })

    store.setImageGap(8)
    expect(store.layoutSettings).toEqual({ marginMm: 30, gapMm: 8 })
    expect(store.revision).toBe(2)
  })
})
