import { describe, expect, it } from 'vitest'
import { getCoverSourceRect, normalizeCrop, panCrop } from '../../src/utils/crop'

describe('crop calculations', () => {
  it('crops a landscape source for a portrait destination', () => {
    const rect = getCoverSourceRect(4000, 2000, 700, 1050, {
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
    })
    expect(rect.height).toBe(2000)
    expect(rect.width).toBeCloseTo(1333.33, 1)
    expect(rect.x).toBeCloseTo(1333.33, 1)
  })

  it('crops a portrait source without exposing blank space', () => {
    const rect = getCoverSourceRect(2000, 4000, 700, 1050, {
      zoom: 2,
      offsetX: 1,
      offsetY: -1,
    })
    expect(rect.x).toBeCloseTo(1000)
    expect(rect.y).toBe(0)
    expect(rect.x + rect.width).toBeLessThanOrEqual(2000)
    expect(rect.y + rect.height).toBeLessThanOrEqual(4000)
  })

  it('handles square sources and clamps zoom and offsets', () => {
    expect(normalizeCrop({ zoom: 9, offsetX: -4, offsetY: 3 })).toEqual({
      zoom: 3,
      offsetX: -1,
      offsetY: 1,
    })
    expect(panCrop({ zoom: 1, offsetX: 0.9, offsetY: -0.9 }, 0.5, -0.5)).toEqual({
      zoom: 1,
      offsetX: 1,
      offsetY: -1,
    })
  })
})
