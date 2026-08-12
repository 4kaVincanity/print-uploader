import type { BeanRecord } from '../store/beanCard'

export type BeanFields = Omit<BeanRecord, 'id'>

export function parseBeanText(source: string): Partial<BeanFields> {
  const lines = source.replaceAll('\r', '\n').split('\n').map((line) => line.trim()).filter(Boolean)
  const result: Partial<BeanFields> = {}
  if (!lines.length) return result
  result.name = lines.shift() ?? ''
  for (const line of lines) {
    const match = line.match(/^([^/／]+)[/／]\s*(.+)$/)
    if (!match) continue
    const label = (match[1] ?? '').replaceAll(/\s/g, '')
    const value = (match[2] ?? '').trim()
    if (/原產國|產國/.test(label)) { result.originCountry = value; result.isBlend = true }
    else if (/品種|批次/.test(label)) result.variety = value
    else if (/標高|海拔/.test(label)) result.altitude = value
    else if (/處理|處理法|生產/.test(label)) result.process = value
    else if (/焙煎|烘焙|烘煎/.test(label)) result.roast = value
    else if (/風味|花香|果香|香氣|調性/.test(label)) result.flavor = value
    else if (/補充|补充/.test(label)) result.supplement = value
  }
  return result
}
