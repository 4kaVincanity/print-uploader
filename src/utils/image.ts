import type { ImageEntry } from '../store/editor.types'
import { IMAGE_IMPORT_CONFIG } from '../config'

export function validateImageFile(file: File): string | null {
  const supportedTypes: readonly string[] = IMAGE_IMPORT_CONFIG.supportedTypes
  if (!supportedTypes.includes(file.type)) {
    return `${file.name}：仅支持 JPG、PNG 或 WebP`
  }

  if (file.size > IMAGE_IMPORT_CONFIG.maxFileSizeBytes) {
    return `${file.name}：文件不能超过 25 MB`
  }

  return null
}

export function decodeImageFile(file: File): Promise<Omit<ImageEntry, 'id' | 'crop' | 'dateStamp'>> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      if (!image.naturalWidth || !image.naturalHeight) {
        URL.revokeObjectURL(url)
        reject(new Error(`${file.name}：图片尺寸无效`))
        return
      }

      resolve({
        file,
        name: file.name,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        decoded: image,
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`${file.name}：图片无法读取`))
    }

    image.src = url
  })
}
