import type { CardTemplate, Illustration } from '../store/beanCard'
export interface BeanText { name: string; variety: string; altitude: string; originCountry: string; isBlend: boolean; process: string; roast: string; flavor: string; supplement: string; shopName: string }
// Matches one 3×3 slot in the existing 2480×3508 A4 layout, avoiding crop on reuse.
export const cardSize = (template: CardTemplate) => template === 'square' ? { width: 1600, height: 1600 } : { width: 827, height: 1169 }
function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, size: number, color = '#090909') { if (!value) return; context.fillStyle = color; context.font = `${size}px Libian, serif`; context.fillText(value, x, y) }
export function renderBeanCard(context: CanvasRenderingContext2D, template: CardTemplate, data: BeanText, illustrations: Illustration[]) {
  const { width, height } = cardSize(template); context.fillStyle = '#fff'; context.fillRect(0, 0, width, height)
  // The portrait canvas is a single 3×3 slot (827×1169), so it uses the
  // reference card's compact coordinates rather than the legacy A4 pixels.
  const layout = template === 'square'
    ? { titleY: 460, fieldY: 680, font: 70, title: 95, shopY: 1490 }
    : { titleY: 520, fieldY: 650, font: 38, title: 50, shopY: 1090 }
  for (const item of [...illustrations].sort((a, b) => a.zIndex - b.zIndex)) { const base = Math.min(width, height) * item.scale; const ratio = item.width / item.height; const w = ratio >= 1 ? base : base * ratio; const h = ratio >= 1 ? base / ratio : base; context.drawImage(item.image, item.x * width - w / 2, item.y * height - h / 2, w, h) }
  text(context, data.name, width * .065, layout.titleY, layout.title)
  const labels = data.isBlend ? [['原產國 / ', data.originCountry], ['生產處理 / ', data.process], ['焙煎度 / ', data.roast]] : [['品種 / ', data.variety], ['標高 / ', data.altitude], ['生產處理 / ', data.process], ['烘煎度 / ', data.roast]]
  labels.forEach(([label, value], index) => text(context, `${label}${value}`, width * .065, layout.fieldY + index * layout.font * 1.6, layout.font))
  text(context, data.flavor, width * .065, layout.fieldY + labels.length * layout.font * 1.6, layout.font, '#e6352c')
  text(context, data.supplement, width * .065, layout.fieldY + (labels.length + 1) * layout.font * 1.6, layout.font * .78)
  text(context, data.shopName, width * .39, layout.shopY, layout.font)
}
export async function createBeanCardPng(template: CardTemplate, data: BeanText, illustrations: Illustration[]) { const { width, height } = cardSize(template); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d', { alpha: false }); if (!context) throw new Error('無法建立畫布'); renderBeanCard(context, template, data, illustrations); const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png')); if (!blob) throw new Error('PNG 編碼失敗'); return blob }
