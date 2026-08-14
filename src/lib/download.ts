export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadZip(files: { name: string; blob: Blob }[], zipName = 'converted.zip'): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const used = new Map<string, number>()

  for (const { name, blob } of files) {
    let finalName = name
    const count = used.get(name) ?? 0
    if (count > 0) {
      const dot = name.lastIndexOf('.')
      const base = dot >= 0 ? name.slice(0, dot) : name
      const ext = dot >= 0 ? name.slice(dot) : ''
      finalName = `${base}-${count}${ext}`
    }
    used.set(name, count + 1)
    zip.file(finalName, blob)
  }

  const content = await zip.generateAsync({ type: 'blob' })
  downloadBlob(content, zipName)
}

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w\-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function buildOutputFilename(
  originalName: string,
  format: 'png' | 'jpg' | 'webp',
  presetId: string,
  customName?: string,
): string {
  const trimmed = customName?.trim() ?? ''
  const base = trimmed
    ? sanitizeBaseName(trimmed)
    : sanitizeBaseName(originalName) || 'image'
  const safe = base || 'image'
  const suffix = presetId === 'original' ? '' : `-${presetId}`
  return `${safe}${suffix}.${format}`
}
