export const PRINT_CONFIG = {
  widthPx: 2480,
  heightPx: 3508,
  dpi: 300,
  columns: 3,
  rows: 3,
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
  maxImages: PRINT_CONFIG.columns * PRINT_CONFIG.rows,
} as const
