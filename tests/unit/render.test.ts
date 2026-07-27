import { describe, expect, it, vi } from 'vitest'
import type { ImageEntry, LayoutSlot } from '../../src/store/editor.types'
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  createA4Layout,
} from '../../src/utils/layout'
import { renderA4ToContext } from '../../src/utils/render'

function image(): ImageEntry {
  return {
    id: 'one',
    file: new File(['x'], 'one.png', { type: 'image/png' }),
    name: 'one.png',
    url: 'blob:one',
    width: 1000,
    height: 1500,
    decoded: document.createElement('img'),
    crop: { zoom: 1, offsetX: 0, offsetY: 0 },
  }
}

describe('A4 canvas rendering', () => {
  function createContext() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      lineDashOffset: 0,
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    }
  }

  it('fills the exact canvas area and draws images into their layout slots', () => {
    const contextMock = createContext()
    const context = contextMock as unknown as CanvasRenderingContext2D
    const slots: LayoutSlot[] = Array.from({ length: 9 }, (_, index) => ({
      id: `slot-${index}`,
      image: index === 0 ? image() : null,
    }))

    renderA4ToContext(context, slots)

    expect(contextMock.fillRect).toHaveBeenCalledWith(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX)
    expect(contextMock.drawImage).toHaveBeenCalledTimes(1)
    const destination = contextMock.drawImage.mock.calls[0]!.slice(-4)
    const firstRect = createA4Layout()[0]!
    expect(destination).toEqual([
      firstRect.x,
      firstRect.y,
      firstRect.width,
      firstRect.height,
    ])
    expect(contextMock.setLineDash).not.toHaveBeenCalled()
    expect(contextMock.beginPath).not.toHaveBeenCalled()
    expect(contextMock.stroke).not.toHaveBeenCalled()
  })

  it('uses supplied spacing settings for destination placement', () => {
    const contextMock = createContext()
    const context = contextMock as unknown as CanvasRenderingContext2D
    const slots: LayoutSlot[] = Array.from({ length: 9 }, (_, index) => ({
      id: `slot-${index}`,
      image: index === 0 ? image() : null,
    }))

    renderA4ToContext(context, slots, { marginMm: 12, gapMm: 6 })
    expect(contextMock.drawImage.mock.calls[0]!.slice(-4)).toEqual([
      142,
      142,
      684,
      1027,
    ])

    expect(contextMock.setLineDash).not.toHaveBeenCalled()
    expect(contextMock.moveTo).not.toHaveBeenCalled()
    expect(contextMock.lineTo).not.toHaveBeenCalled()
  })
})
