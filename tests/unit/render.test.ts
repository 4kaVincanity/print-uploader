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
    dateStamp: null,
  }
}

describe('A4 canvas rendering', () => {
  function createContext() {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      font: '',
      strokeStyle: '',
      lineWidth: 0,
      lineDashOffset: 0,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 240 })),
      drawImage: vi.fn(),
      setLineDash: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
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
    expect(contextMock.beginPath).toHaveBeenCalledOnce()
    expect(contextMock.clip).toHaveBeenCalledOnce()
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

  it('renders the five-by-two landscape layout at A4 landscape dimensions', () => {
    const contextMock = createContext()
    const context = contextMock as unknown as CanvasRenderingContext2D
    const slots: LayoutSlot[] = Array.from({ length: 10 }, (_, index) => ({
      id: `slot-${index}`,
      image: index === 9 ? image() : null,
    }))

    renderA4ToContext(context, slots, {
      sizeId: 'a4Landscape5x2',
      marginMm: 0,
      gapMm: 0,
    })

    expect(contextMock.fillRect).toHaveBeenCalledWith(0, 0, 3508, 2480)
    const lastRect = createA4Layout({
      sizeId: 'a4Landscape5x2',
      marginMm: 0,
      gapMm: 0,
    })[9]!
    expect(contextMock.drawImage.mock.calls[0]!.slice(-4)).toEqual([
      lastRect.x,
      lastRect.y,
      lastRect.width,
      lastRect.height,
    ])
  })

  it('draws each image date using its independent value and normalized position', () => {
    const contextMock = createContext()
    const context = contextMock as unknown as CanvasRenderingContext2D
    const datedImage = image()
    datedImage.dateStamp = {
      value: '2026/09/01',
      position: { x: 0.25, y: 0.75 },
    }
    const slots: LayoutSlot[] = Array.from({ length: 9 }, (_, index) => ({
      id: `slot-${index}`,
      image: index === 0 ? datedImage : null,
    }))

    renderA4ToContext(context, slots)

    const firstRect = createA4Layout()[0]!
    expect(contextMock.font).toBe(`400 ${Math.max(12, Math.round(firstRect.width * 0.05))}px Libian, serif`)
    expect(contextMock.fillText).toHaveBeenCalledWith(
      '2026/09/01',
      firstRect.x + firstRect.width * 0.25,
      firstRect.y + firstRect.height * 0.75,
    )

    contextMock.fillText.mockClear()
    renderA4ToContext(context, slots, undefined, 'hyphen')
    expect(contextMock.fillText).toHaveBeenCalledWith('2026-09-01', expect.any(Number), expect.any(Number))

    contextMock.fillText.mockClear()
    renderA4ToContext(context, slots, undefined, 'chinese')
    expect(contextMock.fillText).toHaveBeenCalledWith('2026年09月01日', expect.any(Number), expect.any(Number))

    datedImage.dateStamp.enabled = false
    contextMock.fillText.mockClear()
    renderA4ToContext(context, slots, undefined, 'chinese')
    expect(contextMock.fillText).not.toHaveBeenCalled()
  })
})
