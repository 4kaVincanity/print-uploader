import { describe, expect, it } from 'vitest'
import {
  A4_HEIGHT_PX,
  A4_WIDTH_PX,
  createA4Layout,
  createCropGuides,
  mmToPx,
  normalizeLayoutSettings,
} from '../../src/utils/layout'

describe('A4 layout', () => {
  it('converts millimeters using 300 DPI', () => {
    expect(mmToPx(25.4)).toBe(300)
  })

  it('fills the page by default with zero margin and zero gap', () => {
    const layout = createA4Layout()
    expect(layout).toHaveLength(9)
    expect(layout[0]).toEqual({ x: 0, y: 0, width: 826, height: 1169 })

    const last = layout[8]
    expect(last).toBeDefined()
    expect(last!.x + last!.width).toBe(A4_WIDTH_PX)
    expect(last!.y + last!.height).toBe(A4_HEIGHT_PX)
  })

  it('lays out the 99 x 52.5 mm size as three columns and four rows', () => {
    const layout = createA4Layout({ sizeId: 'card995x52_5', marginMm: 0, gapMm: 0 })
    expect(layout).toHaveLength(12)
    expect(layout[0]).toEqual({ x: 0, y: 0, width: 1169, height: 620 })
    expect(layout[2]!.x + layout[2]!.width).toBe(3508)
    expect(layout[11]!.y + layout[11]!.height).toBe(2480)
  })

  it('applies custom margin and gap while assigning rounding remainder to final tracks', () => {
    const layout = createA4Layout({ sizeId: 'a4', marginMm: 10, gapMm: 5 })
    expect(layout[0]).toEqual({ x: 118, y: 118, width: 708, height: 1051 })
    expect(layout[1]!.x - (layout[0]!.x + layout[0]!.width)).toBe(59)
    expect(layout[3]!.y - (layout[0]!.y + layout[0]!.height)).toBe(59)
    expect(layout[8]!.x + layout[8]!.width).toBe(A4_WIDTH_PX - 118)
    expect(layout[8]!.y + layout[8]!.height).toBe(A4_HEIGHT_PX - 118)
  })

  it('clamps settings to configured bounds', () => {
    expect(normalizeLayoutSettings({ sizeId: 'a4', marginMm: 99, gapMm: -4 })).toEqual({
      sizeId: 'a4',
      marginMm: 30,
      gapMm: 0,
    })
  })

  it('creates only two vertical and two horizontal internal crop guides', () => {
    const guides = createCropGuides()

    expect(guides).toHaveLength(4)
    expect(guides.map((guide) => guide.orientation)).toEqual([
      'vertical',
      'vertical',
      'horizontal',
      'horizontal',
    ])
    expect(guides).not.toContainEqual(
      expect.objectContaining({ x1: 0, x2: 0 }),
    )
    expect(guides).not.toContainEqual(
      expect.objectContaining({ y1: 0, y2: 0 }),
    )
    expect(guides).not.toContainEqual(
      expect.objectContaining({ x1: A4_WIDTH_PX, x2: A4_WIDTH_PX }),
    )
    expect(guides).not.toContainEqual(
      expect.objectContaining({ y1: A4_HEIGHT_PX, y2: A4_HEIGHT_PX }),
    )
  })

  it('places zero-gap guides on shared slot boundaries', () => {
    const slots = createA4Layout({ marginMm: 0, gapMm: 0 })
    const guides = createCropGuides({ marginMm: 0, gapMm: 0 })

    expect(guides[0]!.x1).toBe(slots[0]!.x + slots[0]!.width)
    expect(guides[1]!.x1).toBe(slots[1]!.x + slots[1]!.width)
    expect(guides[2]!.y1).toBe(slots[0]!.y + slots[0]!.height)
    expect(guides[3]!.y1).toBe(slots[3]!.y + slots[3]!.height)
  })

  it('centers nonzero-gap guides and limits them to the image-grid region', () => {
    const settings = { marginMm: 10, gapMm: 5 }
    const slots = createA4Layout(settings)
    const guides = createCropGuides(settings)
    const first = slots[0]!
    const last = slots[8]!

    expect(guides[0]!.x1).toBe((first.x + first.width + slots[1]!.x) / 2)
    expect(guides[2]!.y1).toBe((first.y + first.height + slots[3]!.y) / 2)
    expect(guides[0]).toMatchObject({ y1: first.y, y2: last.y + last.height })
    expect(guides[2]).toMatchObject({ x1: first.x, x2: last.x + last.width })
  })
})
