import { useEffect, useRef, useState } from 'react'
import { convertImage, type ConvertOptions, type LoadedImage } from '../lib/convert'

export type ExportPreviewStatus = 'idle' | 'pending' | 'ready' | 'error'

export type ExportPreview = {
  blob: Blob | null
  previewUrl: string | null
  bytes: number | null
  status: ExportPreviewStatus
  error: string | null
}

const DEBOUNCE_MS = 300

export function useExportPreview(
  image: LoadedImage | null,
  options: ConvertOptions,
): ExportPreview {
  const [state, setState] = useState<ExportPreview>({
    blob: null,
    previewUrl: null,
    bytes: null,
    status: 'idle',
    error: null,
  })

  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!image) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setState({ blob: null, previewUrl: null, bytes: null, status: 'idle', error: null })
      return
    }

    let cancelled = false
    setState((prev) => ({ ...prev, status: 'pending', error: null }))

    const timer = window.setTimeout(async () => {
      try {
        const blob = await convertImage(image.bitmap, options)
        if (cancelled) return

        const url = URL.createObjectURL(blob)
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current)
        }
        previewUrlRef.current = url

        setState({
          blob,
          previewUrl: url,
          bytes: blob.size,
          status: 'ready',
          error: null,
        })
      } catch (err) {
        if (cancelled) return
        setState({
          blob: null,
          previewUrl: previewUrlRef.current,
          bytes: null,
          status: 'error',
          error: err instanceof Error ? err.message : 'Preview failed.',
        })
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [image, options.format, options.presetId, options.quality])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  return state
}
