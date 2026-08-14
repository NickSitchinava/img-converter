import { getPreset, resolveOutputSize, type SizePresetId } from './sizes'

export type OutputFormat = 'png' | 'jpg' | 'webp'

const MIME: Record<OutputFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
}

export type LoadedImage = {
  id: string
  file: File
  bitmap: ImageBitmap
  previewUrl: string
  width: number
  height: number
}

export async function loadImageFile(file: File): Promise<LoadedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please drop an image file.')
  }

  const bitmap = await createImageBitmap(file)
  const previewUrl = URL.createObjectURL(file)

  return {
    id: crypto.randomUUID(),
    file,
    bitmap,
    previewUrl,
    width: bitmap.width,
    height: bitmap.height,
  }
}

export function revokeLoadedImage(image: LoadedImage | null): void {
  if (!image) return
  try {
    URL.revokeObjectURL(image.previewUrl)
  } catch {
    /* already revoked */
  }
  try {
    image.bitmap.close()
  } catch {
    /* already closed */
  }
}

export type ConvertOptions = {
  format: OutputFormat
  presetId: SizePresetId
  /** 0–1 for JPG/WebP; ignored for PNG */
  quality: number
}

export async function convertImage(
  bitmap: ImageBitmap,
  options: ConvertOptions,
): Promise<Blob> {
  const preset = getPreset(options.presetId)
  const { width, height } = resolveOutputSize(bitmap.width, bitmap.height, preset)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  if (options.format === 'jpg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(bitmap, 0, 0, width, height)

  const mime = MIME[options.format]
  const quality =
    options.format === 'png' ? undefined : Math.min(1, Math.max(0.01, options.quality))

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, quality)
  })

  if (!blob) throw new Error('Conversion failed — format may be unsupported.')
  return blob
}
