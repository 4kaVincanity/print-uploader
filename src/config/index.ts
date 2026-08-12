export const PRINT_SIZES = {
  a4: { label: 'A4 竖版（3×3）', widthPx: 2480, heightPx: 3508, columns: 3, rows: 3 },
  card995x52_5: {
    label: '99 × 52.5 mm（3×4）',
    widthPx: Math.round((99 / 25.4) * 300 * 3),
    heightPx: Math.round((52.5 / 25.4) * 300 * 4),
    columns: 3,
    rows: 4,
  },
} as const

export const PRINT_CONFIG = {
  ...PRINT_SIZES.a4,
  dpi: 300,
  marginMm: {
    default: 0,
    min: 0,
    max: 30,
    step: 1,
  },
  gapMm: {
    default: 0,
    min: 0,
    max: 20,
    step: 1,
  },
} as const

export const CROP_GUIDE_CONFIG = {
  color: '#5f6368',
  previewLineWidthPx: 1,
  exportLineWidthPx: 3,
  exportDashPx: [18, 12],
} as const

export const IMAGE_IMPORT_CONFIG = {
  supportedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSizeBytes: 25 * 1024 * 1024,
} as const
