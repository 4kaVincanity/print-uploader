import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ImageEntry } from '../../src/store/editor.types'

const mocks = vi.hoisted(() => ({
  renderA4Png: vi.fn<() => Promise<Blob>>(),
}))
vi.mock('../../src/utils/render', () => ({ renderA4Png: mocks.renderA4Png }))

import { useEditorStore } from '../../src/store/editor'

function image(): ImageEntry {
  return {
    id: 'one',
    file: new File(['x'], 'one.png', { type: 'image/png' }),
    name: 'one.png',
    url: 'blob:source',
    width: 1000,
    height: 1500,
    decoded: document.createElement('img'),
    crop: { zoom: 1, offsetX: 0, offsetY: 0 },
    dateStamp: null,
  }
}

describe('generation workflow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mocks.renderA4Png.mockReset()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:generated'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('rejects an empty layout', async () => {
    const store = useEditorStore()
    await expect(store.generatePreview()).rejects.toThrow('请先添加至少一张图片')
  })

  it('generates a current result and invalidates it after editing', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = image()
    mocks.renderA4Png.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))

    await store.generatePreview()
    expect(store.canDownload).toBe(true)
    expect(store.generationStatus).toBe('ready')

    store.updateCrop('one', { zoom: 1.5, offsetX: 0, offsetY: 0 })
    expect(store.canDownload).toBe(false)
    expect(store.generatedResult).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:generated')
  })

  it('invalidates a generated result after layout settings change', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = image()
    mocks.renderA4Png.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))

    await store.generatePreview()
    expect(mocks.renderA4Png).toHaveBeenCalledWith(store.slots, {
      sizeId: 'a4',
      marginMm: 0,
      gapMm: 0,
    }, 'slash')

    store.setPageMargin(12)
    expect(store.canDownload).toBe(false)
    expect(store.generatedResult).toBeNull()
  })

  it('preserves editor content and exposes a recoverable failure state', async () => {
    const store = useEditorStore()
    store.slots[0]!.image = image()
    mocks.renderA4Png.mockRejectedValue(new Error('编码失败'))

    await expect(store.generatePreview()).rejects.toThrow('编码失败')
    expect(store.imageCount).toBe(1)
    expect(store.generationStatus).toBe('error')
    expect(store.generationError).toBe('编码失败')
  })
})
